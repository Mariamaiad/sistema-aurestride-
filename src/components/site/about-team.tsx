import Image from "next/image";
import { Check } from "lucide-react";
import { SectionHeading } from "./section-heading";
import type { SiteSettings, TeamMember } from "@/lib/types";

export function About({ about }: { about: SiteSettings["about"] }) {
  const pillars = [
    { label: "Missão", text: about.mission },
    { label: "Visão", text: about.vision },
  ].filter((p) => p.text);

  return (
    <section id="sobre" aria-labelledby="sobre-title" className="section border-t border-line">
      <div className="container-site grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <SectionHeading id="sobre-title" eyebrow={about.eyebrow} title={about.title} />
          <p className="reveal mt-6 text-base leading-relaxed text-mist sm:text-lg">{about.text}</p>
          {about.how_we_work && (
            <div className="reveal mt-8 border-l-2 border-electric pl-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Como trabalhamos</p>
              <p className="mt-2 leading-relaxed text-paper/90">{about.how_we_work}</p>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {pillars.map((p) => (
            <div key={p.label} className="card reveal p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-soft">{p.label}</p>
              <p className="display mt-3 text-xl leading-snug text-paper md:text-2xl">{p.text}</p>
            </div>
          ))}
          {about.values.length > 0 && (
            <div className="card reveal p-6 md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric-soft">Valores</p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {about.values.map((v) => (
                  <li key={v} className="flex items-start gap-2.5 text-sm text-paper/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric-soft" aria-hidden="true" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Team({ members, s }: { members: TeamMember[]; s: SiteSettings["sections"] }) {
  if (members.length === 0) return null;
  return (
    <section id="equipe" aria-labelledby="equipe-title" className="section border-t border-line">
      <div className="container-site">
        <SectionHeading id="equipe-title" eyebrow={s.team_eyebrow} title={s.team_title} subtitle={s.team_subtitle} />
        <div className={`mt-14 grid gap-6 ${members.length > 1 ? "md:grid-cols-2" : "max-w-2xl"}`}>
          {members.map((m) => (
            <article key={m.id} className="card reveal overflow-hidden">
              <div className="grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
                <div className="relative aspect-[4/5] bg-ink-2 sm:aspect-auto sm:min-h-full">
                  {m.photo_url ? (
                    <Image
                      src={m.photo_url}
                      alt={`Foto de ${m.name}`}
                      fill
                      sizes="(min-width: 768px) 22vw, (min-width: 640px) 40vw, 100vw"
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-6xl text-slate">
                      {m.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col p-6 md:p-7">
                  <h3 className="display text-3xl text-paper">{m.name}</h3>
                  {m.role && <p className="mt-1.5 text-sm font-medium text-electric-soft">{m.role}</p>}
                  {m.bio && <p className="mt-4 text-sm leading-relaxed text-mist">{m.bio}</p>}
                  {m.skills.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate">Competências</p>
                      <ul className="mt-2.5 flex flex-wrap gap-2">
                        {m.skills.map((sk) => (
                          <li key={sk} className="rounded-full border border-line px-3 py-1 text-xs text-paper/85">
                            {sk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.responsibilities.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate">Responsável por</p>
                      <ul className="mt-2.5 space-y-1.5">
                        {m.responsibilities.map((r) => (
                          <li key={r} className="flex items-start gap-2 text-sm text-paper/85">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric-soft" aria-hidden="true" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
