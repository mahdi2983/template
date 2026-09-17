import defaultEmail from "@/content/email.json";
import { BLOCK_CHOICES } from "@/lib/blocks";
import type { EmailSettings } from "@/lib/email";
import type { PageContent, SiteContent } from "@/types/content";

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED_SLUGS = new Set(["admin", "api", "uploads", "gallery", "reviews", "favicon.ico", "icon", "_next"]);
export const UPLOAD_PATTERN = /^\/uploads\/[a-z0-9-]+\.(?:webp|jpe?g|png|avif)$/;
export const IMAGE_KEY_PATTERN = /(src|imageUrl|poster|shareImage|logo)$/i;

const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
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
        fail(`Link not allowed (${path}): use a link starting with /, #, https://, tel: or mailto:`);
      }
      if (IMAGE_KEY_PATTERN.test(key) && !/^(\/(?!\/)|https:\/\/)/.test(child)) {
        fail(`Invalid image (${path}).`);
      }
    } else {
      checkStrings(child, path);
    }
  }
}

export function validateSite(site: unknown): SiteContent {
  if (!site || typeof site !== "object") fail("Site content is missing.");
  const candidate = site as SiteContent;
  if (!candidate.business?.name) fail("The business name is required.");
  if (!Array.isArray(candidate.services)) fail("The package list is invalid.");

  const ids = new Set<string>();
  for (const service of candidate.services) {
    if (!service.id || !SLUG_PATTERN.test(service.id)) fail(`Invalid package id: "${service.id}".`);
    if (ids.has(service.id)) fail(`Two packages share the same id: "${service.id}".`);
    ids.add(service.id);
  }
  checkStrings(candidate, "site");
  return candidate;
}

export function validatePages(pages: unknown): Record<string, PageContent> {
  if (!pages || typeof pages !== "object") fail("Pages are missing.");
  const record = pages as Record<string, PageContent>;
  if (!record.home) fail("The home page is required.");

  for (const [slug, page] of Object.entries(record)) {
    if (!isValidSlug(slug, { allowHome: true })) fail(`Invalid page address: "${slug}".`);
    if (page.slug !== slug) fail(`Page "${slug}" is inconsistent.`);
    if (!page.title?.trim()) fail(`Page "${slug}" needs a title.`);
    if (!Array.isArray(page.blocks)) fail(`Page "${slug}" has invalid sections.`);
    for (const block of page.blocks) {
      if (!block.id || !BLOCK_TYPES.has(block.type)) fail(`Unknown section on page "${slug}".`);
    }
    checkStrings(page, `pages.${slug}`);
  }
  return record;
}

export function validateEmailSettings(settings: unknown): EmailSettings {
  if (!settings || typeof settings !== "object") fail("Email settings are missing.");
  const email = settings as EmailSettings;

  for (const [key, value] of Object.entries(email)) {
    if (!(key in defaultEmail)) fail(`Unknown email setting: ${key}.`);
    if (key === "sendCustomerConfirmation") {
      if (typeof value !== "boolean") fail("Invalid email setting.");
    } else if (typeof value !== "string" || value.length > 2000) {
      fail(`Invalid email setting: ${key}.`);
    }
  }
  for (const key of ["notifyEmail", "replyTo"] as const) {
    const value = email[key].trim();
    if (value && !EMAIL_PATTERN.test(value)) fail(`"${value}" is not a valid email address.`);
  }
  // These end up in mail headers: no line breaks or angle brackets.
  for (const key of ["senderName", "ownerSubject", "customerSubject"] as const) {
    if (/[\r\n<>]/.test(email[key])) fail(`The "${key}" field contains forbidden characters.`);
  }
  if (!email.customerSubject.trim()) fail("The confirmation email needs a subject.");
  return email;
}

export function assertSize(json: string): void {
  if (new TextEncoder().encode(json).length > MAX_JSON_BYTES) fail("The content is too large.");
}
