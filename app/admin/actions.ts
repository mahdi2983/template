"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
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
import {
  UPLOAD_PATTERN,
  ValidationError,
  assertSize,
  validateEmailSettings,
  validatePages,
  validateSite,
} from "@/lib/admin/validate";
import {
  SAMPLE_BOOKING,
  customerReplyTo,
  ownerRecipient,
  renderCustomerEmail,
  senderAddress,
  senderFrom,
  type EmailSettings,
} from "@/lib/email";
import type { PageContent, SiteContent } from "@/types/content";

const MAX_IMAGE_BYTES = 3_500_000;

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; conflict?: boolean };

export interface EmailEnvironment {
  /** Verified sender address from RESEND_FROM_EMAIL (not editable in the admin). */
  senderAddress: string;
  apiKeyConfigured: boolean;
  /** Where owner notifications go when the admin field is left empty. */
  fallbackRecipient: string;
}

async function requireAdmin(): Promise<void> {
  const store = await cookies();
  if (!(await verifySessionToken(store.get(SESSION_COOKIE)?.value))) {
    throw new Error("Session expired: please sign in again.");
  }
}

function toError(error: unknown): { ok: false; error: string; conflict?: boolean } {
  if (error instanceof ConflictError) return { ok: false, error: error.message, conflict: true };
  if (error instanceof ValidationError || error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Unexpected error." };
}

export async function login(_previous: string | null, formData: FormData): Promise<string | null> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return "ADMIN_PASSWORD is not configured on the server.";

  const password = String(formData.get("password") ?? "");
  if (!safeEqual(password, expected)) {
    // Small fixed delay slows down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return "Incorrect password.";
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

export async function loadContent(): Promise<
  ActionResult<ContentSnapshot & { mode: string; emailEnv: EmailEnvironment }>
> {
  try {
    await requireAdmin();
    const snapshot = await loadStoredContent();
    const emailEnv: EmailEnvironment = {
      senderAddress: senderAddress(),
      apiKeyConfigured: Boolean(process.env.RESEND_API_KEY),
      fallbackRecipient: ownerRecipient({ ...snapshot.email, notifyEmail: "" }),
    };
    return { ok: true, data: { ...snapshot, mode: storageMode(), emailEnv } };
  } catch (error) {
    return toError(error);
  }
}

export async function uploadImage(src: string, base64: string): Promise<ActionResult<string>> {
  try {
    await requireAdmin();
    if (!UPLOAD_PATTERN.test(src)) throw new ValidationError("Invalid file name.");
    if (base64.length * 0.75 > MAX_IMAGE_BYTES) throw new ValidationError("Image too large (3.5 MB max).");
    return { ok: true, data: await storeImage(src, base64) };
  } catch (error) {
    return toError(error);
  }
}

interface PublishRequest {
  site: SiteContent;
  pages: Record<string, PageContent>;
  email: EmailSettings;
  version: string;
  images: Record<string, string>;
}

export async function publish(request: PublishRequest): Promise<ActionResult<{ version: string; commitUrl?: string }>> {
  try {
    await requireAdmin();
    const site = validateSite(request.site);
    const pages = validatePages(request.pages);
    const email = validateEmailSettings(request.email);
    assertSize(JSON.stringify({ site, pages, email }));
    for (const [src, ref] of Object.entries(request.images ?? {})) {
      if (!UPLOAD_PATTERN.test(src) || !/^([0-9a-f]{40}|local)$/.test(ref)) {
        throw new ValidationError("Invalid image reference.");
      }
    }
    const result = await publishContent({ site, pages, email, version: request.version, images: request.images ?? {} });
    return { ok: true, data: result };
  } catch (error) {
    return toError(error);
  }
}

/**
 * Sends the customer confirmation, rendered from the *unpublished* settings with sample
 * booking data, to the owner's inbox — so the template can be checked before publishing.
 */
export async function sendTestEmail(settings: EmailSettings, businessName: string): Promise<ActionResult<string>> {
  try {
    await requireAdmin();
    const email = validateEmailSettings(settings);
    if (!process.env.RESEND_API_KEY) throw new Error("The email service is not configured. Contact Mahdi Studios.");

    const to = ownerRecipient(email);
    const rendered = renderCustomerEmail(email, { ...SAMPLE_BOOKING, business: businessName.slice(0, 120) });
    const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: senderFrom(email),
      to,
      replyTo: customerReplyTo(email),
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
    });
    if (result.error) {
      console.error("[admin] test email failed", result.error);
      throw new Error("The test email could not be sent. Contact Mahdi Studios if this persists.");
    }
    return { ok: true, data: to };
  } catch (error) {
    return toError(error);
  }
}
