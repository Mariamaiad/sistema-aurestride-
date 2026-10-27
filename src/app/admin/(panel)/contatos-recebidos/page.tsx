import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { LeadsList } from "@/components/admin/leads-list";
import { loadLeads } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Contatos recebidos" };

export default async function LeadsPage() {
  const leads = await loadLeads();
  return (
    <>
      <PageTitle
        title="Contatos recebidos"
        intro="Mensagens enviadas pelo formulário do site. O site não envia e-mail automático: confira esta página regularmente."
      />
      <LeadsList leads={leads} />
    </>
  );
}
