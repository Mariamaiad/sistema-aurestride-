import { z } from "zod";
import { SERVICE_ICON_OPTIONS } from "@/components/ui/icons";

/* ------------------------------------------------------------------
   Configuração dos módulos editáveis do painel.
   O mesmo arquivo define os campos do formulário (cliente) e a
   validação (cliente e servidor).
------------------------------------------------------------------- */

export type FieldDef =
  | { name: string; label: string; type: "text" | "url" | "slug"; required?: boolean; max?: number; help?: string; placeholder?: string }
  | { name: string; label: string; type: "textarea"; required?: boolean; max?: number; rows?: number; help?: string }
  | { name: string; label: string; type: "number" | "money"; min?: number; help?: string; placeholder?: string }
  | { name: string; label: string; type: "boolean"; help?: string }
  | { name: string; label: string; type: "list"; help?: string; placeholder?: string }
  | { name: string; label: string; type: "image"; folder: string; help?: string }
  | { name: string; label: string; type: "gallery"; folder: string; help?: string }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; help?: string }
  | { name: string; label: string; type: "icon"; help?: string };

export type ResourceKey =
  | "team"
  | "services_marketing"
  | "services_web"
  | "services_sistemas"
  | "plans"
  | "web_pricing"
  | "projects"
  | "steps"
  | "faqs";

export interface ResourceDef {
  key: ResourceKey;
  table: string;
  label: string;
  singular: string;
  /** Campo booleano usado para ativar/ocultar sem apagar. */
  toggleField: "active" | "visible" | null;
  toggleLabels: [on: string, off: string];
  /** Filtro fixo (ex.: categoria dos serviços). */
  fixed?: Record<string, string>;
  canDuplicate?: boolean;
  /** Relação 1:N gravada junto (itens do plano, galeria do projeto). */
  children?: "plan_items" | "project_images";
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  schema: z.ZodType<Record<string, unknown>>;
  title: (r: Record<string, unknown>) => string;
  subtitle?: (r: Record<string, unknown>) => string;
}

/* ---------------- validadores reutilizáveis ---------------- */

const text = (max: number, required = false) =>
  required ? z.string().trim().min(1, "Campo obrigatório.").max(max, `Máximo de ${max} caracteres.`) : z.string().trim().max(max, `Máximo de ${max} caracteres.`);

const list = (maxItems = 30, maxLen = 300) =>
  z.array(z.string().trim().min(1).max(maxLen, `Cada item pode ter até ${maxLen} caracteres.`)).max(maxItems, `Até ${maxItems} itens.`);

const isStorageUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false;
  }
};
/** Imagem: caminho local (/images/...) ou arquivo enviado ao Storage do Supabase. */
export const imageUrl = z
  .string()
  .trim()
  .max(600)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || isStorageUrl(v), "Use uma imagem enviada pelo painel.");

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    if (v === "") return true;
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Informe um link completo, começando com https://");

const money = z
  .union([z.number(), z.null()])
  .refine((v) => v === null || (v >= 0 && v <= 10_000_000), "Valor inválido.");
const count = z.union([z.number().int("Use um número inteiro.").min(0).max(500), z.null()]);

/* ---------------- módulos ---------------- */

const serviceFields = (withPrice: boolean): FieldDef[] => [
  { name: "title", label: "Título", type: "text", required: true, max: 160 },
  { name: "description", label: "Descrição", type: "textarea", max: 800, rows: 3 },
  { name: "deliverables", label: "Entregáveis", type: "list", placeholder: "Ex.: Relatório mensal" },
  { name: "icon", label: "Ícone", type: "icon" },
  { name: "image_url", label: "Imagem (opcional)", type: "image", folder: "servicos" },
  ...(withPrice
    ? ([{ name: "price_label", label: "Preço inicial (texto exibido)", type: "text", max: 80, placeholder: "Ex.: A partir de R$ 900" }] as FieldDef[])
    : []),
  { name: "notes", label: "Observações", type: "textarea", max: 500, rows: 2 },
];

