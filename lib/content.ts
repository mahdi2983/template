import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import siteJson from "@/content/site.json";
import type { PageContent, SiteContent } from "@/types/content";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export const HOME_SLUG = "home";

export function getSite(): SiteContent {
  return siteJson;
}

export async function listPageSlugs(): Promise<string[]> {
  const files = await readdir(PAGES_DIR);
  return files.filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -".json".length));
}

export async function getPage(slug: string): Promise<PageContent | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const raw = await readFile(path.join(PAGES_DIR, `${slug}.json`), "utf8");
    return JSON.parse(raw) as PageContent;
  } catch {
    return null;
  }
}

export async function getAllPages(): Promise<PageContent[]> {
  const slugs = await listPageSlugs();
  const pages = await Promise.all(slugs.map(getPage));
  return pages.filter((page): page is PageContent => page !== null);
}
