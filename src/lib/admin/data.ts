import "server-only";
import seed from "../../../supabase/seed/content.json";
import { getAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { mergeSettings } from "@/lib/content";
import { RESOURCES, type ResourceKey } from "./resources";
import type { SiteSettings } from "@/lib/types";
import { todayISO, type Client, type ClientActivity, type ClientSummary, type ClientTask } from "./clients";

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
  clients: { active: number; mrr: number; atRisk: number };
  followUps: { id: string; name: string; next_contact: string; note: string }[];
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

  // Clientes: se a migração ainda não foi aplicada, o painel continua funcionando.
  const clientList = await loadClients().catch(() => [] as ClientSummary[]);
  const current = clientList.filter((c) => c.status === "active" || c.status === "onboarding");
  const limit = new Date(Date.parse(todayISO()) + 3 * 86_400_000).toISOString().slice(0, 10);
  const followUps = clientList
    .filter((c) => c.next_contact && c.next_contact <= limit && c.status !== "ended")
    .sort((a, b) => a.next_contact!.localeCompare(b.next_contact!))
    .slice(0, 8)
    .map((c) => ({ id: c.id, name: c.name, next_contact: c.next_contact!, note: c.next_contact_note }));

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
    clients: {
      active: current.length,
      mrr: current.reduce((sum, c) => sum + (c.monthly_value ?? 0), 0),
      atRisk: clientList.filter((c) => c.status !== "ended" && c.health === "risk").length,
    },
    followUps,
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

/* ------------------------------------------------------------------ */
/* Clientes                                                             */
/* ------------------------------------------------------------------ */

/** Exemplo exibido apenas na pré-visualização do painel sem banco (desenvolvimento). */
function previewClients(): { clients: Client[]; tasks: ClientTask[]; activities: ClientActivity[] } {
  const today = todayISO();
  const shift = (days: number) => new Date(Date.parse(today) + days * 86_400_000).toISOString().slice(0, 10);
  const base = {
    contact_name: "",
    segment: "",
    phone: "",
    email: "",
    instagram: "",
    website: "",
    services: [] as string[],
    plan: "",
    monthly_value: null,
    billing_day: null,
    start_date: null,
    renewal_date: null,
    owner: "",
    next_contact: null,
    next_contact_note: "",
    notes: "",
    lead_id: null,
    created_at: `${today}T12:00:00Z`,
    updated_at: `${today}T12:00:00Z`,
  };
  const id = (n: number) => `00000000-0000-4000-9000-${String(n).padStart(12, "0")}`;
  const clients: Client[] = [
    {
      ...base,
      id: id(1),
      name: "Cliente de exemplo A",
      contact_name: "Responsável A",
      segment: "Oficina mecânica",
      phone: "(49) 90000-0000",
      status: "active",
      health: "good",
      services: ["Gestão de redes sociais", "Site institucional"],
      plan: "Plano Essencial",
      monthly_value: 697,
      billing_day: 10,
      start_date: shift(-60),
      owner: "Maria",
      next_contact: shift(-2),
      next_contact_note: "Aprovar o calendário de posts do mês.",
      notes: "Prefere receber os conteúdos pelo WhatsApp, à tarde.",
    },
    {
      ...base,
      id: id(2),
      name: "Cliente de exemplo B",
      segment: "Funilaria e pintura",
      status: "onboarding",
      health: "attention",
      services: ["Sistema de gestão"],
      owner: "Lukas",
      next_contact: today,
      next_contact_note: "Treinamento do sistema com a equipe.",
    },
    { ...base, id: id(3), name: "Cliente de exemplo C", status: "prospect", health: "good", next_contact: shift(5) },
  ];
  const tasks: ClientTask[] = [
    { id: id(11), client_id: id(1), title: "Enviar relatório do mês", due_date: shift(-1), done: false, done_at: null, created_at: base.created_at },
    { id: id(12), client_id: id(1), title: "Gravar vídeos da semana", due_date: shift(3), done: false, done_at: null, created_at: base.created_at },
    { id: id(13), client_id: id(1), title: "Ajustar banner do site", due_date: null, done: true, done_at: base.created_at, created_at: base.created_at },
  ];
  const activities: ClientActivity[] = [
    { id: id(21), client_id: id(1), kind: "meeting", content: "Reunião de alinhamento: definimos as datas das gravações.", happened_on: shift(-7), author_email: "maria@exemplo", created_at: base.created_at },
    { id: id(22), client_id: id(1), kind: "feedback", content: "Cliente gostou dos últimos posts e pediu mais vídeos curtos.", happened_on: shift(-3), author_email: "maria@exemplo", created_at: base.created_at },
  ];
  return { clients, tasks, activities };
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const normalizeClient = (r: Record<string, unknown>): Client => ({ ...(r as unknown as Client), monthly_value: num(r.monthly_value) });

export async function loadClients(): Promise<ClientSummary[]> {
  const today = todayISO();
  let clients: Client[];
  let tasks: Pick<ClientTask, "client_id" | "due_date" | "done">[];
  let activities: Pick<ClientActivity, "client_id" | "happened_on">[];

  if (adminPreviewMode) {
    ({ clients, tasks, activities } = previewClients());
  } else {
    const admin = await getAdmin();
    if (!admin) return [];
    const [c, t, a] = await Promise.all([
      admin.supabase.from("clients").select("*").order("name"),
      admin.supabase.from("client_tasks").select("client_id, due_date, done").eq("done", false),
      admin.supabase.from("client_activities").select("client_id, happened_on").order("happened_on", { ascending: false }).limit(2000),
    ]);
    const err = c.error ?? t.error ?? a.error;
    if (err) throw new Error(err.message);
    clients = (c.data ?? []).map(normalizeClient);
    tasks = (t.data ?? []) as typeof tasks;
    activities = (a.data ?? []) as typeof activities;
  }

  return clients.map((c) => {
    const open = tasks.filter((t) => t.client_id === c.id && !t.done);
    const last = activities.filter((a) => a.client_id === c.id).map((a) => a.happened_on).sort().at(-1) ?? null;
    return {
      ...c,
      open_tasks: open.length,
      overdue_tasks: open.filter((t) => t.due_date && t.due_date < today).length,
      last_activity: last,
    };
  });
}

export async function loadClient(
  id: string
): Promise<{ client: Client; tasks: ClientTask[]; activities: ClientActivity[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (adminPreviewMode) {
    const p = previewClients();
    const client = p.clients.find((c) => c.id === id);
    return client
      ? {
          client,
          tasks: p.tasks.filter((t) => t.client_id === id),
          activities: p.activities.filter((a) => a.client_id === id).sort((a, b) => b.happened_on.localeCompare(a.happened_on)),
        }
      : null;
  }
  const admin = await getAdmin();
  if (!admin) return null;
  const [c, t, a] = await Promise.all([
    admin.supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("client_tasks").select("*").eq("client_id", id).order("done").order("due_date", { nullsFirst: false }).order("created_at"),
    admin.supabase
      .from("client_activities")
      .select("*")
      .eq("client_id", id)
      .order("happened_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300),
  ]);
  const err = c.error ?? t.error ?? a.error;
  if (err) throw new Error(err.message);
  if (!c.data) return null;
  return {
    client: normalizeClient(c.data),
    tasks: (t.data ?? []) as ClientTask[],
    activities: (a.data ?? []) as ClientActivity[],
  };
}

/** Clientes já criados a partir de contatos do site (lead_id → client id). */
export async function loadLeadClientMap(): Promise<Record<string, string>> {
  if (adminPreviewMode) return {};
  const admin = await getAdmin();
  if (!admin) return {};
  const { data, error } = await admin.supabase.from("clients").select("id, lead_id").not("lead_id", "is", null);
  if (error) return {};
  return Object.fromEntries((data ?? []).map((r) => [r.lead_id as string, r.id as string]));
}
