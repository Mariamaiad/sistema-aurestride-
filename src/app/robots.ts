import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content";
import { siteUrl } from "@/lib/links";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getSiteContent();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/auth"] },
    sitemap: `${siteUrl(settings)}/sitemap.xml`,
  };
}
