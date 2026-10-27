import type { MarketingPlan, WebPrice } from "@/lib/types";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatBRL = (v: number) => brl.format(v).replace(/ /g, " ");

export function formatWebPrice(w: WebPrice): string {
  const suffix = w.price_suffix ? w.price_suffix : "";
  switch (w.price_type) {
    case "fixed":
      return w.price_min != null ? `${formatBRL(w.price_min)}${suffix}` : "Sob consulta";
    case "range":
      if (w.price_min != null && w.price_max != null)
        return `${formatBRL(w.price_min)} a ${formatBRL(w.price_max)}${suffix}`;
      if (w.price_min != null) return `A partir de ${formatBRL(w.price_min)}${suffix}`;
      return "Sob consulta";
    case "from":
      return w.price_min != null ? `A partir de ${formatBRL(w.price_min)}${suffix}` : "Sob consulta";
    default:
      return "Sob consulta";
  }
}

export function formatPlanPrice(p: MarketingPlan): string | null {
  if (!p.show_price || p.price == null) return null;
  return formatBRL(p.price);
}

/** Apenas dígitos; adiciona 55 a números brasileiros sem código do país. */
export function normalizeWhatsapp(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 11 ? `55${digits}` : digits;
}

export function whatsappLink(number: string, message: string): string | null {
  const n = normalizeWhatsapp(number);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

/** Substitui {chave} na mensagem padrão. */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

export function instagramUrl(handleOrUrl: string): string | null {
  const v = (handleOrUrl || "").trim();
  if (!v) return null;
  if (/^https?:\/\//.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export const isPlaceholder = (text: string | null | undefined) =>
  !!text && /\[(texto provisório|editar|rascunho)/i.test(text);
