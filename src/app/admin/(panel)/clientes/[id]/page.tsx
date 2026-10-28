import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Mail } from "lucide-react";
import { HealthDot, StatusBadge } from "@/components/admin/clients/clients-board";
import { ClientCare } from "@/components/admin/clients/client-care";
import { ClientForm } from "@/components/admin/clients/client-form";
import { InstagramIcon, WhatsappIcon } from "@/components/ui/icons";
import { adminPreviewMode, loadClient, loadResource } from "@/lib/admin/data";
import { formatDate, todayISO } from "@/lib/admin/clients";
import { formatBRL, instagramUrl, normalizeWhatsapp, safeExternalUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Cliente" };

const TABS = [
  { key: "acompanhamento", label: "Acompanhamento" },
  { key: "ficha", label: "Ficha do cliente" },
] as const;

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const [{ id }, { aba }] = await Promise.all([params, searchParams]);
  const data = await loadClient(id);
  if (!data) notFound();
  const { client, tasks, activities } = data;
  const tab = TABS.find((t) => t.key === aba) ?? TABS[0];
  const today = todayISO();

  const wa = normalizeWhatsapp(client.phone);
  const ig = instagramUrl(client.instagram);
  const site = safeExternalUrl(client.website);
  const facts = [
    client.contact_name && `Contato: ${client.contact_name}`,
    client.segment,
    client.plan,
    client.monthly_value != null && `${formatBRL(client.monthly_value)}/mês${client.billing_day ? ` · vence dia ${client.billing_day}` : ""}`,
    client.start_date && `Cliente desde ${formatDate(client.start_date, { month: "short", year: "numeric" })}`,
    client.renewal_date && `Renovação em ${formatDate(client.renewal_date)}`,
    client.owner && `Responsável: ${client.owner}`,
  ].filter(Boolean) as string[];

  const plans = tab.key === "ficha" ? await loadResource("plans").catch(() => []) : [];

  return (
    <>
      <Link href="/admin/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mist hover:text-paper">
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-paper md:text-3xl">{client.name}</h1>
          <StatusBadge status={client.status} />
          <HealthDot health={client.health} withLabel />
        </div>
        {facts.length > 0 && <p className="mt-2 text-sm text-mist">{facts.join(" · ")}</p>}
        {client.services.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Serviços contratados">
            {client.services.map((s) => (
              <li key={s} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-paper/85">
                {s}
              </li>
            ))}
          </ul>
        )}
        {(wa || client.email || ig || site) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-9 !py-1.5 text-sm">
                <WhatsappIcon className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="btn btn-outline !min-h-9 !py-1.5 text-sm">
                <Mail className="h-4 w-4" /> E-mail
              </a>
            )}
            {ig && (
              <a href={ig} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-9 !py-1.5 text-sm">
                <InstagramIcon className="h-4 w-4" /> Instagram
              </a>
            )}
            {site && (
              <a href={site} target="_blank" rel="noopener noreferrer" className="btn btn-outline !min-h-9 !py-1.5 text-sm">
                <Globe className="h-4 w-4" /> Site
              </a>
            )}
          </div>
        )}
        {client.notes && (
          <p className="mt-4 whitespace-pre-line rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-paper/90">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-mist">Lembrar sempre</span>
            {client.notes}
          </p>
        )}
      </header>

      <div role="tablist" aria-label="Seções do cliente" className="mb-6 flex gap-1 rounded-xl border border-white/10 p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            role="tab"
            aria-selected={t.key === tab.key}
            href={`/admin/clientes/${client.id}?aba=${t.key}`}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm transition-colors ${
              t.key === tab.key ? "bg-electric text-white" : "text-mist hover:text-paper"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab.key === "acompanhamento" ? (
        <ClientCare key={client.updated_at} client={client} tasks={tasks} activities={activities} today={today} readOnly={adminPreviewMode} />
      ) : (
        <ClientForm key={client.updated_at} client={client} readOnly={adminPreviewMode} planSuggestions={plans.map((p) => String(p.name))} />
      )}
    </>
  );
}
