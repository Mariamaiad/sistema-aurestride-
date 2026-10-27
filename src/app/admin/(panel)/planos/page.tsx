import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Planos de marketing" };

export default async function Page() {
  const rows = await loadResource("plans");
  return (
    <>
      <PageTitle title="Planos de marketing" intro="Preços, quantidade de conteúdos e entregáveis. Os vídeos fazem parte do total de conteúdos. Apenas um plano pode ser recomendado por vez." />
      <ResourceManager resource="plans" rows={rows} readOnly={adminPreviewMode} />
    </>
  );
}
