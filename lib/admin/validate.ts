import { BLOCK_CHOICES } from "@/lib/blocks";
import type { PageContent, SiteContent } from "@/types/content";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SLUGS = new Set(["admin", "api", "uploads", "gallery", "reviews", "favicon.ico", "icon", "_next"]);
export const UPLOAD_PATTERN = /^\/uploads\/[a-z0-9-]+\.(?:webp|jpe?g|png|avif)$/;

const BLOCK_TYPES = new Set(BLOCK_CHOICES.map((choice) => choice.type));
const MAX_JSON_BYTES = 1_000_000;

export class ValidationError extends Error {}

function fail(message: string): never {
  throw new ValidationError(message);
}

export function isValidSlug(slug: string, { allowHome = false } = {}): boolean {
  if (!SLUG_PATTERN.test(slug) || slug.length > 60 || RESERVED_SLUGS.has(slug)) return false;
  return allowHome || slug !== "home";
}

/** Links and image sources are the only strings that reach attributes, so they get an allowlist. */
function checkStrings(value: unknown, where: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkStrings(item, `${where}.${index}`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const path = `${where}.${key}`;
    if (typeof child === "string" && child) {
      if (/href$/i.test(key) && !/^(\/|#|https:\/\/|tel:|mailto:)/.test(child)) {
        fail(`Lien non autorisé (${path}) : utilisez un lien qui commence par /, #, https://, tel: ou mailto:`);
      }
      if (/(src|imageUrl|poster|shareImage)$/i.test(key) && !/^(\/(?!\/)|https:\/\/)/.test(child)) {
        fail(`Image non valide (${path}).`);
      }
    } else {
      checkStrings(child, path);
    }
  }
}

export function validateSite(site: unknown): SiteContent {
  if (!site || typeof site !== "object") fail("Contenu du site manquant.");
  const candidate = site as SiteContent;
  if (!candidate.business?.name) fail("Le nom de l'entreprise est obligatoire.");
  if (!Array.isArray(candidate.services)) fail("La liste des forfaits est invalide.");

  const ids = new Set<string>();
  for (const service of candidate.services) {
    if (!service.id || !SLUG_PATTERN.test(service.id)) fail(`Identifiant de forfait invalide : "${service.id}".`);
    if (ids.has(service.id)) fail(`Deux forfaits ont le même identifiant : "${service.id}".`);
    ids.add(service.id);
  }
  checkStrings(candidate, "site");
  return candidate;
}

export function validatePages(pages: unknown): Record<string, PageContent> {
  if (!pages || typeof pages !== "object") fail("Pages manquantes.");
  const record = pages as Record<string, PageContent>;
  if (!record.home) fail("La page d'accueil est obligatoire.");

  for (const [slug, page] of Object.entries(record)) {
    if (!isValidSlug(slug, { allowHome: true })) fail(`Adresse de page invalide : "${slug}".`);
    if (page.slug !== slug) fail(`La page "${slug}" est incohérente.`);
    if (!page.title?.trim()) fail(`La page "${slug}" doit avoir un titre.`);
    if (!Array.isArray(page.blocks)) fail(`La page "${slug}" n'a pas de sections valides.`);
    for (const block of page.blocks) {
      if (!block.id || !BLOCK_TYPES.has(block.type)) fail(`Section inconnue sur la page "${slug}".`);
    }
    checkStrings(page, `pages.${slug}`);
  }
  return record;
}

export function assertSize(json: string): void {
  if (new TextEncoder().encode(json).length > MAX_JSON_BYTES) fail("Le contenu est trop volumineux.");
}
