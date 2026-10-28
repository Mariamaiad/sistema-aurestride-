import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { LeadsList } from "@/components/admin/leads-list";
import { loadLeadClientMap, loadLeads } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Contatos recebidos" };

export default async function LeadsPage() {
  const [leads, clientByLead] = await Promise.all([loadLeads(), loadLeadClientMap()]);
  return (
    <>
      <PageTitle
        title="Contatos recebidos"
        intro="Mensagens enviadas pelo formulário do site. O site não envia e-mail automático: confira esta página regularmente. Quando fechar negócio, use “Transformar em cliente” para acompanhar o atendimento."
      />
      <LeadsList leads={leads} clientByLead={clientByLead} />
    </>
  );
}
