import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTitle } from "@/components/admin/admin-shell";
import { ClientForm } from "@/components/admin/clients/client-form";
import { adminPreviewMode, loadResource } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NewClientPage() {
  const plans = await loadResource("plans").catch(() => []);
  return (
    <>
      <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mist hover:text-paper">
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>
      <PageTitle title="Novo cliente" intro="Preencha o que já souber. Tudo pode ser completado depois na ficha do cliente." />
      <ClientForm client={null} readOnly={adminPreviewMode} planSuggestions={plans.map((p) => String(p.name))} />
    </>
  );
}
