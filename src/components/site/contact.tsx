import { Mail } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { ContactForm } from "./contact-form";
import { InstagramIcon, WhatsappIcon } from "@/components/ui/icons";
import { contactLinks, linkProps } from "@/lib/links";
import type { SiteSettings } from "@/lib/types";

export function ContactSection({ settings, interests }: { settings: SiteSettings; interests: string[] }) {
  const s = settings.sections;
  const links = contactLinks(settings);
  const channels = [
    links.hasWhatsapp && { href: links.quoteHref, label: "WhatsApp", detail: "Resposta mais rápida", Icon: WhatsappIcon },
    links.email && { href: links.email, label: "E-mail", detail: settings.contact.email, Icon: Mail },
    links.instagram && {
      href: links.instagram,
      label: "Instagram",
      detail: settings.contact.instagram.startsWith("http") ? "Nosso perfil" : `@${settings.contact.instagram.replace(/^@/, "")}`,
      Icon: InstagramIcon,
    },
  ].filter(Boolean) as { href: string; label: string; detail: string; Icon: typeof Mail }[];

  return (
    <section id="contato" aria-labelledby="contato-title" className="section relative overflow-hidden border-t border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-electric/15 blur-[120px]"
      />
      <div className="container-site relative grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading id="contato-title" eyebrow={s.contact_eyebrow} title={s.contact_title} subtitle={s.contact_text} />
          <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row">
            <a {...linkProps(links.quoteHref)} className="btn btn-primary">
              {links.hasWhatsapp && <WhatsappIcon className="h-5 w-5" />}
              Solicitar orçamento
            </a>
          </div>
          {channels.length > 0 && (
            <ul className="mt-10 grid gap-3">
              {channels.map(({ href, label, detail, Icon }) => (
                <li key={label} className="reveal">
                  <a
                    {...linkProps(href)}
                    className="flex items-center gap-4 rounded-xl border border-line p-4 transition-colors hover:border-line-strong"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-electric/10 text-electric-soft">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-paper">{label}</span>
                      <span className="block truncate text-sm text-mist">{detail}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {settings.contact.form_enabled && (
          <div className="reveal">
            <ContactForm interests={interests} privacyEnabled={settings.privacy.enabled} />
          </div>
        )}
      </div>
    </section>
  );
}
