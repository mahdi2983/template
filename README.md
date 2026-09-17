# 🏎️ Apex Mobile Detailing — Turnkey Website Template

> **Ultra-luxury, mobile-first showcase & booking system for mobile auto detailers and automotive artisans.**  
> Built with Next.js 15.5 App Router, React 19, Tailwind CSS v4, Resend email automation, and a built-in visual editor that publishes through GitHub.

---

## ✨ Flagship Highlights

- **Liquid Glass Aesthetic:** Frosted glass panels (`backdrop-blur-xl bg-zinc-900/60`), Obsidian dark mode, metallic accents, and fluid mobile interactions.
- **Interactive Before / After Slider:** High-precision, touch-optimized comparison slider with dual-tone obsidian overlays.
- **Live Booking System (Resend):** Fully automated server action delivering customer confirmation emails and instant artisan lead alerts with instant vehicle sizing estimates.
- **Visual Admin (`/admin`):** Password-protected live preview of the site — click any text to edit it, replace photos from your computer, add sections and create new pages that match the design.
- **One-Click Publish:** The **Publish** button commits the changes to GitHub and Vercel redeploys automatically — no database, no storage bucket.
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
- **Content:** JSON files in `content/`, edited from `/admin`, published via the GitHub REST API
- **Edge Media:** Google Drive Photo CDN (`=w1200-h800-c` WebP compression)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 📖 Client Adaptation Playbook

To adapt this template for a new client in under 10 minutes, refer to the complete Boris Cherny workflow guide:
👉 **[CLIENT_CUSTOMIZATION_GUIDE.md](./CLIENT_CUSTOMIZATION_GUIDE.md)**

### Key Customization Files:
| Area | Target File | Description |
|---|---|---|
| **Everything (recommended)** | `/admin` | Visual editor: texts, photos, prices, pages |
| **Identity, packages, shared copy** | `content/site.json` | Business info, logo, services, booking sheet labels |
| **Booking emails** | `content/email.json` | Owner email, sender name, confirmation texts (server-only) |
| **Pages & sections** | `content/pages/*.json` | `home.json` is `/`; other files are `/<slug>` |
| **Uploaded photos** | `public/uploads/` | Written by the Publish button |
| **Section design** | `components/` | Colors, fonts and layout (never exposed in the admin) |

---

## 📦 Environment Variables

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for automated booking confirmations |
| `RESEND_FROM_EMAIL` | Verified sender email (e.g. `Apex Detailing <booking@domain.com>`) |
| `ARTISAN_EMAIL` | Fallback recipient for new leads (the owner email set in `/admin` → Settings → Emails wins) |
| `ADMIN_PASSWORD` | Password for `/admin` |
| `ADMIN_SECRET` | 32+ random characters signing the admin session cookie |
| `GITHUB_TOKEN` | Fine-grained token, this repo only, *Contents: Read and write* (empty in local dev = write to disk) |
| `GITHUB_REPO` | `owner/repo` the Publish button commits to |
| `GITHUB_BRANCH` | Branch Vercel deploys to production (default `main`) |
| `NEXT_PUBLIC_SITE_URL` | Production website URL |

---

## 📄 License
Commercial Template — Proprietary. Built for client deployment.
