"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Trash2 } from "lucide-react";
import { deleteLead, setLeadStatus } from "@/app/admin/actions";
import type { Lead } from "@/lib/admin/data";
import { useToast } from "./toast";
import { IconBtn } from "./fields";
import { normalizeWhatsapp } from "@/lib/format";

const STATUS = { new: "Novo", contacted: "Respondido", archived: "Arquivado" } as const;

export function LeadsList({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<"all" | Lead["status"]>("all");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const shown = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast("success", r.message ?? "Feito.");
        router.refresh();
      } else toast("error", r.error ?? "Erro.");
    });

  if (leads.length === 0) {
    return <p className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-mist">Nenhum contato recebido ainda.</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["all", "new", "contacted", "archived"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "border-electric bg-electric/20 text-paper" : "border-white/10 text-mist"}`}
          >
            {f === "all" ? "Todos" : STATUS[f]} ({f === "all" ? leads.length : leads.filter((l) => l.status === f).length})
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {shown.map((l) => (
          <li key={l.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-paper">
                  {l.name}
                  {l.company && <span className="text-mist"> · {l.company}</span>}
                </p>
                <p className="text-xs text-mist">
                  {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  {l.interest && ` · Interesse: ${l.interest}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Status"
                  value={l.status}
                  disabled={pending}
                  onChange={(e) => run(() => setLeadStatus(l.id, e.target.value as Lead["status"]))}
                  className="rounded-lg border border-white/10 bg-ink px-2 py-1.5 text-xs text-paper"
                >
                  {Object.entries(STATUS).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
                <IconBtn label="Excluir contato" danger disabled={pending} onClick={() => window.confirm("Excluir este contato definitivamente?") && run(() => deleteLead(l.id))}>
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-paper/90">{l.message}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {l.email && (
                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 text-electric-soft hover:text-paper">
                  <Mail className="h-4 w-4" /> {l.email}
                </a>
              )}
              {l.phone && (
                <a href={`https://wa.me/${normalizeWhatsapp(l.phone)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-electric-soft hover:text-paper">
                  <Phone className="h-4 w-4" /> {l.phone}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
