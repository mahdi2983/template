import siteJson from "@/content/site.json";
import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  ...siteJson.business,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
