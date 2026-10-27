import "server-only";
import { unstable_cache } from "next/cache";
import seed from "../../supabase/seed/content.json";
import { createPublicClient, createSessionClient } from "@/lib/supabase/server";
import type {
  Faq,
  MarketingPlan,
  PortfolioProject,
  ProcessStep,
  Service,
  SiteContent,
  SiteSettings,
  TeamMember,
  WebPrice,
} from "@/lib/types";

export const SITE_TAG = "site";

type Json = Record<string, unknown>;

/** Mescla as configurações salvas sobre os padrões, para que campos novos nunca quebrem a página. */
export function mergeSettings(saved: unknown): SiteSettings {
  const merge = (base: unknown, over: unknown): unknown => {
    if (over === undefined || over === null) return base;
    if (Array.isArray(base) || Array.isArray(over)) return over;
    if (typeof base === "object" && base && typeof over === "object") {
      const out: Json = { ...(base as Json) };
      for (const [k, v] of Object.entries(over as Json)) out[k] = merge((base as Json)[k], v);
      return out;
    }
    return over;
  };
  return merge(seed.settings, saved) as SiteSettings;
}

/** Conteúdo de demonstração (somente quando o Supabase não está configurado). */
function demoContent(): SiteContent {
  const id = (p: string, i: number) => `${p}-${i}`;
  return {
    demo: true,
    settings: mergeSettings(null),
    team: seed.team.map((m, i) => ({ ...m, id: id("team", i), sort_order: i })),
    services: seed.services.map((s, i) => ({
      id: id("svc", i),
      category: s.category as Service["category"],
      title: s.title,
      description: s.description,
      deliverables: s.deliverables,
      icon: s.icon ?? null,
      image_url: null,
      price_label: (s as { price_label?: string }).price_label ?? null,
      notes: null,
      active: true,
      sort_order: i,
    })),
    plans: seed.plans.map((p, i) => ({
      id: id("plan", i),
      name: p.name,
      price: p.price,
      price_suffix: "/mês",
      description: p.description,
      contents_count: p.contents_count,
      videos_count: p.videos_count,
      notes: p.notes || null,
      highlighted: p.highlighted,
      show_price: true,
      active: true,
      sort_order: i,
      items: p.items,
    })),
    webPricing: seed.web_pricing.map((w, i) => ({
      ...w,
      id: id("web", i),
      price_type: w.price_type as WebPrice["price_type"],
      notes: null,
      show_price: true,
      active: true,
      sort_order: i,
    })),
    // Projetos começam como rascunho: não aparecem publicamente.
    projects: [],
    steps: seed.process_steps.map((s, i) => ({ ...s, id: id("step", i), active: true, sort_order: i })),
    faqs: seed.faqs.map((f, i) => ({ ...f, id: id("faq", i), active: true, sort_order: i })),
  };
}

type PlanRow = Omit<MarketingPlan, "items"> & { plan_items: { text: string; sort_order: number }[] };
type ProjectRow = Omit<PortfolioProject, "images"> & { project_images: PortfolioProject["images"] };

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export function normalizePlan(p: PlanRow): MarketingPlan {
  const { plan_items, ...rest } = p;
  return {
    ...rest,
    price: num(p.price),
    items: [...(plan_items ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.text),
  };
}

export function normalizeProject(p: ProjectRow): PortfolioProject {
  const { project_images, ...rest } = p;
  return { ...rest, images: [...(project_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) };
}

export function normalizeWebPrice(w: WebPrice): WebPrice {
  return { ...w, price_min: num(w.price_min), price_max: num(w.price_max) };
}

async function fetchPublicContent(): Promise<SiteContent> {
  const db = createPublicClient();
  if (!db) return demoContent();

  const [settings, team, services, plans, web, projects, steps, faqs] = await Promise.all([
    db.from("site_settings").select("data").eq("id", 1).maybeSingle(),
    db.from("team_members").select("*").eq("visible", true).order("sort_order"),
    db.from("services").select("*").eq("active", true).order("sort_order"),
    db.from("marketing_plans").select("*, plan_items(text, sort_order)").eq("active", true).order("sort_order"),
    db.from("web_pricing").select("*").eq("active", true).order("sort_order"),
    db
      .from("portfolio_projects")
      .select("*, project_images(id, url, alt, sort_order)")
      .eq("status", "published")
      .order("sort_order"),
    db.from("process_steps").select("*").eq("active", true).order("sort_order"),
    db.from("faqs").select("*").eq("active", true).order("sort_order"),
  ]);

  const firstError = [settings, team, services, plans, web, projects, steps, faqs].find((r) => r.error)?.error;
  if (firstError) {
    // Não esconder a falha: deixa a página de erro tratar.
    throw new Error(`Falha ao carregar o conteúdo do site: ${firstError.message}`);
  }

  return {
    demo: false,
    settings: mergeSettings(settings.data?.data),
    team: (team.data ?? []) as TeamMember[],
    services: (services.data ?? []) as Service[],
    plans: ((plans.data ?? []) as PlanRow[]).map(normalizePlan),
    webPricing: ((web.data ?? []) as WebPrice[]).map(normalizeWebPrice),
    projects: ((projects.data ?? []) as ProjectRow[]).map(normalizeProject),
    steps: (steps.data ?? []) as ProcessStep[],
    faqs: (faqs.data ?? []) as Faq[],
  };
}

/** Conteúdo público do site, em cache até que o painel salve uma alteração. */
export const getSiteContent = unstable_cache(fetchPublicContent, ["site-content"], {
  tags: [SITE_TAG],
  revalidate: 3600,
});

/**
 * Busca um projeto pelo slug usando a sessão do visitante.
 * Visitantes só recebem projetos publicados; administradores também veem rascunhos (RLS).
 */
export async function getProjectBySlug(slug: string): Promise<PortfolioProject | null> {
  const db = await createSessionClient();
  if (!db) return null;
  const { data, error } = await db
    .from("portfolio_projects")
    .select("*, project_images(id, url, alt, sort_order)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeProject(data as ProjectRow) : null;
}
