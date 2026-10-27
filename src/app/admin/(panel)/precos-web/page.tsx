import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Preços de desenvolvimento web" };

export default async function Page() {
  const rows = await loadResource("web_pricing");
  return (
    <>
      <PageTitle title="Preços de desenvolvimento web" intro="Escolha entre preço fixo, faixa ou “a partir de”, e decida se o valor aparece no site." />
      <ResourceManager resource="web_pricing" rows={rows} readOnly={adminPreviewMode} />
    </>
  );
}
