import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ResourceManager } from "@/components/admin/resource-manager";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Perguntas frequentes" };

export default async function Page() {
  const rows = await loadResource("faqs");
  return (
    <>
      <PageTitle title="Perguntas frequentes" intro="Perguntas e respostas da seção de dúvidas." />
      <ResourceManager resource="faqs" rows={rows} readOnly={adminPreviewMode} />
    </>
  );
}
