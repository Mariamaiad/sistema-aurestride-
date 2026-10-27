import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Serviços" };

const TABS = [
  { key: "services_marketing", label: "Marketing digital" },
  { key: "services_web", label: "Criação de sites" },
  { key: "services_sistemas", label: "Sistemas web" },
] as const;

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  const tab = TABS.find((t) => t.key === aba) ?? TABS[0];
  const rows = await loadResource(tab.key);
  return (
    <>
      <PageTitle
        title="Serviços"
        intro="Cards de serviços de cada seção do site. Desative um serviço para escondê-lo sem apagar. Tráfego pago só aparece se for cadastrado aqui com escopo definido."
      />
      <div role="tablist" aria-label="Categorias" className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/10 p-1">
        {TABS.map((t) => (
          <a
            key={t.key}
            role="tab"
            aria-selected={t.key === tab.key}
            href={`/admin/servicos?aba=${t.key}`}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm transition-colors ${
              t.key === tab.key ? "bg-electric text-white" : "text-mist hover:text-paper"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>
      <ResourceManager key={tab.key} resource={tab.key} rows={rows} readOnly={adminPreviewMode} />
    </>
  );
}
