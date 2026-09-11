"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface BookingSubmissionResult {
  success: boolean;
  error?: string;
  note?: string;
}

export async function submitBooking(formData: FormData): Promise<BookingSubmissionResult> {
  const customerName = (formData.get("name") as string)?.trim() || "Valued Customer";
  const customerEmail = (formData.get("email") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || "Not provided";
  const vehicle = (formData.get("vehicle") as string)?.trim() || "Vehicle unspecified";
  const service = (formData.get("service") as string)?.trim() || "Detailing Package";
  const date = (formData.get("date") as string)?.trim() || "Flexible / Earliest available";
  const zip = (formData.get("zip") as string)?.trim() || "";
  const estimate = (formData.get("estimate") as string)?.trim() || "";
  const notes = (formData.get("notes") as string)?.trim() || "";

  if (!customerEmail) {
    return { success: false, error: "Email address is required." };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "Apex Detailing <booking@mahdistudios.com>";
  const artisanEmail = process.env.ARTISAN_EMAIL || "mahdi.hellali@esprit.tn";

  let artisanSent = false;
  let clientSent = false;
  let lastError: string | undefined;

  // 1. Alert email to the artisan / owner
  try {
    const alertRes = await resend.emails.send({
      from: fromEmail,
      to: artisanEmail,
      subject: `🚨 New Booking: ${customerName} (${service})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #18181b; padding: 20px;">
          <h2 style="color: #059669; margin-top: 0;">🚨 New Booking Request Received!</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Customer</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Email</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Phone</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;"><a href="tel:${phone}">${phone}</a></td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Vehicle</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">${vehicle}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Service Package</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold; color: #0284c7;">${service}</td></tr>
            ${estimate ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Estimate</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; font-weight: bold;">${estimate}</td></tr>` : ""}
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Date</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${date}</td></tr>
            ${zip ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">ZIP Code</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${zip}</td></tr>` : ""}
            ${notes ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7; color: #71717a;">Notes</td><td style="padding: 8px 0; border-bottom: 1px solid #e4e4e7;">${notes}</td></tr>` : ""}
          </table>
          <p style="margin-top: 20px;"><a href="tel:${phone}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Call Customer: ${phone}</a></p>
        </div>
      `,
    });

    if (alertRes.data) {
      artisanSent = true;
    }
  } catch (err: unknown) {
    console.error("Artisan lead email error:", err);
    lastError = err instanceof Error ? err.message : "Artisan notification failed";
  }

  // 2. Confirmation email to the customer
  try {
    const clientRes = await resend.emails.send({
      from: fromEmail,
      to: customerEmail,
      subject: `Your Detailing Appointment Request Received! — Apex Mobile Detailing`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #09090b; font-size: 24px; margin: 0; letter-spacing: -0.02em;">Apex Mobile Detailing</h1>
            <p style="color: #71717a; font-size: 14px; margin: 4px 0 0 0;">Showroom shine delivered directly to your driveway</p>
          </div>

          <h2 style="color: #09090b; font-size: 18px; margin-top: 0;">Thanks, ${customerName}!</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #3f3f46;">We have received your booking request for <strong>${service}</strong>. Our mobile studio brings 100% onboard deionized water and power — nothing to hook up at your location.</p>

          <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 6px 0; font-size: 14px;"><strong>Package:</strong> ${service}</p>
            ${estimate ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Estimate:</strong> ${estimate}</p>` : ""}
            <p style="margin: 6px 0; font-size: 14px;"><strong>Vehicle:</strong> ${vehicle}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Requested Date:</strong> ${date}</p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>Phone:</strong> ${phone}</p>
            ${zip ? `<p style="margin: 6px 0; font-size: 14px;"><strong>ZIP / Location:</strong> ${zip}</p>` : ""}
            ${notes ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Notes:</strong> ${notes}</p>` : ""}
          </div>

          <p style="font-size: 14px; line-height: 1.5; color: #52525b;">Our master detailer will call or text you shortly at <strong>${phone}</strong> to confirm your arrival window.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin: 0;">Apex Mobile Detailing · Charlotte, NC · Self-Contained Mobile Studio</p>
        </div>
      `,
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

  // If either email was delivered, the booking was successfully recorded!
  if (artisanSent || clientSent) {
    return { success: true };
  }

  return {
    success: false,
    error: lastError || "Failed to send confirmation. Please try again or text us.",
  };
}
