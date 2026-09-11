# 🏎️ Apex Mobile Detailing — Turnkey Website Template

> **Ultra-luxury, mobile-first showcase & booking system for mobile auto detailers and automotive artisans.**  
> Built with Next.js 15.5 App Router, React 19, Tailwind CSS v4, Resend email automation, and a serverless Google Sheets & Forms CMS.

---

## ✨ Flagship Highlights

- **Liquid Glass Aesthetic:** Frosted glass panels (`backdrop-blur-xl bg-zinc-900/60`), Obsidian dark mode, metallic accents, and fluid mobile interactions.
- **Interactive Before / After Slider:** High-precision, touch-optimized comparison slider with dual-tone obsidian overlays.
- **Live Booking System (Resend):** Fully automated server action delivering customer confirmation emails and instant artisan lead alerts with instant vehicle sizing estimates.
- **Serverless Headless CMS (Google Sheets):** Edit prices, packages, and copy from your smartphone without touching code or database (ISR 60s revalidation).
- **Zero-Friction Photo Management (Google Forms):** Detailers upload camera roll photos from a phone shortcut; Google edge CDN automatically delivers optimized WebP images (`lh3.googleusercontent.com`).
- **Zero Maintenance Architecture:** 100% serverless, zero SQL database, zero monthly hosting costs on Vercel hobby tier.

---

## 🚀 Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# 3. Start local development server
npm run dev

# 4. Build for production
npm run build
```

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15.5](https://nextjs.org/) (App Router, Server Actions, ISR 60s)
- **UI & Styling:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Email Engine:** [Resend](https://resend.com/) API
- **Data Ingestion:** [PapaParse](https://www.papaparse.com/) CSV parser
- **Edge Media:** Google Drive Photo CDN (`=w1200-h800-c` WebP compression)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 📖 Client Adaptation Playbook

To adapt this template for a new client in under 10 minutes, refer to the complete Boris Cherny workflow guide:
👉 **[CLIENT_CUSTOMIZATION_GUIDE.md](./CLIENT_CUSTOMIZATION_GUIDE.md)**

### Key Customization Files:
| Area | Target File | Description |
|---|---|---|
| **Identity & Phone** | `lib/site-config.ts` | Business name, monogram, phone, service radius, city |
| **Pricing & Packages** | Google Sheets | Live CMS URL configured in `.env.local` / Vercel |
| **Reviews & FAQs** | `lib/data.ts` | Customer testimonials, before/after photos, FAQs |
| **Work Gallery** | `public/gallery/` | Real detailing action photos |
| **Interactive Slider** | `public/before.jpg`, `after.jpg` | 4:5 / 16:10 comparison photos |

---

## 📦 Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for automated booking confirmations |
| `RESEND_FROM_EMAIL` | Verified sender email (e.g. `Apex Detailing <booking@domain.com>`) |
| `ARTISAN_EMAIL` | Detailer's email where new leads are sent |
| `NEXT_PUBLIC_SERVICES_SHEET_URL` | Public CSV link of the Google Sheets CMS |
| `SERVICES_SHEET_URL` | Server-side CSV link of the Google Sheets CMS |
| `NEXT_PUBLIC_SITE_URL` | Production website URL |

---

## 📄 License
Commercial Template — Proprietary. Built for client deployment.
