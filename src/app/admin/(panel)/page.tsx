import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BadgeDollarSign, BriefcaseBusiness, CalendarClock, HeartHandshake, Inbox, Users, Wrench } from "lucide-react";
import { PageTitle } from "@/components/admin/admin-shell";
import { loadDashboard } from "@/lib/admin/data";
import { relativeDay, todayISO } from "@/lib/admin/clients";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Painel" };

export default async function Dashboard() {
  const d = await loadDashboard();
  const today = todayISO();
  const cards = [
    {
      label: "Clientes em atendimento",
      value: d.clients.active,
      detail: `${formatBRL(d.clients.mrr)}/mês${d.clients.atRisk ? ` · ${d.clients.atRisk} em risco` : ""}`,
      href: "/admin/clientes",
      Icon: HeartHandshake,
    },
    { label: "Serviços ativos", value: d.services.active, detail: `de ${d.services.total} cadastrados`, href: "/admin/servicos", Icon: Wrench },
    { label: "Planos ativos", value: d.plans.active, detail: `de ${d.plans.total} cadastrados`, href: "/admin/planos", Icon: BadgeDollarSign },
    { label: "Projetos publicados", value: d.projects.published, detail: `${d.projects.drafts} em rascunho`, href: "/admin/portfolio", Icon: BriefcaseBusiness },
    { label: "Perfis visíveis", value: d.team.visible, detail: `de ${d.team.total} na equipe`, href: "/admin/equipe", Icon: Users },
    { label: "Contatos novos", value: d.newLeads, detail: "pelo formulário", href: "/admin/contatos-recebidos", Icon: Inbox },
  ];

  const shortcuts = [
    ["/admin/clientes/novo", "Cadastrar um cliente"],
    ["/admin/estrutura", "Ordenar ou ocultar seções do site"],
    ["/admin/conteudo", "Editar textos da página"],
    ["/admin/equipe", "Trocar fotos e biografias"],
    ["/admin/planos", "Atualizar preços dos planos"],
    ["/admin/precos-web", "Atualizar preços de sites"],
    ["/admin/portfolio", "Cadastrar um projeto"],
    ["/admin/contatos", "Configurar WhatsApp e redes"],
  ];

  return (
    <>
      <PageTitle title="Painel" intro="Resumo dos clientes e do conteúdo do site, com atalhos para as tarefas mais comuns." />

      {(d.missingContacts.length > 0 || d.placeholders.length > 0) && (
        <section aria-label="Pendências" className="mb-8 space-y-3">
          {d.missingContacts.length > 0 && (
            <Link href="/admin/contatos" className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100 hover:bg-amber-400/15">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-semibold">Contatos não configurados:</strong> {d.missingContacts.join(", ")}. Sem WhatsApp, os botões de
                orçamento levam à seção de contato.
              </span>
            </Link>
          )}
          {d.placeholders.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-semibold">Textos provisórios para revisar:</strong> {d.placeholders.join(", ")}.
              </span>
            </div>
          )}
        </section>
      )}

      {d.followUps.length > 0 && (
        <section aria-labelledby="follow" className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h2 id="follow" className="flex items-center gap-2 text-sm font-semibold text-paper">
            <CalendarClock className="h-4 w-4 text-electric-soft" aria-hidden="true" /> Clientes para contatar
          </h2>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {d.followUps.map((f) => {
              const rel = relativeDay(f.next_contact, today);
              return (
                <li key={f.id}>
                  <Link href={`/admin/clientes/${f.id}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5 text-sm hover:text-paper">
                    <span className="text-paper">
                      {f.name}
                      {f.note && <span className="text-mist"> · {f.note}</span>}
                    </span>
                    <span className={`text-xs ${rel.tone === "late" ? "text-red-300" : rel.tone === "today" ? "text-amber-200" : "text-mist"}`}>{rel.text}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, detail, href, Icon }) => (
          <Link key={label} href={href} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/25">
            <Icon className="h-5 w-5 text-electric-soft" aria-hidden="true" />
            <p className="mt-4 text-3xl font-semibold tabular-nums text-paper">{value}</p>
            <p className="text-sm text-paper">{label}</p>
            <p className="text-xs text-mist">{detail}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-slate">Atalhos</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {shortcuts.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 text-sm text-paper hover:border-white/25">
              {label} <ArrowRight className="h-4 w-4 text-mist" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
