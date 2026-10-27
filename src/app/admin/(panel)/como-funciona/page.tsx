import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Como funciona" };

export default async function Page() {
  const rows = await loadResource("steps");
  return (
    <>
      <PageTitle title="Como funciona" intro="Etapas do processo de trabalho exibidas no site." />
      <ResourceManager resource="steps" rows={rows} readOnly={adminPreviewMode} />
    </>
  );
}
