"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/admin/resources";
import { activitySchema, clientSchema, taskSchema, todayISO } from "@/lib/admin/clients";
import type { ActionResult } from "./actions";

const NOT_ADMIN = { ok: false, error: "Sessão expirada ou sem permissão. Entre novamente." } as const;
const idSchema = z.string().uuid();

const friendly = (msg: string) => {
  if (/row-level security|permission denied/i.test(msg)) return "Sem permissão para esta alteração.";
  if (/clients_lead_unique/.test(msg)) return "Este contato já foi transformado em cliente.";
  if (/relation .*clients.* does not exist/i.test(msg)) return "A tabela de clientes ainda não existe no banco. Aplique a migração nova (veja o README).";
  return "Não foi possível salvar. Tente novamente.";
};

function refresh(clientId?: string) {
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");
  if (clientId) revalidatePath(`/admin/clientes/${clientId}`);
}

/* ---------------- ficha do cliente ---------------- */

export async function saveClient(id: string | null, data: Record<string, unknown>): Promise<ActionResult<{ id: string }>> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (id !== null && !idSchema.safeParse(id).success) return { ok: false, error: "Cliente inválido." };
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };
  const row = { ...parsed.data, services: parsed.data.services.filter(Boolean) };

  if (id) {
    const { error } = await admin.supabase.from("clients").update(row).eq("id", id);
    if (error) return { ok: false, error: friendly(error.message) };
    refresh(id);
    return { ok: true, message: "Ficha do cliente salva.", data: { id } };
  }
  const { data: inserted, error } = await admin.supabase.from("clients").insert(row).select("id").single();
  if (error || !inserted) return { ok: false, error: friendly(error?.message ?? "") };
  refresh(inserted.id);
  return { ok: true, message: "Cliente cadastrado.", data: { id: inserted.id as string } };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success) return { ok: false, error: "Cliente inválido." };
  const { error } = await admin.supabase.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh();
  return { ok: true, message: "Cliente excluído, com tarefas e histórico." };
}

/** Atualiza só a data (e o lembrete) do próximo contato. */
export async function setNextContact(id: string, next_contact: string | null, note: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  const parsed = z
    .object({ id: idSchema, next_contact: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]), note: z.string().trim().max(300) })
    .safeParse({ id, next_contact, note });
  if (!parsed.success) return { ok: false, error: "Data inválida." };
  const { error } = await admin.supabase
    .from("clients")
    .update({ next_contact: parsed.data.next_contact, next_contact_note: parsed.data.note })
    .eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh(id);
  return { ok: true, message: next_contact ? "Próximo contato agendado." : "Próximo contato removido." };
}

/* ---------------- histórico de atendimento ---------------- */

export async function addActivity(clientId: string, data: Record<string, unknown>): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(clientId).success) return { ok: false, error: "Cliente inválido." };
  const parsed = activitySchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Confira os campos.", fieldErrors: fieldErrors(parsed.error) };
  const { next_contact, ...activity } = parsed.data;

  const { error } = await admin.supabase
    .from("client_activities")
    .insert({ ...activity, client_id: clientId, author_email: admin.user.email ?? null });
  if (error) return { ok: false, error: friendly(error.message) };

  if (next_contact !== undefined) {
    const upd = await admin.supabase.from("clients").update({ next_contact, next_contact_note: "" }).eq("id", clientId);
    if (upd.error) return { ok: false, error: friendly(upd.error.message) };
  }
  refresh(clientId);
  return { ok: true, message: next_contact ? "Interação registrada e próximo contato agendado." : "Interação registrada." };
}

export async function deleteActivity(clientId: string, id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(clientId).success) return { ok: false, error: "Registro inválido." };
  const { error } = await admin.supabase.from("client_activities").delete().eq("id", id).eq("client_id", clientId);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh(clientId);
  return { ok: true, message: "Registro excluído." };
}

/* ---------------- tarefas ---------------- */

export async function addTask(clientId: string, data: Record<string, unknown>): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(clientId).success) return { ok: false, error: "Cliente inválido." };
  const parsed = taskSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Confira os campos.", fieldErrors: fieldErrors(parsed.error) };
  const { error } = await admin.supabase.from("client_tasks").insert({ ...parsed.data, client_id: clientId });
  if (error) return { ok: false, error: friendly(error.message) };
  refresh(clientId);
  return { ok: true, message: "Tarefa adicionada." };
}

export async function setTaskDone(clientId: string, id: string, done: boolean): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(clientId).success || typeof done !== "boolean")
    return { ok: false, error: "Tarefa inválida." };
  const { error } = await admin.supabase.from("client_tasks").update({ done }).eq("id", id).eq("client_id", clientId);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh(clientId);
  return { ok: true, message: done ? "Tarefa concluída." : "Tarefa reaberta." };
}

export async function deleteTask(clientId: string, id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(clientId).success) return { ok: false, error: "Tarefa inválida." };
  const { error } = await admin.supabase.from("client_tasks").delete().eq("id", id).eq("client_id", clientId);
  if (error) return { ok: false, error: friendly(error.message) };
  refresh(clientId);
  return { ok: true, message: "Tarefa excluída." };
}

/* ---------------- contato do site → cliente ---------------- */

export async function leadToClient(leadId: string): Promise<ActionResult<{ id: string }>> {
  const admin = await getAdmin();
  if (!admin) return NOT_ADMIN;
  if (!idSchema.safeParse(leadId).success) return { ok: false, error: "Contato inválido." };
  const db = admin.supabase;

  const { data: existing } = await db.from("clients").select("id").eq("lead_id", leadId).maybeSingle();
  if (existing) return { ok: true, message: "Este contato já é cliente. Abrindo a ficha.", data: { id: existing.id as string } };

  const { data: lead, error: leadErr } = await db
    .from("leads")
    .select("id, name, email, phone, company, interest, message")
    .eq("id", leadId)
    .maybeSingle();
  if (leadErr || !lead) return { ok: false, error: "Contato não encontrado." };

  const { data: client, error } = await db
    .from("clients")
    .insert({
      name: (lead.company || lead.name).slice(0, 160),
      contact_name: lead.company ? lead.name.slice(0, 120) : "",
      phone: (lead.phone ?? "").slice(0, 40),
      email: (lead.email ?? "").slice(0, 200),
      plan: (lead.interest ?? "").slice(0, 120),
      status: "prospect",
      health: "good",
      next_contact: todayISO(),
      next_contact_note: "Responder o contato recebido pelo site.",
      lead_id: lead.id,
    })
    .select("id")
    .single();
  if (error || !client) return { ok: false, error: friendly(error?.message ?? "") };

  await db.from("client_activities").insert({
    client_id: client.id,
    kind: "note",
    content: `Mensagem recebida pelo site${lead.interest ? ` (interesse: ${lead.interest})` : ""}:\n\n${lead.message}`.slice(0, 3000),
    happened_on: todayISO(),
    author_email: admin.user.email ?? null,
  });
  await db.from("leads").update({ status: "contacted" }).eq("id", lead.id);

  revalidatePath("/admin/contatos-recebidos");
  refresh(client.id as string);
  return { ok: true, message: "Cliente criado a partir do contato.", data: { id: client.id as string } };
}
