import { z } from "zod";
import { imageUrl } from "./resources";
import { validateSections } from "@/lib/sections";

export type SettingField =
  | { path: string; label: string; type: "text" | "email" | "url"; max: number; help?: string; placeholder?: string }
  | { path: string; label: string; type: "textarea"; max: number; rows?: number; help?: string }
  | { path: string; label: string; type: "image"; folder: string; help?: string }
  | { path: string; label: string; type: "color"; help?: string }
  | { path: string; label: string; type: "boolean"; help?: string }
  | { path: string; label: string; type: "list"; help?: string }
  | { path: string; label: string; type: "highlights"; help?: string }
  | { path: string; label: string; type: "sections"; help?: string };

export interface SettingGroup {
  id: string;
  title: string;
  description?: string;
  fields: SettingField[];
}

export type SettingsPage = "identidade" | "contatos" | "conteudo" | "estrutura";

export const SETTINGS_PAGES: Record<SettingsPage, { title: string; intro: string; groups: SettingGroup[] }> = {
  estrutura: {
    title: "Estrutura da página",
    intro: "Escolha a ordem das seções da página principal e quais aparecem. O topo (apresentação) fica sempre em primeiro lugar.",
    groups: [
      {
        id: "layout",
        title: "Seções da página principal",
        description: "Use as setas para mudar a ordem e o olho para mostrar ou ocultar. Ocultar não apaga nada: o conteúdo continua salvo.",
        fields: [{ path: "layout.sections", label: "Seções", type: "sections" }],
      },
    ],
  },

  identidade: {
    title: "Identidade e SEO",
    intro: "Nome, logo, cores e como o site aparece no Google e ao ser compartilhado.",
    groups: [
      {
        id: "brand",
        title: "Marca",
        fields: [
          { path: "brand.name", label: "Nome da empresa", type: "text", max: 80 },
          { path: "brand.tagline", label: "Slogan", type: "text", max: 140 },
          { path: "brand.logo_url", label: "Logo", type: "image", folder: "marca", help: "PNG ou WebP com fundo transparente. Sem logo, o site usa o símbolo e o nome." },
          { path: "brand.description", label: "Descrição da empresa", type: "textarea", max: 400, rows: 3 },
        ],
      },
      {
        id: "colors",
        title: "Cores principais",
        description: "Mudanças de cor afetam o site todo. Confira o contraste antes de salvar.",
        fields: [
          { path: "colors.background", label: "Fundo", type: "color" },
          { path: "colors.primary", label: "Destaque (botões e links)", type: "color" },
          { path: "colors.text", label: "Texto", type: "color" },
          { path: "colors.muted", label: "Cinza secundário", type: "color" },
        ],
      },
      {
        id: "seo",
        title: "SEO e compartilhamento",
        fields: [
          { path: "seo.title", label: "Título da página (Google e abas)", type: "text", max: 70, help: "Ideal: até 60 caracteres." },
          { path: "seo.description", label: "Descrição (Google)", type: "textarea", max: 200, rows: 2, help: "Ideal: entre 120 e 160 caracteres." },
          { path: "seo.og_image", label: "Imagem de compartilhamento (WhatsApp, Instagram, LinkedIn)", type: "image", folder: "seo", help: "Tamanho recomendado: 1200 × 630 px." },
          { path: "seo.site_url", label: "Endereço oficial do site", type: "url", max: 200, placeholder: "https://www.aurestride.com.br" },
        ],
      },
    ],
  },

  contatos: {
    title: "Contatos e WhatsApp",
    intro: "Canais exibidos no site e as mensagens que já chegam preenchidas no WhatsApp.",
    groups: [
      {
        id: "channels",
        title: "Canais",
        fields: [
          { path: "contact.whatsapp", label: "WhatsApp comercial (com DDD)", type: "text", max: 30, placeholder: "(49) 99999-9999", help: "Enquanto estiver vazio, os botões de orçamento levam à seção de contato." },
          { path: "contact.email", label: "E-mail comercial", type: "email", max: 200 },
          { path: "contact.instagram", label: "Instagram", type: "text", max: 200, placeholder: "@aurestride" },
          { path: "contact.tiktok", label: "TikTok", type: "text", max: 200, placeholder: "@aurestride" },
          { path: "contact.linkedin", label: "LinkedIn (link completo)", type: "url", max: 300 },
        ],
      },
      {
        id: "messages",
        title: "Mensagens do WhatsApp",
        description: "Use {plano} e {servico} para inserir o nome automaticamente.",
        fields: [
          { path: "contact.whatsapp_message", label: "Mensagem padrão (Solicitar orçamento)", type: "textarea", max: 500, rows: 2 },
          { path: "contact.plan_message", label: "Mensagem do botão “Quero este plano”", type: "textarea", max: 500, rows: 2 },
          { path: "contact.service_message", label: "Mensagem de orçamento de um serviço", type: "textarea", max: 500, rows: 2 },
        ],
      },
      {
        id: "form",
        title: "Formulário de contato",
        fields: [
          { path: "contact.form_enabled", label: "Exibir o formulário de contato", type: "boolean", help: "As mensagens ficam em Contatos recebidos, aqui no painel." },
        ],
      },
    ],
  },

  conteudo: {
    title: "Textos da página",
    intro: "Textos principais de cada seção. As listas (serviços, planos etc.) têm módulos próprios. Para mudar a ordem ou ocultar seções, use Estrutura da página.",
    groups: [
      {
        id: "hero",
        title: "Apresentação principal (topo)",
        fields: [
          { path: "hero.eyebrow", label: "Linha de apoio (itálico, acima do título)", type: "text", max: 80 },
          { path: "hero.title", label: "Título", type: "textarea", max: 140, rows: 2 },
          { path: "hero.subtitle", label: "Subtítulo", type: "textarea", max: 320, rows: 3 },
          { path: "hero.image_url", label: "Foto principal", type: "image", folder: "hero", help: "Foto horizontal. As pessoas devem estar mais para o centro/direita." },
          { path: "hero.image_alt", label: "Descrição da foto (acessibilidade)", type: "text", max: 160 },
          { path: "hero.cta_primary", label: "Texto do botão principal", type: "text", max: 40 },
          { path: "hero.cta_secondary", label: "Texto do botão secundário", type: "text", max: 40 },
          { path: "hero.highlights", label: "Destaques (faixa abaixo do topo)", type: "highlights" },
        ],
      },
      {
        id: "about",
        title: "Sobre nós",
        fields: [
          { path: "about.eyebrow", label: "Linha de apoio", type: "text", max: 60 },
          { path: "about.title", label: "Título", type: "text", max: 120 },
          { path: "about.text", label: "Texto institucional", type: "textarea", max: 1500, rows: 5 },
          { path: "about.mission", label: "Missão", type: "textarea", max: 400, rows: 2 },
          { path: "about.vision", label: "Visão", type: "textarea", max: 400, rows: 2 },
          { path: "about.values", label: "Valores", type: "list" },
          { path: "about.how_we_work", label: "Como trabalhamos", type: "textarea", max: 800, rows: 3 },
        ],
      },
      {
        id: "sections",
        title: "Títulos das seções",
        fields: [
          { path: "sections.team_eyebrow", label: "Equipe — linha de apoio", type: "text", max: 60 },
          { path: "sections.team_title", label: "Equipe — título", type: "text", max: 120 },
          { path: "sections.team_subtitle", label: "Equipe — subtítulo", type: "textarea", max: 300, rows: 2 },
          { path: "sections.marketing_eyebrow", label: "Marketing — linha de apoio", type: "text", max: 60 },
          { path: "sections.marketing_title", label: "Marketing — título", type: "text", max: 120 },
          { path: "sections.marketing_subtitle", label: "Marketing — subtítulo", type: "textarea", max: 300, rows: 2 },
          { path: "sections.web_eyebrow", label: "Sites — linha de apoio", type: "text", max: 60 },
          { path: "sections.web_title", label: "Sites — título", type: "text", max: 120 },
          { path: "sections.web_subtitle", label: "Sites — subtítulo", type: "textarea", max: 300, rows: 2 },
          { path: "sections.systems_eyebrow", label: "Sistemas — linha de apoio", type: "text", max: 60 },
          { path: "sections.systems_title", label: "Sistemas — título", type: "text", max: 120 },
          { path: "sections.systems_subtitle", label: "Sistemas — texto", type: "textarea", max: 500, rows: 3 },
          { path: "sections.plans_eyebrow", label: "Planos — linha de apoio", type: "text", max: 60 },
          { path: "sections.plans_title", label: "Planos — título", type: "text", max: 120 },
          { path: "sections.plans_subtitle", label: "Planos — subtítulo", type: "textarea", max: 300, rows: 2 },
          { path: "sections.plans_disclaimer", label: "Planos — o que não está incluído", type: "textarea", max: 600, rows: 3 },
          { path: "sections.web_pricing_eyebrow", label: "Preços web — linha de apoio", type: "text", max: 60 },
          { path: "sections.web_pricing_title", label: "Preços web — título", type: "text", max: 120 },
          { path: "sections.web_pricing_disclaimer", label: "Preços web — aviso sobre o valor final", type: "textarea", max: 500, rows: 2 },
          { path: "sections.portfolio_eyebrow", label: "Portfólio — linha de apoio", type: "text", max: 60 },
          { path: "sections.portfolio_title", label: "Portfólio — título", type: "text", max: 120 },
          { path: "sections.portfolio_subtitle", label: "Portfólio — subtítulo", type: "textarea", max: 300, rows: 2 },
          { path: "sections.portfolio_empty", label: "Portfólio — texto quando não há projetos publicados", type: "text", max: 160 },
          { path: "sections.process_eyebrow", label: "Como funciona — linha de apoio", type: "text", max: 60 },
          { path: "sections.process_title", label: "Como funciona — título", type: "text", max: 120 },
          { path: "sections.faq_eyebrow", label: "FAQ — linha de apoio", type: "text", max: 60 },
          { path: "sections.faq_title", label: "FAQ — título", type: "text", max: 120 },
          { path: "sections.contact_eyebrow", label: "Contato — linha de apoio", type: "text", max: 60 },
          { path: "sections.contact_title", label: "Contato — título", type: "text", max: 120 },
          { path: "sections.contact_text", label: "Contato — texto", type: "textarea", max: 400, rows: 2 },
        ],
      },
      {
        id: "footer",
        title: "Rodapé e privacidade",
        fields: [
          { path: "footer.text", label: "Descrição no rodapé", type: "textarea", max: 300, rows: 2 },
          { path: "footer.copyright", label: "Direitos reservados", type: "text", max: 160, help: "O ano é inserido automaticamente." },
          { path: "privacy.enabled", label: "Publicar a página de política de privacidade", type: "boolean" },
          { path: "privacy.content", label: "Texto da política de privacidade", type: "textarea", max: 12000, rows: 10, help: "Separe parágrafos com uma linha em branco." },
        ],
      },
    ],
  },
};

