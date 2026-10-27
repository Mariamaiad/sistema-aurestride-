import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/ui/logo";
import { getAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (isSupabaseConfigured && (await getAdmin())) redirect("/admin");
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#080d18] px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark className="h-10 w-10 text-electric" />
          <div>
            <p className="font-semibold text-paper">Painel Aurestride</p>
            <p className="text-sm text-mist">Acesso restrito à equipe</p>
          </div>
        </div>
        {isSupabaseConfigured ? (
          <LoginForm />
        ) : (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100">
            O banco de dados ainda não foi conectado. Siga a seção “Configurar o Supabase” do README para ativar o login.
          </p>
        )}
      </div>
    </main>
  );
}
