import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { ClientsBoard } from "@/components/admin/clients/clients-board";
import { loadClients } from "@/lib/admin/data";
import { todayISO } from "@/lib/admin/clients";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
  let clients: Awaited<ReturnType<typeof loadClients>> = [];
  let missingTable = false;
  try {
    clients = await loadClients();
  } catch {
    missingTable = true;
  }
  return (
    <>
      <PageTitle
        title="Clientes"
        intro="Acompanhamento de cada cliente: situação, contrato, próximo contato, tarefas e histórico de atendimento. Estes dados são internos e não aparecem no site."
      />
      {missingTable ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100">
          A tabela de clientes ainda não existe no banco. Aplique a migração <code>20261028000002_clientes.sql</code> no SQL Editor do Supabase
          (veja o README) e recarregue esta página.
        </p>
      ) : (
        <ClientsBoard clients={clients} today={todayISO()} />
      )}
    </>
  );
}
