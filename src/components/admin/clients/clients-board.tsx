"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, ListTodo, Plus, Search } from "lucide-react";
import { CLIENT_HEALTH, CLIENT_STATUS, relativeDay, type ClientStatus, type ClientSummary } from "@/lib/admin/clients";
import { formatBRL } from "@/lib/format";
import { inputCls } from "../fields";

type Filter = "current" | ClientStatus | "all" | "follow";

const TONE = {
  late: "text-red-300",
  today: "text-amber-200",
  soon: "text-paper",
  later: "text-mist",
} as const;

export function StatusBadge({ status }: { status: ClientStatus }) {
  const s = CLIENT_STATUS[status];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-medium ${s.cls}`}>{s.label}</span>;
}

export function HealthDot({ health, withLabel }: { health: keyof typeof CLIENT_HEALTH; withLabel?: boolean }) {
  const h = CLIENT_HEALTH[health];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-mist" title={`Relacionamento: ${h.label}`}>
      <span className={`h-2 w-2 rounded-full ${h.dot}`} aria-hidden="true" />
      {withLabel ? h.label : <span className="sr-only">{h.label}</span>}
    </span>
  );
}

export function ClientsBoard({ clients, today }: { clients: ClientSummary[]; today: string }) {
  const [filter, setFilter] = useState<Filter>("current");
  const [query, setQuery] = useState("");

  const isCurrent = (c: ClientSummary) => c.status === "active" || c.status === "onboarding";
  const needsFollow = (c: ClientSummary) =>
    c.status !== "ended" && ((c.next_contact !== null && c.next_contact <= today) || c.overdue_tasks > 0 || c.health === "risk");

  const counts = useMemo(() => {
    const out: Record<Filter, number> = { current: 0, all: clients.length, follow: 0, prospect: 0, onboarding: 0, active: 0, paused: 0, ended: 0 };
    clients.forEach((c) => {
      out[c.status]++;
      if (isCurrent(c)) out.current++;
      if (needsFollow(c)) out.follow++;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, today]);

  const mrr = clients.filter(isCurrent).reduce((s, c) => s + (c.monthly_value ?? 0), 0);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) =>
        filter === "all" ? true : filter === "current" ? isCurrent(c) : filter === "follow" ? needsFollow(c) : c.status === filter
      )
      .filter((c) => !q || [c.name, c.contact_name, c.segment, c.plan, c.owner, ...c.services].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        // Quem precisa de contato primeiro; depois por nome.
        const da = a.next_contact ?? "9999";
        const db = b.next_contact ?? "9999";
        return da === db ? a.name.localeCompare(b.name, "pt-BR") : da.localeCompare(db);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, filter, query, today]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "current", label: "Em atendimento" },
    { key: "follow", label: "Precisam de atenção" },
    { key: "prospect", label: CLIENT_STATUS.prospect.label },
    { key: "paused", label: CLIENT_STATUS.paused.label },
    { key: "ended", label: CLIENT_STATUS.ended.label },
    { key: "all", label: "Todos" },
  ];

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Clientes em atendimento" value={String(counts.current)} detail={`${counts.prospect} em negociação`} />
        <Stat label="Receita mensal recorrente" value={formatBRL(mrr)} detail="soma dos clientes em atendimento" />
        <Stat
          label="Precisam de atenção"
          value={String(counts.follow)}
          detail="contato vencido, tarefa atrasada ou em risco"
          alert={counts.follow > 0}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, segmento, serviço ou responsável"
            aria-label="Buscar clientes"
            className={`${inputCls} pl-9`}
          />
        </div>
        <Link href="/admin/clientes/novo" className="btn btn-primary !min-h-10 shrink-0 !py-2 text-sm">
          <Plus className="h-4 w-4" /> Novo cliente
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full border px-3 py-1 text-xs ${filter === f.key ? "border-electric bg-electric/20 text-paper" : "border-white/10 text-mist hover:text-paper"}`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-mist">
          <p>Nenhum cliente cadastrado ainda.</p>
          <p className="mt-1">
            Cadastre em <strong className="text-paper">Novo cliente</strong> ou transforme uma mensagem de{" "}
            <Link href="/admin/contatos-recebidos" className="text-electric-soft underline">
              Contatos recebidos
            </Link>{" "}
            em cliente.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-6 py-8 text-center text-sm text-mist">Nenhum cliente neste filtro.</p>
      ) : (
        <ul className="grid gap-2.5">
          {shown.map((c) => {
            const next = c.next_contact ? relativeDay(c.next_contact, today) : null;
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/25 sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <HealthDot health={c.health} />
                      <p className="truncate font-medium text-paper">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-mist">
                      {[c.segment, c.plan, c.monthly_value != null ? `${formatBRL(c.monthly_value)}/mês` : "", c.owner && `Resp.: ${c.owner}`]
                        .filter(Boolean)
                        .join(" · ") || "Ficha sem detalhes"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:justify-end">
                    {next && (
                      <span className={`inline-flex items-center gap-1.5 ${TONE[next.tone]}`}>
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        {next.text}
                      </span>
                    )}
                    {c.open_tasks > 0 && (
                      <span className={`inline-flex items-center gap-1.5 ${c.overdue_tasks ? "text-red-300" : "text-mist"}`}>
                        <ListTodo className="h-3.5 w-3.5" aria-hidden="true" />
                        {c.open_tasks} {c.open_tasks === 1 ? "tarefa" : "tarefas"}
                        {c.overdue_tasks > 0 && ` (${c.overdue_tasks} atrasada${c.overdue_tasks > 1 ? "s" : ""})`}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value, detail, alert }: { label: string; value: string; detail: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? "border-amber-400/40 bg-amber-400/[0.06]" : "border-white/10 bg-white/[0.02]"}`}>
      <p className="flex items-center gap-1.5 text-xs text-mist">
        {alert && <AlertTriangle className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />}
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-paper">{value}</p>
      <p className="text-xs text-mist">{detail}</p>
    </div>
  );
}
