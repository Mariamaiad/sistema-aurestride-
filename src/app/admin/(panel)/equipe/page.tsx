import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Equipe" };

export default async function Page() {
  const rows = await loadResource("team");
  return (
    <>
      <PageTitle title="Equipe" intro="Perfis exibidos em “Quem somos”. Oculte um perfil para tirá-lo do site sem apagar as informações." />
      <ResourceManager resource="team" rows={rows} readOnly={adminPreviewMode} />
    </>
  );
}
