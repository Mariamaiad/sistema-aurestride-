"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Loader2, Plus, Trash2 } from "lucide-react";
import {
  ACTIVITY_KINDS,
  formatDate,
  relativeDay,
  type ActivityKind,
  type Client,
  type ClientActivity,
  type ClientTask,
} from "@/lib/admin/clients";
import { addActivity, addTask, deleteActivity, deleteTask, setNextContact, setTaskDone } from "@/app/admin/client-actions";
import { useToast } from "../toast";
import { IconBtn, inputCls } from "../fields";

type Result = { ok: boolean; message?: string; error?: string };

const KIND_COLOR: Record<ActivityKind, string> = {
  note: "bg-white/40",
  meeting: "bg-violet-400",
  call: "bg-sky-400",
  whatsapp: "bg-emerald-400",
  delivery: "bg-electric",
  payment: "bg-amber-300",
  feedback: "bg-pink-400",
};

function addDays(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

export function ClientCare({
  client,
  tasks,
  activities,
  today,
  readOnly,
}: {
  client: Client;
  tasks: ClientTask[];
  activities: ClientActivity[];
  today: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<Result>, after?: () => void) => {
    if (readOnly) {
      toast("error", "Modo demonstração: nada é salvo sem o banco de dados.");
      return;
    }
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast("success", r.message ?? "Salvo.");
        after?.();
        router.refresh();
      } else toast("error", r.error ?? "Erro ao salvar.");
    });
  };

  return (
    <div className="grid gap-6">
      <NextContact client={client} today={today} pending={pending} run={run} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Tasks clientId={client.id} tasks={tasks} today={today} pending={pending} run={run} />
        <NewActivity clientId={client.id} today={today} pending={pending} run={run} />
      </div>
      <Timeline clientId={client.id} activities={activities} pending={pending} run={run} />
    </div>
  );
}

type RunFn = (fn: () => Promise<Result>, after?: () => void) => void;

/* ---------------- próximo contato ---------------- */

