import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { brandCssVars, contactLinks, linkProps, siteUrl } from "@/lib/links";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { RevealObserver } from "@/components/site/reveal-observer";
import { WhatsappIcon } from "@/components/ui/icons";
import { SERVICE_SECTIONS, resolveSections } from "@/lib/sections";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContent();
  const url = siteUrl(settings);
  const images = [{ url: settings.seo.og_image || "/og-default.jpg", width: 1200, height: 630, alt: settings.brand.name }];
  return {
    metadataBase: new URL(url),
    title: { default: settings.seo.title, template: `%s | ${settings.brand.name}` },
    description: settings.seo.description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: settings.brand.name,
      title: settings.seo.title,
      description: settings.seo.description,
      url,
      images,
    },
    twitter: { card: "summary_large_image", title: settings.seo.title, description: settings.seo.description, images: images.map((i) => i.url) },
    robots: { index: true, follow: true },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  const { settings } = content;
  const links = contactLinks(settings);
  const visible = new Set(resolveSections(settings.layout?.sections).filter((x) => x.visible).map((x) => x.id));
  const navHidden = [
    !visible.has("about") && "/#sobre",
    !SERVICE_SECTIONS.some((id) => visible.has(id)) && "/#servicos",
    !visible.has("portfolio") && "/#portfolio",
    !visible.has("contact") && "/#contato",
  ].filter(Boolean) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: settings.brand.name,
    description: settings.brand.description,
    url: siteUrl(settings),
    ...(settings.contact.email ? { email: settings.contact.email } : {}),
    sameAs: [links.instagram, links.linkedin, links.tiktok].filter(Boolean),
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: brandCssVars(settings) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {content.demo && (
        <div
          role="status"
          className="fixed bottom-3 left-1/2 z-[60] w-[min(92vw,34rem)] -translate-x-1/2 rounded-lg bg-amber-400 px-4 py-2 text-center text-xs font-medium text-ink shadow-lg"
        >
          Modo demonstração: Supabase não conectado. Conteúdo dos dados iniciais, somente leitura.
        </div>
      )}
      <SiteHeader
        brandName={settings.brand.name}
        logoUrl={settings.brand.logo_url || undefined}
        quoteHref={links.quoteHref}
        hiddenLinks={navHidden}
      />
      <main id="conteudo">{children}</main>
      <SiteFooter settings={settings} />
      {links.hasWhatsapp && (
        <a
          {...linkProps(links.quoteHref)}
          aria-label="Conversar pelo WhatsApp"
          className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.7)] transition-transform hover:scale-105 md:bottom-8 md:right-8"
        >
          <WhatsappIcon className="h-7 w-7" />
        </a>
      )}
      <RevealObserver />
    </>
  );
}