/* ---------------- validação de cada campo ---------------- */

const HEX = /^#[0-9a-fA-F]{6}$/;

export function validateSettingValue(f: SettingField, v: unknown): string | null {
  switch (f.type) {
    case "text":
    case "textarea": {
      if (typeof v !== "string") return "Valor inválido.";
      return v.length > f.max ? `Máximo de ${f.max} caracteres.` : null;
    }
    case "email": {
      if (typeof v !== "string") return "Valor inválido.";
      if (v === "") return null;
      return z.string().email().max(f.max).safeParse(v).success ? null : "E-mail inválido.";
    }
    case "url": {
      if (typeof v !== "string") return "Valor inválido.";
      if (v === "") return null;
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:" ? null : "O link deve começar com https://";
      } catch {
        return "Informe um link completo, começando com https://";
      }
    }
    case "image":
      return imageUrl.safeParse(v).success ? null : "Use uma imagem enviada pelo painel.";
    case "color":
      return typeof v === "string" && HEX.test(v) ? null : "Use uma cor no formato #RRGGBB.";
    case "boolean":
      return typeof v === "boolean" ? null : "Valor inválido.";
    case "list":
      return Array.isArray(v) && v.length <= 20 && v.every((x) => typeof x === "string" && x.trim() && x.length <= 120)
        ? null
        : "Lista inválida (até 20 itens de 120 caracteres).";
    case "sections":
      return validateSections(v);
    case "highlights":
      return Array.isArray(v) &&
        v.length <= 4 &&
        v.every(
          (x) =>
            x && typeof x === "object" && typeof x.title === "string" && x.title.trim() && x.title.length <= 40 && typeof x.text === "string" && x.text.length <= 80
        )
        ? null
        : "Até 4 destaques, com título (40) e texto (80).";
  }
}

export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function setPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone: Record<string, unknown> = structuredClone(obj);
  let cur = clone;
  keys.slice(0, -1).forEach((k) => {
    cur[k] = typeof cur[k] === "object" && cur[k] !== null ? cur[k] : {};
    cur = cur[k] as Record<string, unknown>;
  });
  cur[keys[keys.length - 1]] = value;
  return clone as T;
}
