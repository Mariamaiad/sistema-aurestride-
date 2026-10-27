import Image from "next/image";
import { ArrowUpRight, Check } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { ServiceIcon } from "@/components/ui/icons";
import { linkProps } from "@/lib/links";
import type { Service, SiteSettings } from "@/lib/types";

function ServiceCard({ service, href }: { service: Service; href: string }) {
  return (
    <article className="card reveal group flex flex-col overflow-hidden transition-colors hover:border-line-strong">
      {service.image_url && (
        <div className="relative aspect-[16/9]">
          <Image src={service.image_url} alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-electric/30 bg-electric/10 text-electric-soft">
          <ServiceIcon name={service.icon} className="h-5 w-5" />
        </div>
        <h3 className="mt-5 text-lg font-semibold leading-snug text-paper">{service.title}</h3>
        {service.description && <p className="mt-2.5 text-sm leading-relaxed text-mist">{service.description}</p>}
        {service.deliverables.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {service.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-paper/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric-soft" aria-hidden="true" />
                {d}
              </li>
            ))}
          </ul>
        )}
        {service.notes && <p className="mt-4 text-xs leading-relaxed text-mist">{service.notes}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          {service.price_label ? (
            <span className="text-sm font-semibold text-paper">{service.price_label}</span>
          ) : (
            <span />
          )}
          <a
            {...linkProps(href)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric-soft transition-colors hover:text-paper"
          >
            Solicitar orçamento
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            <span className="sr-only">para {service.title}</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function ServicesSection({
  id,
  eyebrow,
  title,
  subtitle,
  services,
  serviceHref,
  bordered = true,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  services: Service[];
  serviceHref: (s: string) => string;
  bordered?: boolean;
}) {
  if (services.length === 0) return null;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`section ${bordered ? "border-t border-line" : ""}`}>
      <div className="container-site">
        <SectionHeading id={`${id}-title`} eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} href={serviceHref(s.title)} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Sistemas web: lista de possibilidades + chamada para levantamento de requisitos. */
export function SystemsSection({
  s,
  services,
  quoteHref,
}: {
  s: SiteSettings["sections"];
  services: Service[];
  quoteHref: string;
}) {
  if (services.length === 0) return null;
  return (
    <section id="sistemas" aria-labelledby="sistemas-title" className="section border-t border-line">
      <div className="container-site">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-electric/15 via-ink-2 to-ink p-7 sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-electric/25"
          />
          <div className="relative grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            <div>
              <SectionHeading id="sistemas-title" eyebrow={s.systems_eyebrow} title={s.systems_title} subtitle={s.systems_subtitle} />
              <a {...linkProps(quoteHref)} className="btn btn-primary reveal mt-8">
                Conversar sobre o meu projeto
              </a>
            </div>
            <ul className="grid content-start gap-3 sm:grid-cols-2">
              {services.map((svc) => (
                <li key={svc.id} className="reveal flex items-start gap-3.5 rounded-xl border border-line bg-ink/50 p-4">
                  <ServiceIcon name={svc.icon} className="mt-0.5 h-5 w-5 shrink-0 text-electric-soft" />
                  <div>
                    <p className="text-sm font-semibold text-paper">{svc.title}</p>
                    {svc.description && <p className="mt-1 text-sm leading-relaxed text-mist">{svc.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
