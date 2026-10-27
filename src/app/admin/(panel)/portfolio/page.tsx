import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Portfólio" };

export default async function Page() {
  const rows = await loadResource("projects");
  return (
    <>
      <PageTitle title="Portfólio" intro="Projetos começam como rascunho. Publique somente com autorização do cliente e sem resultados que não possam ser comprovados." />
      <ResourceManager resource="projects" rows={rows} readOnly={adminPreviewMode} />
    </>
  );
}
