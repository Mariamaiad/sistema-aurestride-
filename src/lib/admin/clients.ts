import { z } from "zod";

/* ------------------------------------------------------------------
   Gestão de clientes: tipos, rótulos e validação (cliente e servidor).
------------------------------------------------------------------- */

export const CLIENT_STATUS = {
  prospect: { label: "Em negociação", cls: "border-sky-400/40 bg-sky-400/10 text-sky-200" },
  onboarding: { label: "Implantação", cls: "border-violet-400/40 bg-violet-400/10 text-violet-200" },
  active: { label: "Ativo", cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" },
  paused: { label: "Pausado", cls: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  ended: { label: "Encerrado", cls: "border-white/15 bg-white/5 text-mist" },
} as const;
export type ClientStatus = keyof typeof CLIENT_STATUS;

export const CLIENT_HEALTH = {
  good: { label: "Satisfeito", dot: "bg-emerald-400" },
  attention: { label: "Pedir atenção", dot: "bg-amber-400" },
  risk: { label: "Em risco", dot: "bg-red-400" },
} as const;
export type ClientHealth = keyof typeof CLIENT_HEALTH;

export const ACTIVITY_KINDS = {
  note: "Anotação",
  meeting: "Reunião",
  call: "Ligação",
  whatsapp: "WhatsApp",
  delivery: "Entrega",
  payment: "Pagamento",
  feedback: "Retorno do cliente",
} as const;
export type ActivityKind = keyof typeof ACTIVITY_KINDS;

export interface Client {
  id: string;
  name: string;
  contact_name: string;
  segment: string;
  phone: string;
  email: string;
  instagram: string;
  website: string;
  status: ClientStatus;
  health: ClientHealth;
  services: string[];
  plan: string;
  monthly_value: number | null;
  billing_day: number | null;
  start_date: string | null;
  renewal_date: string | null;
  owner: string;
  next_contact: string | null;
  next_contact_note: string;
  notes: string;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  kind: ActivityKind;
  content: string;
  happened_on: string;
  author_email: string | null;
  created_at: string;
}

export interface ClientTask {
  id: string;
  client_id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  done_at: string | null;
  created_at: string;
}

/** Linha da lista de clientes, com o resumo das tarefas. */
export interface ClientSummary extends Client {
  open_tasks: number;
  overdue_tasks: number;
  last_activity: string | null;
}

/* ---------------- validação ---------------- */

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`);
const isoDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."), z.literal(""), z.null()])
  .transform((v) => (v ? v : null));

export const clientSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do cliente ou da empresa.").max(160, "Máximo de 160 caracteres."),
    contact_name: text(120),
    segment: text(120),
    phone: text(40),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.string().email().safeParse(v).success, "E-mail inválido."),
    instagram: text(200),
    website: z
      .string()
      .trim()
      .max(300)
      .refine((v) => {
        if (v === "") return true;
        try {
          const u = new URL(v);
          return u.protocol === "https:" || u.protocol === "http:";
        } catch {
          return false;
        }
      }, "Informe um link completo, começando com https://"),
    status: z.enum(Object.keys(CLIENT_STATUS) as [ClientStatus, ...ClientStatus[]]),
    health: z.enum(Object.keys(CLIENT_HEALTH) as [ClientHealth, ...ClientHealth[]]),
    services: z.array(z.string().trim().min(1).max(120, "Cada serviço pode ter até 120 caracteres.")).max(30, "Até 30 serviços."),
    plan: text(120),
    monthly_value: z.union([z.number(), z.null()]).refine((v) => v === null || (v >= 0 && v <= 10_000_000), "Valor inválido."),
    billing_day: z.union([z.number().int("Use um número inteiro.").min(1, "Entre 1 e 31.").max(31, "Entre 1 e 31."), z.null()]),
    start_date: isoDate,
    renewal_date: isoDate,
    owner: text(120),
    next_contact: isoDate,
    next_contact_note: text(300),
    notes: text(5000),
  })
  .refine((d) => !d.start_date || !d.renewal_date || d.renewal_date >= d.start_date, {
    message: "A renovação deve ser depois do início.",
    path: ["renewal_date"],
  });

export type ClientInput = z.input<typeof clientSchema>;

export const CLIENT_DEFAULTS: ClientInput = {
  name: "",
  contact_name: "",
  segment: "",
  phone: "",
  email: "",
  instagram: "",
  website: "",
  status: "active",
  health: "good",
  services: [],
  plan: "",
  monthly_value: null,
  billing_day: null,
  start_date: null,
  renewal_date: null,
  owner: "",
  next_contact: null,
  next_contact_note: "",
  notes: "",
};

export const activitySchema = z.object({
  kind: z.enum(Object.keys(ACTIVITY_KINDS) as [ActivityKind, ...ActivityKind[]]),
  content: z.string().trim().min(1, "Descreva o que aconteceu.").max(3000, "Máximo de 3000 caracteres."),
  happened_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  /** Opcional: já agenda o próximo contato ao registrar a interação. */
  next_contact: isoDate.optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Descreva a tarefa.").max(200, "Máximo de 200 caracteres."),
  due_date: isoDate,
});

/* ---------------- datas (fuso de São Paulo) ---------------- */

/** Data de hoje no formato AAAA-MM-DD, no horário de Brasília. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("pt-BR", { ...opts, timeZone: "UTC" });
}

/** Diferença em dias entre uma data e hoje (negativo = no passado). */
export function daysFromToday(iso: string, today = todayISO()): number {
  const utc = (s: string) => {
    const [y, m, d] = s.slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(iso) - utc(today)) / 86_400_000);
}

/** Texto curto para o próximo contato: "Hoje", "Amanhã", "Atrasado há 3 dias"... */
export function relativeDay(iso: string, today = todayISO()): { text: string; tone: "late" | "today" | "soon" | "later" } {
  const diff = daysFromToday(iso, today);
  if (diff < 0) return { text: diff === -1 ? "Atrasado desde ontem" : `Atrasado há ${-diff} dias`, tone: "late" };
  if (diff === 0) return { text: "Hoje", tone: "today" };
  if (diff === 1) return { text: "Amanhã", tone: "soon" };
  if (diff <= 7) return { text: `Em ${diff} dias`, tone: "soon" };
  return { text: formatDate(iso), tone: "later" };
}