const serviceSchema = z.object({
  title: text(160, true),
  description: text(800),
  deliverables: list(),
  icon: z.string().refine((v) => v === "" || SERVICE_ICON_OPTIONS.includes(v), "Ícone inválido."),
  image_url: imageUrl,
  price_label: text(80).optional().default(""),
  notes: text(500),
});

const serviceDefaults = { title: "", description: "", deliverables: [], icon: "sparkles", image_url: "", price_label: "", notes: "" };

const service = (key: ResourceKey, category: string, label: string, withPrice: boolean): ResourceDef => ({
  key,
  table: "services",
  label,
  singular: "serviço",
  toggleField: "active",
  toggleLabels: ["Ativo", "Inativo"],
  fixed: { category },
  fields: serviceFields(withPrice),
  defaults: serviceDefaults,
  schema: serviceSchema as unknown as z.ZodType<Record<string, unknown>>,
  title: (r) => String(r.title ?? ""),
  subtitle: (r) => String(r.price_label || r.description || "").slice(0, 90),
});

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  team: {
    key: "team",
    table: "team_members",
    label: "Equipe",
    singular: "perfil",
    toggleField: "visible",
    toggleLabels: ["Visível", "Oculto"],
    fields: [
      { name: "name", label: "Nome", type: "text", required: true, max: 120 },
      { name: "role", label: "Cargo ou área de atuação", type: "text", max: 160 },
      { name: "photo_url", label: "Foto de perfil", type: "image", folder: "equipe", help: "Prefira fotos verticais (4:5), com o rosto bem enquadrado." },
      { name: "bio", label: "Texto de apresentação", type: "textarea", max: 1500, rows: 5 },
      { name: "skills", label: "Experiências e competências", type: "list", placeholder: "Ex.: Edição de vídeos" },
      { name: "responsibilities", label: "Áreas pelas quais é responsável", type: "list", placeholder: "Ex.: Atendimento" },
    ],
    defaults: { name: "", role: "", photo_url: "", bio: "", skills: [], responsibilities: [] },
    schema: z.object({
      name: text(120, true),
      role: text(160),
      photo_url: imageUrl,
      bio: text(1500),
      skills: list(),
      responsibilities: list(),
    }) as unknown as z.ZodType<Record<string, unknown>>,
    title: (r) => String(r.name ?? ""),
    subtitle: (r) => String(r.role ?? ""),
  },

  services_marketing: service("services_marketing", "marketing", "Serviços de marketing", false),
  services_web: service("services_web", "web", "Criação de sites", true),
  services_sistemas: service("services_sistemas", "sistemas", "Sistemas web", false),

  plans: {
    key: "plans",
    table: "marketing_plans",
    label: "Planos de marketing",
    singular: "plano",
    toggleField: "active",
    toggleLabels: ["Ativo", "Inativo"],
    canDuplicate: true,
    children: "plan_items",
    fields: [
      { name: "name", label: "Nome do plano", type: "text", required: true, max: 120 },
      { name: "price", label: "Preço mensal (R$)", type: "money", placeholder: "Ex.: 697" },
      { name: "price_suffix", label: "Sufixo do preço", type: "text", max: 20, placeholder: "/mês" },
      { name: "show_price", label: "Exibir o preço publicamente", type: "boolean", help: "Desmarcado, o card mostra \"Sob consulta\"." },
      { name: "description", label: "Descrição curta", type: "textarea", max: 400, rows: 2 },
      { name: "contents_count", label: "Quantidade de conteúdos por mês", type: "number", min: 0 },
      { name: "videos_count", label: "Vídeos curtos (incluídos no total de conteúdos)", type: "number", min: 0 },
      { name: "items", label: "Entregáveis do plano", type: "list", placeholder: "Ex.: Relatório mensal" },
      { name: "notes", label: "Observações", type: "textarea", max: 500, rows: 2 },
      { name: "highlighted", label: "Destacar como recomendado", type: "boolean" },
    ],
    defaults: { name: "", price: null, price_suffix: "/mês", show_price: true, description: "", contents_count: null, videos_count: null, items: [], notes: "", highlighted: false },
    schema: z
      .object({
        name: text(120, true),
        price: money,
        price_suffix: text(20),
        show_price: z.boolean(),
        description: text(400),
        contents_count: count,
        videos_count: count,
        items: list(40),
        notes: text(500),
        highlighted: z.boolean(),
      })
      .refine((d) => d.videos_count == null || d.contents_count == null || d.videos_count <= d.contents_count, {
        message: "Os vídeos fazem parte do total: não podem ser mais que a quantidade de conteúdos.",
        path: ["videos_count"],
      }) as unknown as z.ZodType<Record<string, unknown>>,
    title: (r) => String(r.name ?? ""),
    subtitle: (r) =>
      [r.price != null ? `R$ ${Number(r.price).toLocaleString("pt-BR")}${r.price_suffix ?? ""}` : "Sem preço", r.contents_count != null ? `${r.contents_count} conteúdos` : "", r.highlighted ? "★ Recomendado" : ""]
        .filter(Boolean)
        .join(" · "),
  },

  web_pricing: {
    key: "web_pricing",
    table: "web_pricing",
    label: "Preços de desenvolvimento web",
    singular: "item",
    toggleField: "active",
    toggleLabels: ["Ativo", "Inativo"],
    fields: [
      { name: "name", label: "Nome", type: "text", required: true, max: 120 },
      { name: "description", label: "Descrição", type: "textarea", max: 400, rows: 2 },
      {
        name: "price_type",
        label: "Tipo de preço",
        type: "select",
        options: [
          { value: "range", label: "Faixa de preço (de ... a ...)" },
          { value: "from", label: "A partir de" },
          { value: "fixed", label: "Preço fixo" },
          { value: "on_request", label: "Sob consulta" },
        ],
      },
      { name: "price_min", label: "Valor (ou valor mínimo) em R$", type: "money" },
      { name: "price_max", label: "Valor máximo em R$ (só para faixa)", type: "money" },
      { name: "price_suffix", label: "Sufixo", type: "text", max: 20, placeholder: "Ex.: /mês" },
      { name: "show_price", label: "Exibir o preço publicamente", type: "boolean", help: "Desmarcado, mostra \"Sob consulta\"." },
      { name: "notes", label: "Observações", type: "textarea", max: 400, rows: 2 },
    ],
    defaults: { name: "", description: "", price_type: "range", price_min: null, price_max: null, price_suffix: "", show_price: true, notes: "" },
    schema: z
      .object({
        name: text(120, true),
        description: text(400),
        price_type: z.enum(["fixed", "range", "from", "on_request"]),
        price_min: money,
        price_max: money,
        price_suffix: text(20),
        show_price: z.boolean(),
        notes: text(400),
      })
      .refine((d) => d.price_type === "on_request" || d.price_min != null, { message: "Informe o valor.", path: ["price_min"] })
      .refine((d) => d.price_type !== "range" || (d.price_max != null && d.price_min != null && d.price_max >= d.price_min), {
        message: "Na faixa de preço, o valor máximo deve ser maior ou igual ao mínimo.",
        path: ["price_max"],
      }) as unknown as z.ZodType<Record<string, unknown>>,
    title: (r) => String(r.name ?? ""),
    subtitle: (r) => String(r.description ?? ""),
  },

  projects: {
    key: "projects",
    table: "portfolio_projects",
    label: "Portfólio",
    singular: "projeto",
    toggleField: null,
    toggleLabels: ["Publicado", "Rascunho"],
    children: "project_images",
    fields: [
      { name: "title", label: "Nome do projeto", type: "text", required: true, max: 160 },
      { name: "slug", label: "Endereço (URL)", type: "slug", required: true, max: 80, help: "Aparece em /portfolio/endereco. Use letras minúsculas, números e hífens." },
      { name: "client", label: "Empresa ou cliente", type: "text", max: 160 },
      {
        name: "category",
        label: "Categoria",
        type: "select",
        options: [
          { value: "marketing", label: "Marketing" },
          { value: "site", label: "Site" },
          { value: "sistema", label: "Sistema" },
        ],
      },
      { name: "cover_url", label: "Imagem de capa", type: "image", folder: "portfolio" },
      { name: "summary", label: "Resumo (aparece no card)", type: "textarea", max: 400, rows: 2 },
      { name: "challenge", label: "Desafio", type: "textarea", max: 3000, rows: 4 },
      { name: "solution", label: "Solução desenvolvida", type: "textarea", max: 3000, rows: 4 },
      { name: "deliverables", label: "Funcionalidades ou entregas", type: "list" },
      { name: "results", label: "Resultados mensuráveis (somente se existirem e puderem ser divulgados)", type: "textarea", max: 2000, rows: 3 },
      { name: "external_url", label: "Link externo (opcional)", type: "url", max: 500 },
      { name: "images", label: "Galeria de imagens", type: "gallery", folder: "portfolio" },
    ],
    defaults: { title: "", slug: "", client: "", category: "site", cover_url: "", summary: "", challenge: "", solution: "", deliverables: [], results: "", external_url: "", images: [] },
    schema: z.object({
      title: text(160, true),
      slug: z
        .string()
        .trim()
        .min(1, "Campo obrigatório.")
        .max(80)
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens (ex.: oficina-silva)."),
      client: text(160),
      category: z.enum(["marketing", "site", "sistema"]),
      cover_url: imageUrl,
      summary: text(400),
      challenge: text(3000),
      solution: text(3000),
      deliverables: list(),
      results: text(2000),
      external_url: httpUrl,
      images: z.array(z.object({ url: imageUrl.refine((v) => v !== "", "Imagem vazia."), alt: text(200) })).max(24, "Até 24 imagens."),
    }) as unknown as z.ZodType<Record<string, unknown>>,
    title: (r) => String(r.title ?? ""),
    subtitle: (r) => [r.client, r.category].filter(Boolean).join(" · "),
  },

  steps: {
    key: "steps",
    table: "process_steps",
    label: "Como funciona",
    singular: "etapa",
    toggleField: "active",
    toggleLabels: ["Ativa", "Inativa"],
    fields: [
      { name: "title", label: "Título da etapa", type: "text", required: true, max: 120 },
      { name: "description", label: "Descrição", type: "textarea", max: 500, rows: 3 },
    ],
    defaults: { title: "", description: "" },
    schema: z.object({ title: text(120, true), description: text(500) }) as unknown as z.ZodType<Record<string, unknown>>,
    title: (r) => String(r.title ?? ""),
    subtitle: (r) => String(r.description ?? ""),
  },

  faqs: {
    key: "faqs",
    table: "faqs",
    label: "Perguntas frequentes",
    singular: "pergunta",
    toggleField: "active",
    toggleLabels: ["Ativa", "Inativa"],
    fields: [
      { name: "question", label: "Pergunta", type: "text", required: true, max: 300 },
      { name: "answer", label: "Resposta", type: "textarea", max: 3000, rows: 5 },
    ],
    defaults: { question: "", answer: "" },
    schema: z.object({ question: text(300, true), answer: text(3000) }) as unknown as z.ZodType<Record<string, unknown>>,
    title: (r) => String(r.question ?? ""),
    subtitle: (r) => String(r.answer ?? ""),
  },
};

/** Primeiro erro por campo, no formato { campo: mensagem }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Remove acentos e gera um endereço amigável. */
export function slugify(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
