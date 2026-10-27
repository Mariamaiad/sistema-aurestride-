"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CircleHelp,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Palette,
  Phone,
  Tags,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { signOut } from "@/app/admin/actions";
import { ToastProvider } from "./toast";

const NAV = [
  { href: "/admin", label: "Painel", Icon: LayoutDashboard },
  { section: "Conteúdo" },
  { href: "/admin/conteudo", label: "Textos da página", Icon: FileText },
  { href: "/admin/equipe", label: "Equipe", Icon: Users },
  { href: "/admin/servicos", label: "Serviços", Icon: Wrench },
  { href: "/admin/planos", label: "Planos de marketing", Icon: BadgeDollarSign },
  { href: "/admin/precos-web", label: "Preços web", Icon: Tags },
  { href: "/admin/portfolio", label: "Portfólio", Icon: BriefcaseBusiness },
  { href: "/admin/como-funciona", label: "Como funciona", Icon: ListOrdered },
  { href: "/admin/faq", label: "Perguntas frequentes", Icon: CircleHelp },
  { section: "Configurações" },
  { href: "/admin/identidade", label: "Identidade e SEO", Icon: Palette },
  { href: "/admin/contatos", label: "Contatos e WhatsApp", Icon: Phone },
  { href: "/admin/contatos-recebidos", label: "Contatos recebidos", Icon: Inbox },
] as const;

export function AdminShell({ email, children, preview }: { email: string; children: React.ReactNode; preview?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Painel" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {NAV.map((item, i) =>
        "section" in item ? (
          <p key={i} className="mb-1 mt-5 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate">
            {item.section}
          </p>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={pathname === item.href ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === item.href ? "bg-electric/15 font-medium text-paper" : "text-mist hover:bg-white/5 hover:text-paper"
            }`}
          >
            <item.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      )}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-3">
      <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-paper">
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver o site
      </a>
      <p className="truncate px-3 pt-2 text-xs text-slate" title={email}>
        {email}
      </p>
      <form action={signOut}>
        <button type="submit" disabled={preview} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-paper disabled:opacity-40">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
        </button>
      </form>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#080d18]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-ink lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
            <LogoMark className="h-7 w-7 text-electric" />
            <span className="text-sm font-semibold text-paper">Painel Aurestride</span>
          </div>
          {nav}
          {footer}
        </aside>

        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-ink px-4 lg:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold text-paper">
            <LogoMark className="h-6 w-6 text-electric" /> Painel
          </span>
          <button type="button" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-paper">
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
            <aside className="flex h-full w-72 flex-col bg-ink" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                <span className="text-sm font-semibold text-paper">Painel Aurestride</span>
                <button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-paper">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {nav}
              {footer}
            </aside>
          </div>
        )}

        <div className="lg:pl-64">
          {preview && (
            <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-medium text-ink">
              Pré-visualização do painel sem banco de dados: nada pode ser salvo.
            </div>
          )}
          <main className="mx-auto max-w-4xl px-5 py-8 md:py-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

export function PageTitle({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-paper md:text-3xl">{title}</h1>
      {intro && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">{intro}</p>}
    </div>
  );
}
