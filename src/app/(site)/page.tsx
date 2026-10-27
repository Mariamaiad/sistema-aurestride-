import { getSiteContent } from "@/lib/content";
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

  return (
    <>
      <Hero hero={settings.hero} quoteHref={links.quoteHref} />
      <About about={settings.about} />
      <Team members={content.team} s={s} />
      <div id="servicos">
        <ServicesSection
          id="marketing"
          eyebrow={s.marketing_eyebrow}
          title={s.marketing_title}
          subtitle={s.marketing_subtitle}
          services={by("marketing")}
          serviceHref={links.serviceHref}
        />
        <ServicesSection
          id="sites"
          eyebrow={s.web_eyebrow}
          title={s.web_title}
          subtitle={s.web_subtitle}
          services={by("web")}
          serviceHref={links.serviceHref}
        />
        <SystemsSection s={s} services={by("sistemas")} quoteHref={links.quoteHref} />
      </div>
      <PlansSection plans={content.plans} s={s} planHref={links.planHref} />
      <WebPricingSection items={content.webPricing} s={s} serviceHref={links.serviceHref} />
      <PortfolioSection projects={content.projects} s={s} />
      <ProcessSection steps={content.steps} s={s} />
      <FaqSection faqs={content.faqs} s={s} />
      <ContactSection settings={settings} interests={interests} />
    </>
  );
}
