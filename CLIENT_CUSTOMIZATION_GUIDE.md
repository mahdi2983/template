# 🚀 Apex Mobile Detailing — Client Customization & Onboarding Playbook
> **Boris Cherny (ChernyCode) Quick Adaptation Standard**  
> Use this playbook whenever deploying this template for a new client. Total setup time: **under 10 minutes**.

---

## 🎯 Architecture Overview

- **Framework:** Next.js 15.5 App Router, React 19, Tailwind CSS v4, TypeScript.
- **Design System:** Apple Liquid Glass, Obsidian dark mode, frosted glass surfaces, mobile-first responsive layout.
- **Content:** every text, price and photo path lives in `content/site.json` and `content/pages/*.json`.
- **Visual editor:** `/admin` (password-protected) shows the real site; the client clicks any text to edit it,
  clicks 📷 to replace a photo from their computer, and creates new pages from the existing sections.
- **Publishing:** the **Publish** button commits the content (and uploaded photos) to GitHub through the API;
  Vercel redeploys automatically in 1–2 minutes. GitHub is the database — no CMS, no storage bucket.
- **Transactional Booking:** Resend API server action (`app/actions/book.ts`) delivering instant dual-confirmation emails.

```
Client ──► /admin (iframe preview, click to edit) ──► Publish
                                                        │  1 commit: content/*.json + public/uploads/*
                                                        ▼
                                                 GitHub repo ──► Vercel build ──► live site
```

---

## ⚡ 5-Minute Client Customization Checklist

### 1. Business identity, copy & photos
Everything can be done from `/admin` once deployed:
- **Click a text** → edit in place (Enter to validate, Esc to cancel).
- **📷 button** on a photo → pick a file; it is resized to WebP (max 2000 px) in the browser and
  uploaded to the repository right away (the toolbar shows "Uploading photo…").
- **Settings** (drawer) → business info (phone, hours, city, Google rating), SEO, prices/durations,
  alt texts, and the copy of the booking sheet.
- **Logo:** the small 📷 on the header logo uploads an image (Settings → Business → Remove to go back to the letter).
- Hover a card → ↑ ↓ duplicate / delete. Dashed buttons add items (FAQ, reviews, gallery photos, packages…).

To pre-fill a new client before handing over, you can also edit `content/site.json` directly.

### 2. New pages
Page menu → **+ New page…** → title (+ optional URL). The page starts with a hero, a text block and a
booking call-to-action; **+ Add section** inserts any existing section type (packages, before/after,
gallery, reviews, FAQ, image, text, CTA). Pages are served at `/<slug>`.

Sections only expose text and images: colors, fonts, sizes and layout always come from the components.

### 3. Automated Booking Emails (Resend)
In `.env.local` (and Vercel environment variables):
```env
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="Apex Detailing <booking@clientdomain.com>"
ARTISAN_EMAIL="client-inbox@gmail.com"   # fallback when no owner email is set in /admin
```
- During onboarding/testing: use `Apex Detailing <onboarding@resend.dev>`.
- In production: add client domain to [Resend Domains](https://resend.com/domains) and set DNS DKIM records.

**Booking emails (Settings → Emails):** owner email that receives new bookings, sender name, reply-to
address, subjects and texts of the customer confirmation (placeholders `{name} {service} {estimate} {vehicle}
{date} {phone} {business}`), on/off switch for the customer confirmation, and a **Send me a test confirmation**
button. These settings live in `content/email.json`, which is never sent to visitors' browsers. The Resend API
key and the sender *address* stay in environment variables (the address must be on a domain verified in Resend).

### 4. Admin & publish button
1. Create a **fine-grained GitHub token**: *Settings → Developer settings → Fine-grained tokens*,
   **Only select repositories** → the client repo, **Repository permissions → Contents: Read and write**.
2. Add to Vercel (Production):
   ```env
   ADMIN_PASSWORD="a long password for the client"
   ADMIN_SECRET="64 random hex chars"   # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   GITHUB_TOKEN="github_pat_…"
   GITHUB_REPO="mahdi2983/<client-repo>"
   GITHUB_BRANCH="main"
   ```
3. Make sure the Vercel project deploys `GITHUB_BRANCH` to production (default for `main`).

Local development: without `GITHUB_TOKEN`, **Publish** writes the JSON files and images straight to disk
(badge "Local mode") so the whole flow can be tested with `npm run dev`.

---

## 🌐 Vercel Deployment Guide

1. Push your client repository to GitHub (`mahdi2983/<client-repo>`).
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. In **Environment Variables**, add:
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ARTISAN_EMAIL`
   - `ADMIN_PASSWORD`, `ADMIN_SECRET`
   - `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`
   - `NEXT_PUBLIC_SITE_URL`
4. Click **Deploy**.
5. In **Settings > Domains**, attach the client's custom domain (e.g. `clientdetailing.com`).
   - Add DNS A Record: `@` -> `76.76.21.21`
   - Add DNS CNAME Record: `www` -> `cname.vercel-dns.com`

---

## 🩺 Troubleshooting

**A change published from one device doesn't appear elsewhere.**
Check the branch chip next to the **Publish** button: it shows where the editor commits
(`→ main` in grey, or an amber `⚠ branch <name>` when it is anything else). An amber chip means
`GITHUB_BRANCH` points at a non-production branch in that environment — fix it in the Vercel
environment variables (or `.env.local` for `npm run dev`) and redeploy. The published content also
lives on that branch only, so cherry-pick or re-apply those edits on `main`.

**Unpublished changes are per device.** Edits stay in the browser that made them until **Publish**
is clicked: another phone or computer keeps showing the live content until then.

**"The photo … is missing from this device".** The photo was picked in another browser or session
and its local copy is gone, so it cannot be uploaded. Select the photo again on the current device,
then publish. Photos are uploaded as soon as they are picked, so this only affects drafts made
before that upload succeeded.

---

## 📱 Client Delivery Handover (Zero-Support Guarantee)

Save **`https://<client-domain>/admin`** on the client's computer and phone home screen (name: **"Apex Admin"**)
and give them the password.

The client can now:
- Change any text, price or photo, then click **Publish** — the site is live 1–2 minutes later.
- Create new pages that automatically match the site design.
- Undo mistakes (Ctrl+Z / ↶) before publishing; unpublished drafts survive a page reload.
- Receive customer booking inquiries instantly in their inbox and via SMS.

If two people edit at the same time, the second **Publish** is refused with a message asking to reload —
no one silently overwrites the other.