function NextContact({ client, today, pending, run }: { client: Client; today: string; pending: boolean; run: RunFn }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(client.next_contact ?? addDays(today, 7));
  const [note, setNote] = useState(client.next_contact_note);
  const rel = client.next_contact ? relativeDay(client.next_contact, today) : null;
  const tone =
    rel?.tone === "late"
      ? "border-red-400/40 bg-red-400/[0.06]"
      : rel?.tone === "today"
        ? "border-amber-400/40 bg-amber-400/[0.06]"
        : "border-white/10 bg-white/[0.02]";

  return (
    <section aria-labelledby="next-contact" className={`rounded-2xl border p-5 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-electric-soft" aria-hidden="true" />
          <div>
            <h2 id="next-contact" className="text-sm font-semibold text-paper">
              Próximo contato
            </h2>
            {client.next_contact ? (
              <>
                <p className={`mt-0.5 text-lg font-semibold ${rel?.tone === "late" ? "text-red-200" : "text-paper"}`}>
                  {rel?.text}
                  {rel?.tone !== "later" && <span className="ml-2 text-sm font-normal text-mist">{formatDate(client.next_contact)}</span>}
                </p>
                {client.next_contact_note && <p className="mt-1 text-sm text-mist">{client.next_contact_note}</p>}
              </>
            ) : (
              <p className="mt-0.5 text-sm text-mist">Nenhum contato agendado. Defina uma data para não deixar o cliente sem retorno.</p>
            )}
          </div>
        </div>
        {!editing && (
          <button type="button" className="btn btn-outline !min-h-9 !py-1.5 text-sm" onClick={() => setEditing(true)}>
            {client.next_contact ? "Reagendar" : "Agendar"}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              ["Amanhã", 1],
              ["Em 1 semana", 7],
              ["Em 15 dias", 15],
              ["Em 1 mês", 30],
            ].map(([label, d]) => (
              <button
                key={label}
                type="button"
                onClick={() => setDate(addDays(today, d as number))}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-mist hover:text-paper"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-[11rem_1fr]">
            <input type="date" aria-label="Data do próximo contato" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
            <input
              aria-label="O que tratar no próximo contato"
              placeholder="O que tratar (ex.: aprovar o calendário de posts)"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {client.next_contact && (
              <button
                type="button"
                className="btn btn-ghost !min-h-9 !py-1.5 text-sm"
                disabled={pending}
                onClick={() => run(() => setNextContact(client.id, null, ""), () => setEditing(false))}
              >
                Remover agendamento
              </button>
            )}
            <button type="button" className="btn btn-ghost !min-h-9 !py-1.5 text-sm" onClick={() => setEditing(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary !min-h-9 !py-1.5 text-sm"
              disabled={pending || !date}
              onClick={() => run(() => setNextContact(client.id, date, note), () => setEditing(false))}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar data
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- tarefas ---------------- */

function Tasks({ clientId, tasks, today, pending, run }: { clientId: string; tasks: ClientTask[]; today: string; pending: boolean; run: RunFn }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [showDone, setShowDone] = useState(false);
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const add = () => {
    if (!title.trim()) return;
    run(() => addTask(clientId, { title, due_date: due || null }), () => {
      setTitle("");
      setDue("");
    });
  };

  return (
    <section aria-labelledby="tasks" className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 id="tasks" className="font-semibold text-paper">
        Tarefas e entregas <span className="text-sm font-normal text-mist">({open.length} abertas)</span>
      </h2>

      <div className="mt-4 grid gap-2">
        <input
          aria-label="Nova tarefa"
          placeholder="Nova tarefa (ex.: enviar relatório do mês)"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={inputCls}
        />
        <div className="flex gap-2">
          <input type="date" aria-label="Prazo da tarefa" value={due} onChange={(e) => setDue(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
          <button type="button" onClick={add} disabled={pending || !title.trim()} className="btn btn-outline !min-h-0 shrink-0 !px-3 !py-2 text-sm">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
      </div>

      {open.length === 0 ? (
        <p className="mt-4 text-sm text-mist">Nenhuma tarefa aberta.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {open.map((t) => (
            <TaskRow key={t.id} t={t} today={today} pending={pending} run={run} clientId={clientId} />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="mt-3">
          <button type="button" className="text-xs text-mist underline-offset-2 hover:text-paper hover:underline" onClick={() => setShowDone((x) => !x)}>
            {showDone ? "Ocultar" : "Mostrar"} concluídas ({done.length})
          </button>
          {showDone && (
            <ul className="mt-2 divide-y divide-white/[0.06]">
              {done.map((t) => (
                <TaskRow key={t.id} t={t} today={today} pending={pending} run={run} clientId={clientId} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function TaskRow({ t, today, pending, run, clientId }: { t: ClientTask; today: string; pending: boolean; run: RunFn; clientId: string }) {
  const late = !t.done && t.due_date && t.due_date < today;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={t.done}
        aria-label={t.done ? `Reabrir: ${t.title}` : `Concluir: ${t.title}`}
        disabled={pending}
        onClick={() => run(() => setTaskDone(clientId, t.id, !t.done))}
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          t.done ? "border-emerald-400 bg-emerald-400 text-ink" : "border-white/30 hover:border-paper"
        }`}
      >
        {t.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${t.done ? "text-mist line-through" : "text-paper"}`}>{t.title}</p>
        {t.due_date && (
          <p className={`text-xs ${late ? "text-red-300" : "text-mist"}`}>
            {late ? "Atrasada · " : "Prazo: "}
            {formatDate(t.due_date)}
          </p>
        )}
      </div>
      <IconBtn label="Excluir tarefa" danger disabled={pending} onClick={() => window.confirm("Excluir esta tarefa?") && run(() => deleteTask(clientId, t.id))}>
        <Trash2 className="h-3.5 w-3.5" />
      </IconBtn>
    </li>
  );
}

/* ---------------- registrar interação ---------------- */

function NewActivity({ clientId, today, pending, run }: { clientId: string; today: string; pending: boolean; run: RunFn }) {
  const [kind, setKind] = useState<ActivityKind>("whatsapp");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(today);
  const [schedule, setSchedule] = useState("");

  const submit = () => {
    if (!content.trim()) return;
    run(
      () => addActivity(clientId, { kind, content, happened_on: date, ...(schedule ? { next_contact: schedule } : {}) }),
      () => {
        setContent("");
        setSchedule("");
        setDate(today);
      }
    );
  };

  return (
    <section aria-labelledby="new-activity" className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 id="new-activity" className="font-semibold text-paper">
        Registrar atendimento
      </h2>
      <div className="mt-4 grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as ActivityKind)} className={inputCls}>
            {Object.entries(ACTIVITY_KINDS).map(([v, l]) => (
              <option key={v} value={v} className="bg-ink">
                {l}
              </option>
            ))}
          </select>
          <input type="date" aria-label="Data" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
        </div>
        <textarea
          aria-label="O que aconteceu"
          placeholder="O que foi conversado, entregue ou combinado"
          rows={3}
          maxLength={3000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={inputCls}
        />
        <label className="grid gap-1 text-xs text-mist">
          Agendar o próximo contato (opcional)
          <input type="date" value={schedule} min={today} onChange={(e) => setSchedule(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
        </label>
        <div className="flex justify-end">
          <button type="button" onClick={submit} disabled={pending || !content.trim()} className="btn btn-primary !min-h-9 !py-1.5 text-sm">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Registrar
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- histórico ---------------- */

function Timeline({ clientId, activities, pending, run }: { clientId: string; activities: ClientActivity[]; pending: boolean; run: RunFn }) {
  return (
    <section aria-labelledby="timeline" className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 id="timeline" className="font-semibold text-paper">
        Histórico de atendimento
      </h2>
      {activities.length === 0 ? (
        <p className="mt-4 text-sm text-mist">Nada registrado ainda. Cada conversa, reunião ou entrega registrada aparece aqui.</p>
      ) : (
        <ol className="mt-5 grid gap-0">
          {activities.map((a, i) => (
            <li key={a.id} className="relative grid grid-cols-[1.25rem_1fr_auto] gap-3 pb-5">
              {i < activities.length - 1 && <span className="absolute left-[0.56rem] top-4 h-full w-px bg-white/10" aria-hidden="true" />}
              <span className={`relative mt-1.5 h-3 w-3 justify-self-center rounded-full ring-4 ring-[#0d1424] ${KIND_COLOR[a.kind]}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-mist">
                  <span className="font-medium text-paper">{ACTIVITY_KINDS[a.kind]}</span> · {formatDate(a.happened_on)}
                  {a.author_email && ` · ${a.author_email}`}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-paper/90">{a.content}</p>
              </div>
              <IconBtn
                label="Excluir registro"
                danger
                disabled={pending}
                onClick={() => window.confirm("Excluir este registro do histórico?") && run(() => deleteActivity(clientId, a.id))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
