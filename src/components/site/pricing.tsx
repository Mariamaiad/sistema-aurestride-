import { ArrowUpRight, Check, Info } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { formatPlanPrice, formatWebPrice } from "@/lib/format";
import { linkProps } from "@/lib/links";
import type { MarketingPlan, SiteSettings, WebPrice } from "@/lib/types";

function PlanCard({ plan, href }: { plan: MarketingPlan; href: string }) {
  const price = formatPlanPrice(plan);
  const hl = plan.highlighted;
  return (
    <article
      className={`reveal relative flex flex-col rounded-2xl border p-7 md:p-8 ${
        hl
          ? "border-electric/70 bg-gradient-to-b from-electric/[0.16] to-ink-2 shadow-[0_30px_80px_-40px_var(--color-electric)]"
          : "card"
      }`}
    >
      {hl && (
        <span className="absolute -top-3 left-7 rounded-full bg-electric px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-white">
          Recomendado
        </span>
      )}
      <h3 className="display text-[1.75rem] text-paper">{plan.name}</h3>
      {plan.description && <p className="mt-2 text-sm leading-relaxed text-mist">{plan.description}</p>}

      <div className="mt-6 flex items-baseline gap-1.5">
        {price ? (
          <>
            <span className="text-4xl font-semibold tracking-tight text-paper">{price}</span>
            <span className="text-sm text-mist">{plan.price_suffix}</span>
          </>
        ) : (
          <span className="text-2xl font-semibold text-paper">Sob consulta</span>
        )}
      </div>

      {plan.contents_count != null && (
        <div className="mt-6 rounded-xl border border-line bg-ink/40 p-4">
          <p className="text-sm text-paper">
            <strong className="text-lg font-semibold">Até {plan.contents_count}</strong> conteúdos por mês
          </p>
          {plan.videos_count != null && plan.videos_count > 0 && (
            <p className="mt-1 text-sm text-mist">
              incluindo até <strong className="font-semibold text-paper">{plan.videos_count} vídeos curtos</strong> editados
            </p>
          )}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {plan.items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-paper/90">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric-soft" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>

      {plan.notes && <p className="mt-5 text-xs leading-relaxed text-mist">{plan.notes}</p>}

      <div className="mt-auto pt-8">
        <a {...linkProps(href)} className={`btn w-full ${hl ? "btn-primary" : "btn-outline"}`}>
          Quero este plano
          <span className="sr-only">: {plan.name}</span>
        </a>
      </div>
    </article>
  );
}

export function PlansSection({
  plans,
  s,
  planHref,
}: {
  plans: MarketingPlan[];
  s: SiteSettings["sections"];
  planHref: (p: string) => string;
}) {
  if (plans.length === 0) return null;
  const cols = plans.length >= 3 ? "lg:grid-cols-3" : plans.length === 2 ? "md:grid-cols-2" : "";
  return (
    <section id="planos" aria-labelledby="planos-title" className="section border-t border-line">
      <div className="container-site">
        <SectionHeading id="planos-title" eyebrow={s.plans_eyebrow} title={s.plans_title} subtitle={s.plans_subtitle} align="center" />
        <div className={`mx-auto mt-16 grid max-w-6xl items-stretch gap-6 ${cols}`}>
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} href={planHref(p.name)} />
          ))}
        </div>
        {s.plans_disclaimer && (
          <p className="reveal mx-auto mt-10 flex max-w-3xl items-start gap-3 rounded-xl border border-line px-5 py-4 text-sm leading-relaxed text-mist">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-electric-soft" aria-hidden="true" />
            {s.plans_disclaimer}
          </p>
        )}
      </div>
    </section>
  );
}

export function WebPricingSection({
  items,
  s,
  serviceHref,
}: {
  items: WebPrice[];
  s: SiteSettings["sections"];
  serviceHref: (n: string) => string;
}) {
  if (items.length === 0) return null;
  return (
    <section id="precos-web" aria-labelledby="precos-web-title" className="section border-t border-line">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <SectionHeading id="precos-web-title" eyebrow={s.web_pricing_eyebrow} title={s.web_pricing_title} />
          {s.web_pricing_disclaimer && (
            <p className="reveal mt-6 flex items-start gap-3 text-sm leading-relaxed text-mist">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-electric-soft" aria-hidden="true" />
              {s.web_pricing_disclaimer}
            </p>
          )}
        </div>
        <ul className="card reveal divide-y divide-line overflow-hidden">
          {items.map((w) => (
            <li key={w.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <div className="min-w-0">
                <h3 className="font-semibold text-paper">{w.name}</h3>
                {w.description && <p className="mt-1 text-sm text-mist">{w.description}</p>}
                {w.notes && <p className="mt-1 text-xs text-mist">{w.notes}</p>}
              </div>
              <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
                <span className="whitespace-nowrap text-base font-semibold text-paper">
                  {w.show_price ? formatWebPrice(w) : "Sob consulta"}
                </span>
                <a
                  {...linkProps(serviceHref(w.name))}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-electric-soft transition-colors hover:border-electric hover:text-paper"
                  aria-label={`Solicitar orçamento: ${w.name}`}
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
