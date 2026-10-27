"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitLead, type LeadState } from "@/app/(site)/actions";

const fieldCls =
  "mt-1.5 w-full rounded-lg border border-line-strong bg-ink/60 px-3.5 py-2.5 text-[0.9375rem] text-paper placeholder:text-slate focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/40 aria-[invalid=true]:border-red-400";

export function ContactForm({ interests, privacyEnabled }: { interests: string[]; privacyEnabled: boolean }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { status: "idle" });
  const startedAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const err = state.status === "error" ? state.fieldErrors ?? {} : {};

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  if (state.status === "success") {
    return (
      <div role="status" className="card flex flex-col items-start gap-3 p-7">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" aria-hidden="true" />
        <p className="text-lg font-semibold text-paper">{state.message}</p>
      </div>
    );
  }

  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`lead-${name}`} className="text-sm font-medium text-paper">
        {label}
      </label>
      <input
        id={`lead-${name}`}
        name={name}
        className={fieldCls}
        aria-invalid={Boolean(err[name])}
        aria-describedby={err[name] ? `lead-${name}-err` : undefined}
        {...props}
      />
      {err[name] && (
        <p id={`lead-${name}-err`} className="mt-1 text-xs text-red-300">
          {err[name]}
        </p>
      )}
    </div>
  );

  return (
    <form
      ref={formRef}
      action={(fd) => {
        fd.set("started_at", String(startedAt.current));
        return action(fd);
      }} noValidate className="card grid gap-4 p-6 md:p-7">
      {/* Anti-spam: campo oculto e marcação de tempo */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {field("name", "Nome *", { autoComplete: "name", required: true, maxLength: 120 })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("email", "E-mail", { type: "email", autoComplete: "email", maxLength: 200 })}
        {field("phone", "WhatsApp / telefone", { type: "tel", autoComplete: "tel", maxLength: 40, inputMode: "tel" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("company", "Empresa", { autoComplete: "organization", maxLength: 160 })}
        <div>
          <label htmlFor="lead-interest" className="text-sm font-medium text-paper">
            Interesse
          </label>
          <select id="lead-interest" name="interest" className={fieldCls} defaultValue="">
            <option value="">Selecione</option>
            {interests.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="lead-message" className="text-sm font-medium text-paper">
          Mensagem *
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={4}
          maxLength={3000}
          required
          className={fieldCls}
          aria-invalid={Boolean(err.message)}
          aria-describedby={err.message ? "lead-message-err" : undefined}
        />
        {err.message && (
          <p id="lead-message-err" className="mt-1 text-xs text-red-300">
            {err.message}
          </p>
        )}
      </div>
      <div>
        <label className="flex items-start gap-2.5 text-sm text-mist">
          <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[var(--color-electric)]" />
          <span>
            Concordo com o uso destes dados para receber o contato da equipe
            {privacyEnabled && (
              <>
                {" "}
                (
                <Link href="/privacidade" className="underline hover:text-paper">
                  política de privacidade
                </Link>
                )
              </>
            )}
            .
          </span>
        </label>
        {err.consent && <p className="mt-1 text-xs text-red-300">{err.consent}</p>}
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {state.message}
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full sm:w-auto sm:justify-self-start" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {pending ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
