import Image from "next/image";
import { ArrowRight, Code2, Megaphone, MonitorSmartphone } from "lucide-react";
import { linkProps } from "@/lib/links";
import type { SiteSettings } from "@/lib/types";

const HIGHLIGHT_ICONS = [Megaphone, MonitorSmartphone, Code2];

export function Hero({ hero, quoteHref }: { hero: SiteSettings["hero"]; quoteHref: string }) {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-16 md:pt-[4.5rem]">
      {/* Arcos de luz ao fundo */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 -z-10 h-[56rem] w-[56rem] opacity-70 md:right-[-8rem]"
        viewBox="0 0 800 800"
        fill="none"
      >
        <defs>
          <radialGradient id="hero-glow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="var(--color-electric)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-electric)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="430" cy="360" r="360" fill="url(#hero-glow)" />
        <circle cx="430" cy="360" r="300" stroke="var(--color-electric)" strokeOpacity="0.22" />
        <circle cx="430" cy="360" r="380" stroke="var(--color-electric)" strokeOpacity="0.12" />
      </svg>

      <div className="relative">
        {/* Foto: no celular fica no topo; no desktop ocupa a metade direita */}
        {hero.image_url && (
          <div className="relative h-[19rem] w-full sm:h-[24rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[56%]">
            <Image
              src={hero.image_url}
              alt={hero.image_alt}
              fill
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover object-[50%_30%] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_55%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,black_30%,black_82%,transparent),linear-gradient(to_bottom,transparent,black_16%,black_72%,transparent)] lg:[mask-composite:intersect]"
            />
          </div>
        )}

        <div className="container-site relative">
          <div className="-mt-16 max-w-xl pb-14 sm:-mt-20 lg:mt-0 lg:min-h-[38rem] lg:py-28 xl:min-h-[42rem]">
            <p className="eyebrow reveal">{hero.eyebrow}</p>
            <h1 id="hero-title" className="display reveal mt-4 text-[2.6rem] text-paper sm:text-6xl lg:text-[4.1rem]">
              {hero.title}
            </h1>
            <p className="reveal mt-6 max-w-lg text-base leading-relaxed text-mist sm:text-lg">{hero.subtitle}</p>
            <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#servicos" className="btn btn-primary">
                {hero.cta_primary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a {...linkProps(quoteHref)} className="btn btn-outline">
                {hero.cta_secondary}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa de destaques */}
      {hero.highlights.length > 0 && (
        <div className="container-site relative pb-16">
          <ul className="reveal grid overflow-hidden rounded-xl border border-line bg-ink/70 backdrop-blur-sm sm:grid-cols-3">
            {hero.highlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[i % HIGHLIGHT_ICONS.length];
              return (
                <li
                  key={h.title + i}
                  className="flex items-start gap-4 border-line px-5 py-5 not-last:border-b sm:not-last:border-b-0 sm:not-last:border-r md:px-7 md:py-6"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-electric-soft" strokeWidth={1.6} aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-paper">{h.title}</p>
                    {h.text && <p className="mt-1 text-sm text-mist">{h.text}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
