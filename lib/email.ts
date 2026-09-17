import type emailJson from "@/content/email.json";

/**
 * Booking email rendering. Settings come from `content/email.json` (editable in /admin);
 * the Resend API key and the verified sender address stay in environment variables.
 * Server-only: this module must never be imported by client components.
 */

export type EmailSettings = typeof emailJson;

export interface BookingDetails {
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  service: string;
  date: string;
  zip: string;
  estimate: string;
  notes: string;
  business: string;
}

export const PLACEHOLDERS = ["name", "service", "estimate", "vehicle", "date", "phone", "business"] as const;

const FALLBACK_FROM = "Apex Detailing <booking@mahdistudios.com>";
const FALLBACK_OWNER = "mahdi.hellali@esprit.tn";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Replaces `{name}`-style placeholders; HTML-escapes values when rendering into HTML. */
function fill(template: string, details: BookingDetails, html: boolean): string {
  const text = template.replace(/\{(\w+)\}/g, (match, key: string) =>
    (PLACEHOLDERS as readonly string[]).includes(key) ? String(details[key as keyof BookingDetails] ?? "") : match,
  );
  return html ? escapeHtml(text) : text;
}

/** Address the Resend domain is verified for, e.g. "booking@clientdomain.com". */
export function senderAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL || FALLBACK_FROM;
  return configured.match(/<([^>]+)>/)?.[1] ?? configured.trim();
}

export function senderFrom(settings: EmailSettings): string {
  const name = settings.senderName.replace(/[<>"\r\n]/g, "").trim();
  return name ? `${name} <${senderAddress()}>` : process.env.RESEND_FROM_EMAIL || FALLBACK_FROM;
}

export function ownerRecipient(settings: EmailSettings): string {
  return settings.notifyEmail.trim() || process.env.ARTISAN_EMAIL || FALLBACK_OWNER;
}

export function customerReplyTo(settings: EmailSettings): string {
  return settings.replyTo.trim() || ownerRecipient(settings);
}

const row = (label: string, value: string, extra = "") =>
  `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">${label}</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;${extra}">${value}</td></tr>`;

export function renderOwnerEmail(settings: EmailSettings, details: BookingDetails) {
  const d = Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, escapeHtml(value)]),
  ) as unknown as BookingDetails;
  const phoneHref = encodeURIComponent(details.phone);

  return {
    subject: fill(settings.ownerSubject, details, false),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #18181b; padding: 20px;">
        <h2 style="color: #059669; margin-top: 0;">🚨 New Booking Request Received!</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${row("Customer", d.name, " font-weight: bold;")}
          ${row("Email", `<a href="mailto:${d.email}">${d.email}</a>`)}
          ${row("Phone", `<a href="tel:${phoneHref}">${d.phone}</a>`)}
          ${row("Vehicle", d.vehicle, " font-weight: bold;")}
          ${row("Service Package", d.service, " font-weight: bold; color: #0284c7;")}
          ${d.estimate ? row("Estimate", d.estimate, " font-weight: bold;") : ""}
          ${row("Date", d.date)}
          ${d.zip ? row("ZIP Code", d.zip) : ""}
          ${d.notes ? row("Notes", d.notes) : ""}
        </table>
        <p style="margin-top: 20px;"><a href="tel:${phoneHref}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Call Customer: ${d.phone}</a></p>
      </div>
    `,
  };
}

export function renderCustomerEmail(settings: EmailSettings, details: BookingDetails) {
  const d = Object.fromEntries(
    Object.entries(details).map(([key, value]) => [key, escapeHtml(value)]),
  ) as unknown as BookingDetails;
  const line = (label: string, value: string) =>
    value ? `<p style="margin: 6px 0; font-size: 14px;"><strong>${label}:</strong> ${value}</p>` : "";

  return {
    subject: fill(settings.customerSubject, details, false),
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #09090b; font-size: 24px; margin: 0; letter-spacing: -0.02em;">${d.business}</h1>
        </div>

        <h2 style="color: #09090b; font-size: 18px; margin-top: 0;">${fill(settings.customerHeading, details, true)}</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #3f3f46;">${fill(settings.customerIntro, details, true)}</p>

        <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px; margin: 20px 0;">
          ${line("Package", d.service)}
          ${line("Estimate", d.estimate)}
          ${line("Vehicle", d.vehicle)}
          ${line("Requested Date", d.date)}
          ${line("Phone", d.phone)}
          ${line("ZIP / Location", d.zip)}
          ${line("Notes", d.notes)}
        </div>

        <p style="font-size: 14px; line-height: 1.5; color: #52525b;">${fill(settings.customerOutro, details, true)}</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
        <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin: 0;">${fill(settings.customerFooter, details, true)}</p>
      </div>
    `,
  };
}

export const SAMPLE_BOOKING: Omit<BookingDetails, "business"> = {
  name: "Jordan Sample",
  email: "customer@example.com",
  phone: "(704) 555-0199",
  vehicle: "2022 Ford F-150 (SUV / Truck)",
  service: "Signature Wash & Wax",
  date: "Tomorrow",
  zip: "28202",
  estimate: "$167 – $200 (approx. 1.5 hrs)",
  notes: "Test email sent from the admin panel",
};
