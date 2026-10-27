import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { SectionHeading } from "./section-heading";
import type { Faq, PortfolioProject, ProcessStep, SiteSettings } from "@/lib/types";

export const PROJECT_CATEGORY_LABEL: Record<PortfolioProject["category"], string> = {
  marketing: "Marketing",
  site: "Site",
  sistema: "Sistema",
};

export function PortfolioSection({ projects, s }: { projects: PortfolioProject[]; s: SiteSettings["sections"] }) {
  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="section border-t border-line">
      <div className="container-site">
        <SectionHeading id="portfolio-title" eyebrow={s.portfolio_eyebrow} title={s.portfolio_title} subtitle={s.portfolio_subtitle} />
        {projects.length === 0 ? (
          <p className="card reveal mt-12 px-6 py-10 text-center text-mist">{s.portfolio_empty}</p>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/portfolio/${p.slug}`} className="card reveal group block overflow-hidden">
                <div className="relative aspect-[16/10] bg-ink-2">
                  {p.cover_url ? (
                    <Image
                      src={p.cover_url}
                      alt={`Capa do projeto ${p.title}`}
                      fill
                      sizes="(min-width: 768px) 45vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-4xl text-slate">{p.title}</div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4 p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-electric-soft">
                      {PROJECT_CATEGORY_LABEL[p.category]}
                      {p.client && p.client !== p.title ? ` · ${p.client}` : ""}
                    </p>
                    <h3 className="display mt-2 text-2xl text-paper">{p.title}</h3>
                    {p.summary && <p className="mt-2 text-sm leading-relaxed text-mist">{p.summary}</p>}
                  </div>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-mist transition-colors group-hover:text-paper" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ProcessSection({ steps, s }: { steps: ProcessStep[]; s: SiteSettings["sections"] }) {
  if (steps.length === 0) return null;
  return (
    <section id="como-funciona" aria-labelledby="processo-title" className="section border-t border-line">
      <div className="container-site">
        <SectionHeading id="processo-title" eyebrow={s.process_eyebrow} title={s.process_title} />
        <ol className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((st, i) => (
            <li key={st.id} className="card reveal relative p-6">
              <span className="font-display text-5xl italic text-electric-soft/80" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-paper">
                <span className="sr-only">Etapa {i + 1}: </span>
                {st.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{st.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FaqSection({ faqs, s }: { faqs: Faq[]; s: SiteSettings["sections"] }) {
  if (faqs.length === 0) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className="section border-t border-line">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading id="faq-title" eyebrow={s.faq_eyebrow} title={s.faq_title} />
        <div className="reveal divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.id} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base font-medium text-paper marker:hidden [&::-webkit-details-marker]:hidden">
                {f.question}
                <Plus
                  className="h-5 w-5 shrink-0 text-electric-soft transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-6 pr-10 text-sm leading-relaxed text-mist whitespace-pre-line">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
