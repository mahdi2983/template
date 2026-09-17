"use server";

import { Resend } from "resend";
import emailSettings from "@/content/email.json";
import {
  customerReplyTo,
  ownerRecipient,
  renderCustomerEmail,
  renderOwnerEmail,
  senderFrom,
  type BookingDetails,
} from "@/lib/email";
import { siteConfig } from "@/lib/site-config";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface BookingSubmissionResult {
  success: boolean;
  error?: string;
  note?: string;
}

const field = (formData: FormData, key: string, fallback = "") =>
  String(formData.get(key) ?? "")
    .trim()
    .slice(0, 500) || fallback;

export async function submitBooking(formData: FormData): Promise<BookingSubmissionResult> {
  const details: BookingDetails = {
    name: field(formData, "name", "Valued Customer"),
    email: field(formData, "email"),
    phone: field(formData, "phone", "Not provided"),
    vehicle: field(formData, "vehicle", "Vehicle unspecified"),
    service: field(formData, "service", "Detailing Package"),
    date: field(formData, "date", "Flexible / Earliest available"),
    zip: field(formData, "zip"),
    estimate: field(formData, "estimate"),
    notes: field(formData, "notes"),
    business: siteConfig.name,
  };

  if (!details.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return { success: false, error: "A valid email address is required." };
  }

  const from = senderFrom(emailSettings);
  const ownerEmail = ownerRecipient(emailSettings);

  let artisanSent = false;
  let clientSent = false;
  let lastError: string | undefined;

  // 1. Alert email to the artisan / owner
  try {
    const alertRes = await resend.emails.send({
      from,
      to: ownerEmail,
      replyTo: details.email,
      ...renderOwnerEmail(emailSettings, details),
    });

    if (alertRes.data) {
      artisanSent = true;
    } else if (alertRes.error) {
      lastError = alertRes.error.message;
    }
  } catch (err: unknown) {
    console.error("Artisan lead email error:", err);
    lastError = err instanceof Error ? err.message : "Artisan notification failed";
  }

  // 2. Confirmation email to the customer (can be turned off in /admin)
  if (emailSettings.sendCustomerConfirmation) {
    try {
      const clientRes = await resend.emails.send({
        from,
        to: details.email,
        replyTo: customerReplyTo(emailSettings),
        ...renderCustomerEmail(emailSettings, details),
      });

      if (clientRes.data) {
        clientSent = true;
      }
    } catch (err: unknown) {
      console.warn("Client email note:", err instanceof Error ? err.message : err);
      if (!lastError) {
        lastError = err instanceof Error ? err.message : "Client confirmation delivery issue";
      }
    }
  }

  // If either email was delivered, the booking was successfully recorded!
  if (artisanSent || clientSent) {
    return { success: true };
  }

  return {
    success: false,
    error: lastError || "Failed to send confirmation. Please try again or text us.",
  };
}
