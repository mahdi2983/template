"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ConflictError,
  loadContent as loadStoredContent,
  publishContent,
  storageMode,
  storeImage,
  type ContentSnapshot,
} from "@/lib/admin/repo";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  createSessionToken,
  safeEqual,
  verifySessionToken,
} from "@/lib/admin/session";
import { UPLOAD_PATTERN, ValidationError, assertSize, validatePages, validateSite } from "@/lib/admin/validate";
import type { PageContent, SiteContent } from "@/types/content";

const MAX_IMAGE_BYTES = 3_500_000;

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; conflict?: boolean };

async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(SESSION_COOKIE)?.value))) {
    throw new Error("Session expirée : reconnectez-vous.");
  }
}

function toError(error: unknown): { ok: false; error: string; conflict?: boolean } {
  if (error instanceof ConflictError) return { ok: false, error: error.message, conflict: true };
  if (error instanceof ValidationError || error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Erreur inattendue." };
}

export async function login(_previous: string | null, formData: FormData): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "ADMIN_PASSWORD n'est pas configuré sur le serveur.";

  const password = String(formData.get("password") ?? "");
  if (!safeEqual(password, expected)) {
    // Small fixed delay slows down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return "Mot de passe incorrect.";
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function loadContent(): Promise<ActionResult<ContentSnapshot & { mode: string }>> {
  try {
    await requireAdmin();
    return { ok: true, data: { ...(await loadStoredContent()), mode: storageMode() } };
  } catch (error) {
    return toError(error);
  }
}

export async function uploadImage(src: string, base64: string): Promise<ActionResult<string>> {
  try {
    await requireAdmin();
    if (!UPLOAD_PATTERN.test(src)) throw new ValidationError("Nom de fichier invalide.");
    if (base64.length * 0.75 > MAX_IMAGE_BYTES) throw new ValidationError("Image trop lourde (3,5 Mo max).");
    return { ok: true, data: await storeImage(src, base64) };
  } catch (error) {
    return toError(error);
  }
}

interface PublishRequest {
  site: SiteContent;
  pages: Record<string, PageContent>;
  version: string;
  images: Record<string, string>;
}

export async function publish(request: PublishRequest): Promise<ActionResult<{ version: string; commitUrl?: string }>> {
  try {
    await requireAdmin();
    const site = validateSite(request.site);
    const pages = validatePages(request.pages);
    assertSize(JSON.stringify({ site, pages }));
    for (const [src, ref] of Object.entries(request.images ?? {})) {
      if (!UPLOAD_PATTERN.test(src) || !/^([0-9a-f]{40}|local)$/.test(ref)) {
        throw new ValidationError("Référence d'image invalide.");
      }
    }
    const result = await publishContent({ site, pages, version: request.version, images: request.images ?? {} });
    return { ok: true, data: result };
  } catch (error) {
    return toError(error);
  }
}
