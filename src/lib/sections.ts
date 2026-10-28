/* ------------------------------------------------------------------
   Seções da página principal: ordem e visibilidade (editáveis no painel
   em "Estrutura da página"). O topo (apresentação) fica sempre primeiro.
------------------------------------------------------------------- */

export const SECTION_DEFS = {
  about: { label: "Sobre nós", hint: "Texto institucional, missão, visão e valores" },
  team: { label: "Equipe", hint: "Perfis da Maria, do Lukas e de quem mais estiver visível" },
  marketing: { label: "Serviços de marketing", hint: "Cards dos serviços de marketing digital" },
  sites: { label: "Criação de sites", hint: "Cards dos serviços de sites" },
  systems: { label: "Sistemas web", hint: "Bloco de sistemas, automações e integrações" },
  plans: { label: "Planos de marketing", hint: "Cards dos planos mensais" },
  web_pricing: { label: "Preços de sites e sistemas", hint: "Tabela de preços de desenvolvimento" },
  portfolio: { label: "Portfólio", hint: "Projetos publicados (sem projetos, mostra um aviso)" },
  process: { label: "Como funciona", hint: "Etapas do atendimento" },
  faq: { label: "Perguntas frequentes", hint: "Perguntas e respostas" },
  contact: { label: "Contato", hint: "Canais de contato e formulário" },
} as const;

export type SectionId = keyof typeof SECTION_DEFS;
export const SECTION_IDS = Object.keys(SECTION_DEFS) as SectionId[];
export const SERVICE_SECTIONS: SectionId[] = ["marketing", "sites", "systems"];

export interface SectionEntry {
  id: SectionId;
  visible: boolean;
}

/**
 * Ordem final das seções: usa o que foi salvo, ignora valores desconhecidos
 * e acrescenta no fim (visíveis) as seções que ainda não existiam quando a
 * ordem foi salva.
 */
export function resolveSections(saved: unknown): SectionEntry[] {
  const out: SectionEntry[] = [];
  const seen = new Set<string>();
  if (Array.isArray(saved)) {
    for (const s of saved) {
      const id = (s as { id?: unknown })?.id;
      if (typeof id === "string" && id in SECTION_DEFS && !seen.has(id)) {
        seen.add(id);
        out.push({ id: id as SectionId, visible: (s as { visible?: unknown }).visible !== false });
      }
    }
  }
  for (const id of SECTION_IDS) if (!seen.has(id)) out.push({ id, visible: true });
  return out;
}

export function validateSections(v: unknown): string | null {
  if (!Array.isArray(v) || v.length > SECTION_IDS.length) return "Lista de seções inválida.";
  const ids = new Set<string>();
  for (const s of v) {
    if (!s || typeof s !== "object") return "Lista de seções inválida.";
    const { id, visible } = s as { id?: unknown; visible?: unknown };
    if (typeof id !== "string" || !(id in SECTION_DEFS) || ids.has(id) || typeof visible !== "boolean") return "Lista de seções inválida.";
    ids.add(id);
  }
  if (!v.some((s) => (s as SectionEntry).visible)) return "Deixe pelo menos uma seção visível além do topo.";
  return null;
}
