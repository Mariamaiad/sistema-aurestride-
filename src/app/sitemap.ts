import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content";
import { siteUrl } from "@/lib/links";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { settings, projects } = await getSiteContent();
  const base = siteUrl(settings);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...(settings.privacy.enabled ? [{ url: `${base}/privacidade`, priority: 0.2 }] : []),
    ...projects.map((p) => ({ url: `${base}/portfolio/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
