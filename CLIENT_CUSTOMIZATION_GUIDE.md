# 🚀 Apex Mobile Detailing — Client Customization & Onboarding Playbook
> **Boris Cherny (ChernyCode) Quick Adaptation Standard**  
> Use this playbook whenever deploying this template for a new client. Total setup time: **under 10 minutes**.

---

## 🎯 Architecture Overview

- **Framework:** Next.js 15.5 App Router, React 19, Tailwind CSS v4, TypeScript.
- **Design System:** Apple Liquid Glass, Obsidian dark mode, frosted glass surfaces, mobile-first responsive layout.
- **Headless CMS:** Google Sheets (CSV) with Incremental Static Regeneration (ISR 60s) — zero database maintenance.
- **Photo CDN:** Google Forms + Google Drive edge CDN (`lh3.googleusercontent.com`) with on-the-fly WebP compression.
- **Transactional Booking:** Resend API server action (`app/actions/book.ts`) delivering instant dual-confirmation emails.

---

## ⚡ 5-Minute Client Customization Checklist

### 1. Business Identity & Localization (`lib/site-config.ts`)
Open `lib/site-config.ts` and update the client object:
```ts
export const siteConfig: SiteConfig = {
  name: "Apex Mobile Detailing",            // Client Business Name
  monogram: "A",                             // Single Letter Logo / Favicon
  url: "https://apexdetailing.com",          // Production URL
  city: "Charlotte",                         // Main Service City
  region: "NC",                              // State / Region
  phoneDisplay: "(704) 555-0142",            // Customer-facing phone
  phoneE164: "+17045550142",                 // International click-to-call / SMS
  hoursLabel: "Mon–Sat · 7am–7pm",           // Business hours label
  hoursShort: "7a–7p",
  openHour: 7,                               // For dynamic open/closed status pill
  closeHour: 19,
  openDays: [1, 2, 3, 4, 5, 6],
  timeZone: "America/New_York",
  serviceRadiusMiles: 25,                    // Travel coverage radius
  googleRating: 5.0,                         // Google rating display
  googleReviewCount: 127,                    // Verified reviews count
  geo: { latitude: 35.2271, longitude: -80.8431 },
};
```

---

### 2. Live Pricing & Photos CMS (Google Sheets + Forms)
1. **Google Form ("Photo Updates"):**
   - Question 1 (Dropdown): `Select Service Package` with the package names.
   - Question 2 (File upload): `Upload or Take New Photo` restricted to **Image**.
   - **Google Drive Permission:** Set the generated photo response folder to **"Anyone with the link: Viewer"**.
2. **Google Sheet:**
   - Tab 1: `Form Responses 1` (linked from Form).
   - Tab 2: `Services` (with headers: `id`, `name`, `tagline`, `price_from`, `duration_min`, `features`, `popular`, `accent`, `imageUrl`).
   - Formula for `imageUrl` (cell `I2`):
     ```excel
     =XLOOKUP(B2, 'Form Responses 1'!B:B, 'Form Responses 1'!C:C, "/gallery/06-interior-detail.jpg", 0, -1)
     ```
   - Publish to web: **File > Share > Publish to web > Services tab > Comma-separated values (.csv)**.
3. **Set Environment Variable:**
   - Copy the published CSV URL into `NEXT_PUBLIC_SERVICES_SHEET_URL` and `SERVICES_SHEET_URL`.

---

### 3. Automated Booking Emails (Resend)
In `.env.local` (and Vercel environment variables):
```env
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="Apex Detailing <booking@clientdomain.com>"
ARTISAN_EMAIL="client-inbox@gmail.com"
```
- During onboarding/testing: use `Apex Detailing <onboarding@resend.dev>`.
- In production: add client domain to [Resend Domains](https://resend.com/domains) and set DNS DKIM records.

---

### 4. Localized FAQs & Reviews (`lib/data.ts`)
- **Reviews (`reviews` array):** Update the author names, car models, neighborhoods, and testimonial quotes.
- **FAQs (`faqs` array):** Customize travel radius, water/power requirements, rain cancellation policies, and accepted payment methods.

---

### 5. Work Gallery & Before/After Slider (`public/`)
Replace static images in `public/` to match the client's work:
- `public/before.jpg` & `public/after.jpg`: The interactive slider before/after.
- `public/gallery/01-foam-cannon.jpg` to `06-interior-detail.jpg`: The work in progress grid.

---

## 🌐 Vercel Deployment Guide

1. Push your client repository to GitHub (`mahdi2983/<client-repo>`).
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. In **Environment Variables**, add:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `ARTISAN_EMAIL`
   - `NEXT_PUBLIC_SERVICES_SHEET_URL`
   - `SERVICES_SHEET_URL`
4. Click **Deploy**.
5. In **Settings > Domains**, attach the client's custom domain (e.g. `clientdetailing.com`).
   - Add DNS A Record: `@` -> `76.76.21.21`
   - Add DNS CNAME Record: `www` -> `cname.vercel-dns.com`

---

## 📱 Client Delivery Handover (Zero-Support Guarantee)

Save two shortcuts on the client's smartphone home screen:
1. **Google Sheet Link** -> Add to Home Screen -> Name: **"Apex Pricing & Services"**.
2. **Google Form Link** -> Add to Home Screen -> Name: **"Apex Photo Upload"**.

The client can now:
- Update pricing, package descriptions, or delete services in 60 seconds.
- Take a live photo on site and update their website in 60 seconds.
- Receive customer booking inquiries instantly in their inbox and via SMS.
