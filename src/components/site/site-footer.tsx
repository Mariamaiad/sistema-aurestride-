import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { InstagramIcon, LinkedinIcon, TiktokIcon, WhatsappIcon } from "@/components/ui/icons";
import { contactLinks, linkProps } from "@/lib/links";
import type { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const links = contactLinks(settings);
  const year = new Date().getFullYear();
  const socials = [
    links.instagram && { href: links.instagram, label: "Instagram", Icon: InstagramIcon },
    links.tiktok && { href: links.tiktok, label: "TikTok", Icon: TiktokIcon },
    links.linkedin && { href: links.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof InstagramIcon }[];

  return (
    <footer className="border-t border-line bg-ink">
      <div className="container-site grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
        <div className="max-w-sm">
          <Logo name={settings.brand.name} logoUrl={settings.brand.logo_url || undefined} />
          <p className="mt-5 text-sm leading-relaxed text-mist">{settings.footer.text}</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-3">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-mist transition-colors hover:border-electric hover:text-paper"
                  >
                    <Icon className="h-[1.1rem] w-[1.1rem]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Rodapé">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Navegação</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-mist">
            {[
              ["/#sobre", "Sobre Nós"],
              ["/#servicos", "Serviços"],
              ["/#planos", "Planos"],
              ["/#portfolio", "Portfólio"],
              ["/#faq", "Perguntas frequentes"],
              ["/#contato", "Contato"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-paper">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate">Contato</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-mist">
            {links.hasWhatsapp && (
              <li>
                <a {...linkProps(links.quoteHref)} className="inline-flex items-center gap-2 hover:text-paper">
                  <WhatsappIcon className="h-4 w-4" /> WhatsApp
                </a>
              </li>
            )}
            {links.email && (
              <li>
                <a href={links.email} className="inline-flex items-center gap-2 break-all hover:text-paper">
                  <Mail className="h-4 w-4 shrink-0" /> {settings.contact.email}
                </a>
              </li>
            )}
            {!links.hasWhatsapp && !links.email && (
              <li>
                <Link href="/#contato" className="hover:text-paper">
                  Fale conosco
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.footer.copyright}
          </p>
          {settings.privacy.enabled && (
            <Link href="/privacidade" className="hover:text-paper">
              Política de privacidade
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
