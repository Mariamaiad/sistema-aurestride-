"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type ActionResult } from "@/app/admin/actions";
import { inputCls } from "@/components/admin/fields";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(signIn, { ok: true });
  const err = !state.ok ? state.fieldErrors ?? {} : {};
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-white/10 bg-ink p-6">
      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-paper">
          E-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} aria-invalid={Boolean(err.email)} />
        {err.email && <p className="text-xs text-red-300">{err.email}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-paper">
          Senha
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} aria-invalid={Boolean(err.password)} />
        {err.password && <p className="text-xs text-red-300">{err.password}</p>}
      </div>
      {!state.ok && (
        <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
