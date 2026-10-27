import { fillTemplate, instagramUrl, safeExternalUrl, whatsappLink } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";

/** Links de contato derivados das configurações. Sem WhatsApp, os botões levam à seção de contato. */
export function contactLinks(s: SiteSettings) {
  const c = s.contact;
  const general = whatsappLink(c.whatsapp, c.whatsapp_message);
  return {
    hasWhatsapp: Boolean(general),
    quoteHref: general ?? "/#contato",
    planHref: (plano: string) =>
      whatsappLink(c.whatsapp, fillTemplate(c.plan_message, { plano })) ?? "/#contato",
    serviceHref: (servico: string) =>
      whatsappLink(c.whatsapp, fillTemplate(c.service_message, { servico })) ?? "/#contato",
    instagram: instagramUrl(c.instagram),
    linkedin: safeExternalUrl(c.linkedin),
    tiktok: c.tiktok
      ? safeExternalUrl(c.tiktok) ?? `https://www.tiktok.com/@${c.tiktok.replace(/^@/, "")}`
      : null,
    email: c.email ? `mailto:${c.email}` : null,
  };
}

/** Propriedades para links que podem ser externos (WhatsApp) ou âncoras internas. */
export const linkProps = (href: string) =>
  href.startsWith("http") ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };

const HEX = /^#[0-9a-f]{6}$/i;
export function brandCssVars(s: SiteSettings): string {
  const c = s.colors;
  const pick = (v: string, fallback: string) => (HEX.test(v) ? v : fallback);
  return `:root{--brand-bg:${pick(c.background, "#0B1220")};--brand-primary:${pick(c.primary, "#086BFF")};--brand-text:${pick(c.text, "#F8FAFC")};--brand-muted:${pick(c.muted, "#64748B")};}`;
}

export function siteUrl(s: SiteSettings): string {
  const fromSettings = safeExternalUrl(s.seo.site_url);
  const fromEnv = safeExternalUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
  return (fromSettings ?? fromEnv ?? vercel ?? "http://localhost:3000").replace(/\/$/, "");
}
