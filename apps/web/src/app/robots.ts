import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/search", "/api/"] }],
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
