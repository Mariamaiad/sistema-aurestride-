import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { getProjectBySlug, getSiteContent } from "@/lib/content";
import { contactLinks, linkProps } from "@/lib/links";
import { safeExternalUrl } from "@/lib/format";
import { PROJECT_CATEGORY_LABEL } from "@/components/site/portfolio-process-faq";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return { title: "Projeto não encontrado" };
  return {
    title: p.title,
    description: p.summary || undefined,
    alternates: { canonical: `/portfolio/${p.slug}` },
    robots: p.status === "published" ? undefined : { index: false, follow: false },
    openGraph: p.cover_url ? { images: [{ url: p.cover_url }] } : undefined,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [project, { settings }] = await Promise.all([getProjectBySlug(slug), getSiteContent()]);
  if (!project) notFound();
  const external = safeExternalUrl(project.external_url);
  const links = contactLinks(settings);

  const blocks = [
    { title: "O desafio", text: project.challenge },
    { title: "A solução", text: project.solution },
    { title: "Resultados", text: project.results },
  ].filter((b) => b.text);

  return (
    <article className="pt-24 md:pt-32">
      {project.status === "draft" && (
        <div role="status" className="container-site">
          <p className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            Rascunho — visível apenas para administradores. Publique pelo painel quando houver autorização do cliente.
          </p>
        </div>
      )}
      <header className="container-site py-10">
        <Link href="/#portfolio" className="inline-flex items-center gap-2 text-sm text-mist hover:text-paper">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar ao portfólio
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-electric-soft">
          {PROJECT_CATEGORY_LABEL[project.category]}
          {project.client ? ` · ${project.client}` : ""}
        </p>
        <h1 className="display mt-3 max-w-4xl text-4xl text-paper sm:text-6xl">{project.title}</h1>
        {project.summary && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mist">{project.summary}</p>}
        {external && (
          <a href={external} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-8">
            Ver projeto <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </header>

      {project.cover_url && (
        <div className="container-site">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line">
            <Image src={project.cover_url} alt={`Capa do projeto ${project.title}`} fill priority sizes="(min-width: 1216px) 1152px, 100vw" className="object-cover" />
          </div>
        </div>
      )}

      <div className="container-site grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          {blocks.map((b) => (
            <section key={b.title}>
              <h2 className="display text-3xl text-paper">{b.title}</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-mist">{b.text}</p>
            </section>
          ))}
        </div>
        {project.deliverables.length > 0 && (
          <aside className="card h-fit p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Entregas</h2>
            <ul className="mt-4 space-y-2.5">
              {project.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-paper/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric-soft" aria-hidden="true" /> {d}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {project.images.length > 0 && (
        <section aria-label="Galeria" className="container-site grid gap-5 pb-16 sm:grid-cols-2">
          {project.images.map((img) => (
            <div key={img.id} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-line">
              <Image src={img.url} alt={img.alt || project.title} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
            </div>
          ))}
        </section>
      )}

      <section className="border-t border-line">
        <div className="container-site flex flex-col items-start justify-between gap-6 py-14 md:flex-row md:items-center">
          <h2 className="display text-3xl text-paper">Quer um projeto como este?</h2>
          <a {...linkProps(links.quoteHref)} className="btn btn-primary">
            Solicitar orçamento
          </a>
        </div>
      </section>
    </article>
  );
}
