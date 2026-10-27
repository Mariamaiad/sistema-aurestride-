"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin, createSessionClient } from "@/lib/supabase/server";
import { SITE_TAG, mergeSettings } from "@/lib/content";
import { RESOURCES, fieldErrors, type ResourceKey } from "@/lib/admin/resources";
import { SETTINGS_PAGES, getPath, setPath, validateSettingValue, type SettingsPage } from "@/lib/admin/settings-fields";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, MEDIA_BUCKET } from "@/lib/env";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NOT_ADMIN: ActionResult = { ok: false, error: "Sessão expirada ou sem permissão. Entre novamente." };

function refreshSite() {
  updateTag(SITE_TAG);
  revalidatePath("/", "layout");
}

const friendly = (msg: string) => {
  if (/duplicate key.*slug/i.test(msg)) return "Já existe um projeto com esse endereço (URL). Escolha outro.";
  if (/videos_within_contents/.test(msg)) return "Os vídeos não podem ser mais que a quantidade de conteúdos.";
  if (/price_range_valid/.test(msg)) return "O valor máximo deve ser maior ou igual ao mínimo.";
  if (/row-level security|permission denied/i.test(msg)) return "Sem permissão para esta alteração.";
  return "Não foi possível salvar. Tente novamente.";
};

/* ------------------------------------------------------------------ */
/* Autenticação                                                         */
/* ------------------------------------------------------------------ */

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(6, "Senha muito curta."),
});

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, error: "Confira os campos.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, error: "O Supabase ainda não foi configurado (veja o README)." };
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "E-mail ou senha incorretos." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

/* ------------------------------------------------------------------ */
/* Configurações gerais (site_settings)                                 */
/* ------------------------------------------------------------------ */

export async function saveSettings(page: SettingsPage, values: Record<string, unknown>): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const def = SETTINGS_PAGES[page];
  if (!def) return { ok: false, error: "Página inválida." };

  const { data: row, error: readErr } = await admin.supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (readErr) return { ok: false, error: friendly(readErr.message) };

  let next = mergeSettings(row?.data) as unknown as Record<string, unknown>;
  const errors: Record<string, string> = {};
  for (const group of def.groups) {
    for (const f of group.fields) {
      if (!(f.path in values)) continue;
      let v = values[f.path];
      if (typeof v === "string") v = v.trim();
      if (f.type === "list" && Array.isArray(v)) v = v.map((x) => String(x).trim()).filter(Boolean);
      if (f.type === "highlights" && Array.isArray(v))
        v = v.map((x) => ({ title: String(x?.title ?? "").trim(), text: String(x?.text ?? "").trim() })).filter((x) => x.title);
      const err = validateSettingValue(f, v);
      if (err) errors[f.path] = err;
      else next = setPath(next, f.path, v);
    }
  }
  if (getPath(next, "brand.name") === "") errors["brand.name"] = "Informe o nome da empresa.";
  if (Object.keys(errors).length) return { ok: false, error: "Confira os campos destacados.", fieldErrors: errors };

  const { error } = await admin.supabase.from("site_settings").upsert({ id: 1, data: next });
  if (error) return { ok: false, error: friendly(error.message) };
  refreshSite();
  return { ok: true, message: "Alterações salvas e publicadas no site." };
}

/* ------------------------------------------------------------------ */
/* Listas (serviços, planos, equipe...)                                 */
/* ------------------------------------------------------------------ */

const NULLABLE_TEXT = new Set(["photo_url", "image_url", "cover_url", "icon", "price_label", "notes", "results", "external_url"]);
const idSchema = z.string().uuid();

function toRow(key: ResourceKey, data: Record<string, unknown>) {
  const res = RESOURCES[key];
  const row: Record<string, unknown> = { ...data, ...(res.fixed ?? {}) };
  for (const k of Object.keys(row)) if (NULLABLE_TEXT.has(k) && row[k] === "") row[k] = null;
  delete row.items;
  delete row.images;
  return row;
}

export async function saveRecord(
  key: ResourceKey,
  id: string | null,
  data: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const res = RESOURCES[key];
  if (!res) return { ok: false, error: "Módulo inválido." };
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "Registro inválido." };

  const parsed = res.schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };
  const clean = parsed.data;
  const row = toRow(key, clean);
  const db = admin.supabase;

  // Apenas um plano recomendado por vez.
  if (key === "plans" && clean.highlighted === true) {
    const q = db.from("marketing_plans").update({ highlighted: false }).eq("highlighted", true);
    await (id ? q.neq("id", id) : q);
  }

  let recordId = id;
  if (id) {
    const { error } = await db.from(res.table).update(row).eq("id", id);
    if (error) return { ok: false, error: friendly(error.message) };
  } else {
    let q = db.from(res.table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
    for (const [k, v] of Object.entries(res.fixed ?? {})) q = q.eq(k, v);
    const { data: last } = await q;
    row.sort_order = ((last?.[0]?.sort_order as number | undefined) ?? -1) + 1;
    const { data: inserted, error } = await db.from(res.table).insert(row).select("id").single();
    if (error) return { ok: false, error: friendly(error.message) };
    recordId = inserted.id as string;
  }

  // Filhos: substitui a lista inteira na ordem informada.
  if (res.children === "plan_items") {
    const items = (clean.items as string[]) ?? [];
    const del = await db.from("plan_items").delete().eq("plan_id", recordId!);
    if (del.error) return { ok: false, error: friendly(del.error.message) };
    if (items.length) {
      const ins = await db.from("plan_items").insert(items.map((text, i) => ({ plan_id: recordId, text, sort_order: i })));
      if (ins.error) return { ok: false, error: friendly(ins.error.message) };
    }
  }
  if (res.children === "project_images") {
    const images = (clean.images as { url: string; alt: string }[]) ?? [];
    const del = await db.from("project_images").delete().eq("project_id", recordId!);
    if (del.error) return { ok: false, error: friendly(del.error.message) };
    if (images.length) {
      const ins = await db
        .from("project_images")
        .insert(images.map((im, i) => ({ project_id: recordId, url: im.url, alt: im.alt, sort_order: i })));
      if (ins.error) return { ok: false, error: friendly(ins.error.message) };
    }
  }

  refreshSite();
  return { ok: true, message: id ? "Alterações salvas." : `Novo ${res.singular} criado.`, data: { id: recordId! } };
}

