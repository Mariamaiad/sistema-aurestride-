import "server-only";
import seed from "../../../supabase/seed/content.json";
import { getAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { mergeSettings } from "@/lib/content";
import { RESOURCES, type ResourceKey } from "./resources";
import type { SiteSettings } from "@/lib/types";

/**
 * Pré-visualização do painel sem Supabase (somente leitura), para conferir a interface
 * em desenvolvimento. Nunca ativa em produção.
 */
export const adminPreviewMode = !isSupabaseConfigured && process.env.NODE_ENV === "development" && process.env.ADMIN_PREVIEW === "1";

type Row = Record<string, unknown> & { id: string };

function previewRows(key: ResourceKey): Row[] {
  const res = RESOURCES[key];
  const mk = (arr: Record<string, unknown>[], extra: Record<string, unknown> = {}) =>
    arr.map((r, i) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, sort_order: i, active: true, visible: true, ...extra, ...r }));
  switch (key) {
    case "team":
      return mk(seed.team as Record<string, unknown>[]);
    case "plans":
      return mk(seed.plans.map((p) => ({ ...p, price_suffix: "/mês", show_price: true })));
    case "web_pricing":
      return mk(seed.web_pricing.map((w) => ({ ...w, show_price: true })));
    case "projects":
      return mk(seed.projects.map((p) => ({ ...p, cover_url: "", images: [] })));
    case "steps":
      return mk(seed.process_steps);
    case "faqs":
      return mk(seed.faqs);
    default:
      return mk(seed.services.filter((s) => s.category === res.fixed?.category) as Record<string, unknown>[]);
  }
}

export async function loadResource(key: ResourceKey): Promise<Row[]> {
  if (adminPreviewMode) return previewRows(key);
  const admin = await getAdmin();
  if (!admin) return [];
  const res = RESOURCES[key];
  const select =
    res.children === "plan_items"
      ? "*, plan_items(text, sort_order)"
      : res.children === "project_images"
        ? "*, project_images(url, alt, sort_order)"
        : "*";
  let q = admin.supabase.from(res.table).select(select).order("sort_order");
  for (const [k, v] of Object.entries(res.fixed ?? {})) q = q.eq(k, v);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const out: Row = { ...r };
    if (r.price != null) out.price = Number(r.price);
    if (r.price_min != null) out.price_min = Number(r.price_min);
    if (r.price_max != null) out.price_max = Number(r.price_max);
    if (Array.isArray(r.plan_items)) {
      out.items = [...(r.plan_items as { text: string; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.text);
      delete out.plan_items;
    }
    if (Array.isArray(r.project_images)) {
      out.images = [...(r.project_images as { url: string; alt: string; sort_order: number }[])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ url, alt }) => ({ url, alt }));
      delete out.project_images;
    }
    return out;
  });
}

export async function loadSettings(): Promise<SiteSettings> {
  if (adminPreviewMode) return mergeSettings(null);
  const admin = await getAdmin();
  if (!admin) return mergeSettings(null);
  const { data, error } = await admin.supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return mergeSettings(data?.data);
}

export interface DashboardData {
  services: { active: number; total: number };
  plans: { active: number; total: number };
  projects: { published: number; drafts: number };
  team: { visible: number; total: number };
  faqs: number;
  newLeads: number;
  placeholders: string[];
  missingContacts: string[];
}

export async function loadDashboard(): Promise<DashboardData> {
  const [settings, team, plans, projects, faqs, svcM, svcW, svcS] = await Promise.all([
    loadSettings(),
    loadResource("team"),
    loadResource("plans"),
    loadResource("projects"),
    loadResource("faqs"),
    loadResource("services_marketing"),
    loadResource("services_web"),
    loadResource("services_sistemas"),
  ]);
  const services = [...svcM, ...svcW, ...svcS];

  let newLeads = 0;
  if (!adminPreviewMode) {
    const admin = await getAdmin();
    const { count } = (await admin?.supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new")) ?? {};
    newLeads = count ?? 0;
  }

  const ph = /\[(texto provisório|editar|rascunho)/i;
  const placeholders: string[] = [];
  team.forEach((m) => {
    if ([m.role, m.bio, ...((m.skills as string[]) ?? [])].some((v) => ph.test(String(v ?? "")))) placeholders.push(`Perfil de ${m.name}`);
  });
  projects.forEach((p) => {
    if ([p.summary, p.challenge, p.solution].some((v) => ph.test(String(v ?? "")))) placeholders.push(`Projeto ${p.title}`);
  });
  if (ph.test(settings.privacy.content)) placeholders.push("Política de privacidade");

  const missingContacts: string[] = [];
  if (!settings.contact.whatsapp) missingContacts.push("WhatsApp");
  if (!settings.contact.email) missingContacts.push("E-mail");
  if (!settings.contact.instagram) missingContacts.push("Instagram");
  if (!settings.seo.site_url) missingContacts.push("Endereço oficial do site (SEO)");

  return {
    services: { active: services.filter((s) => s.active).length, total: services.length },
    plans: { active: plans.filter((p) => p.active).length, total: plans.length },
    projects: {
      published: projects.filter((p) => p.status === "published").length,
      drafts: projects.filter((p) => p.status !== "published").length,
    },
    team: { visible: team.filter((t) => t.visible).length, total: team.length },
    faqs: faqs.length,
    newLeads,
    placeholders,
    missingContacts,
  };
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  interest: string | null;
  message: string;
  status: "new" | "contacted" | "archived";
  created_at: string;
}

export async function loadLeads(): Promise<Lead[]> {
  if (adminPreviewMode) return [];
  const admin = await getAdmin();
  if (!admin) return [];
  const { data, error } = await admin.supabase
    .from("leads")
    .select("id, name, email, phone, company, interest, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}
