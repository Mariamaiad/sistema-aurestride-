import { Fragment } from "react";
import { getSiteContent } from "@/lib/content";
import { SERVICE_SECTIONS, resolveSections, type SectionId } from "@/lib/sections";
import { contactLinks } from "@/lib/links";
import { Hero } from "@/components/site/hero";
import { About, Team } from "@/components/site/about-team";
import { ServicesSection, SystemsSection } from "@/components/site/services";
import { PlansSection, WebPricingSection } from "@/components/site/pricing";
import { FaqSection, PortfolioSection, ProcessSection } from "@/components/site/portfolio-process-faq";
import { ContactSection } from "@/components/site/contact";

export default async function HomePage() {
  const content = await getSiteContent();
  const { settings } = content;
  const s = settings.sections;
  const links = contactLinks(settings);
  const by = (cat: string) => content.services.filter((x) => x.category === cat);

  const interests = [
    ...content.plans.map((p) => p.name),
    ...content.webPricing.map((w) => w.name),
    "Outro / não sei ainda",
  ];

  const sections = resolveSections(settings.layout?.sections).filter((x) => x.visible);
  const firstService = sections.find((x) => SERVICE_SECTIONS.includes(x.id))?.id;

  const render = (id: SectionId) => {
    switch (id) {
      case "about":
        return <About about={settings.about} />;
      case "team":
        return <Team members={content.team} s={s} />;
      case "marketing":
        return (
          <ServicesSection
            id="marketing"
            eyebrow={s.marketing_eyebrow}
            title={s.marketing_title}
            subtitle={s.marketing_subtitle}
            services={by("marketing")}
            serviceHref={links.serviceHref}
          />
        );
      case "sites":
        return (
          <ServicesSection
            id="sites"
            eyebrow={s.web_eyebrow}
            title={s.web_title}
            subtitle={s.web_subtitle}
            services={by("web")}
            serviceHref={links.serviceHref}
          />
        );
      case "systems":
        return <SystemsSection s={s} services={by("sistemas")} quoteHref={links.quoteHref} />;
      case "plans":
        return <PlansSection plans={content.plans} s={s} planHref={links.planHref} />;
      case "web_pricing":
        return <WebPricingSection items={content.webPricing} s={s} serviceHref={links.serviceHref} />;
      case "portfolio":
        return <PortfolioSection projects={content.projects} s={s} />;
      case "process":
        return <ProcessSection steps={content.steps} s={s} />;
      case "faq":
        return <FaqSection faqs={content.faqs} s={s} />;
      case "contact":
        return <ContactSection settings={settings} interests={interests} />;
    }
  };

  return (
    <>
      <Hero hero={settings.hero} quoteHref={links.quoteHref} />
      {sections.map(({ id }, i) => (
        <Fragment key={id}>
          {/* Âncora do menu "Serviços": antes do primeiro bloco de serviços visível. */}
          {(id === firstService || (!firstService && i === 0)) && <div id="servicos" aria-hidden="true" />}
          {render(id)}
        </Fragment>
      ))}
    </>
  );
}