export async function deleteRecord(key: ResourceKey, id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const res = RESOURCES[key];
  if (!res || !idSchema.safeParse(id).success) return { ok: false, error: "Registro inválido." };
  const { error } = await admin.supabase.from(res.table).delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refreshSite();
  return { ok: true, message: "Excluído." };
}

export async function reorderRecords(key: ResourceKey, ids: string[]): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const res = RESOURCES[key];
  if (!res || !z.array(idSchema).max(200).safeParse(ids).success) return { ok: false, error: "Ordem inválida." };
  const results = await Promise.all(
    ids.map((id, i) => admin.supabase.from(res.table).update({ sort_order: i }).eq("id", id))
  );
  const err = results.find((r) => r.error)?.error;
  if (err) return { ok: false, error: friendly(err.message) };
  refreshSite();
  return { ok: true, message: "Ordem atualizada." };
}

export async function setRecordFlag(
  key: ResourceKey,
  id: string,
  field: "active" | "visible" | "status",
  value: boolean | "draft" | "published"
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const res = RESOURCES[key];
  if (!res || !idSchema.safeParse(id).success) return { ok: false, error: "Registro inválido." };
  const allowed =
    (field === "status" && key === "projects" && (value === "draft" || value === "published")) ||
    (field === res.toggleField && typeof value === "boolean");
  if (!allowed) return { ok: false, error: "Alteração inválida." };
  const { error } = await admin.supabase.from(res.table).update({ [field]: value }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refreshSite();
  const msg =
    field === "status" ? (value === "published" ? "Projeto publicado." : "Projeto voltou para rascunho.") : value ? `${res.toggleLabels[0]}.` : `${res.toggleLabels[1]}.`;
  return { ok: true, message: msg };
}

export async function duplicatePlan(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Registro inválido." };
  const db = admin.supabase;
  const { data: plan, error } = await db.from("marketing_plans").select("*, plan_items(text, sort_order)").eq("id", id).single();
  if (error || !plan) return { ok: false, error: "Plano não encontrado." };
  const { data: last } = await db.from("marketing_plans").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, plan_items, created_at: _c, updated_at: _u, ...rest } = plan;
  const { data: copy, error: insErr } = await db
    .from("marketing_plans")
    .insert({ ...rest, name: `${plan.name} (cópia)`, highlighted: false, active: false, sort_order: (last?.[0]?.sort_order ?? 0) + 1 })
    .select("id")
    .single();
  if (insErr || !copy) return { ok: false, error: friendly(insErr?.message ?? "") };
  const items = (plan_items as { text: string; sort_order: number }[]) ?? [];
  if (items.length) {
    await db.from("plan_items").insert(items.map((it) => ({ plan_id: copy.id, text: it.text, sort_order: it.sort_order })));
  }
  refreshSite();
  return { ok: true, message: "Plano duplicado (inativo). Revise e ative quando quiser." };
}

/* ------------------------------------------------------------------ */
/* Imagens                                                              */
/* ------------------------------------------------------------------ */

const mediaSchema = z.object({
  path: z.string().min(3).max(300).regex(/^[a-z0-9-]+\/[a-z0-9-]+\.(jpg|jpeg|png|webp|avif)$/),
  mime: z.enum(ALLOWED_IMAGE_TYPES as [string, ...string[]]),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

/** Registra na biblioteca de mídia um arquivo já enviado ao Storage pelo navegador. */
export async function recordMedia(input: { path: string; mime: string; size: number }): Promise<ActionResult<{ url: string }>> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const parsed = mediaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Arquivo inválido." };
  const { data } = admin.supabase.storage.from(MEDIA_BUCKET).getPublicUrl(parsed.data.path);
  const { error } = await admin.supabase.from("media").insert({
    path: parsed.data.path,
    url: data.publicUrl,
    mime_type: parsed.data.mime,
    size_bytes: parsed.data.size,
    created_by: admin.user.id,
  });
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true, data: { url: data.publicUrl } };
}

/* ------------------------------------------------------------------ */
/* Leads                                                                */
/* ------------------------------------------------------------------ */

export async function setLeadStatus(id: string, status: "new" | "contacted" | "archived"): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success || !["new", "contacted", "archived"].includes(status)) return { ok: false, error: "Inválido." };
  const { error } = await admin.supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/admin/contatos-recebidos");
  return { ok: true, message: "Status atualizado." };
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Inválido." };
  const { error } = await admin.supabase.from("leads").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/admin/contatos-recebidos");
  return { ok: true, message: "Contato excluído." };
}
