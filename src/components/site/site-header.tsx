"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const NAV = [
  { href: "/#inicio", label: "Início" },
  { href: "/#sobre", label: "Sobre Nós" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#portfolio", label: "Portfólio" },
  { href: "/#contato", label: "Contato" },
];

export function SiteHeader({
  brandName,
  logoUrl,
  quoteHref,
  showPortfolio,
}: {
  brandName: string;
  logoUrl?: string;
  quoteHref: string;
  showPortfolio: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const external = quoteHref.startsWith("http");
  const nav = showPortfolio ? NAV : NAV.filter((n) => n.label !== "Portfólio");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || open ? "border-b border-line bg-ink/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded focus:bg-electric focus:px-3 focus:py-2 focus:text-white">
        Pular para o conteúdo
      </a>
      <div className="container-site flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Link href="/#inicio" aria-label={`${brandName} — início`} onClick={() => setOpen(false)}>
          <Logo name={brandName} logoUrl={logoUrl} />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-[0.9375rem] text-mist">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition-colors hover:text-paper">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={quoteHref}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="btn btn-primary hidden !min-h-10 !px-4 !py-2 text-sm sm:inline-flex"
          >
            Solicitar orçamento
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-paper lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        hidden={!open}
        className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-ink lg:hidden"
      >
        <nav aria-label="Menu móvel" className="container-site flex flex-col py-6">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-4 font-display text-2xl text-paper"
            >
              {item.label}
            </a>
          ))}
          <a
            href={quoteHref}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            onClick={() => setOpen(false)}
            className="btn btn-primary mt-8 w-full"
          >
            Solicitar orçamento
          </a>
        </nav>
      </div>
    </header>
  );
}
