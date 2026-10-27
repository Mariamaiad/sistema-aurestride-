import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSiteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Política de privacidade",
  alternates: { canonical: "/privacidade" },
};

export default async function PrivacyPage() {
  const { settings } = await getSiteContent();
  if (!settings.privacy.enabled) notFound();
  return (
    <article className="container-site max-w-3xl pb-24 pt-28 md:pt-36">
      <p className="eyebrow">{settings.brand.name}</p>
      <h1 className="display mt-3 text-4xl text-paper sm:text-5xl">Política de privacidade</h1>
      <div className="mt-10 space-y-5 leading-relaxed text-mist">
        {settings.privacy.content
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
      </div>
    </article>
  );
}
