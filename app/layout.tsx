import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const description =
  "Mobile car detailing in Charlotte, NC. Ceramic coatings, paint correction, interior resets and hand wash & wax — fully self-contained with water and power onboard.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `${siteConfig.name} · Mobile Car Detailing in ${siteConfig.city}, ${siteConfig.region}`,
  description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    title: `${siteConfig.name} — Showroom shine in your driveway`,
    description,
    siteName: siteConfig.name,
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Showroom shine in your driveway`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Showroom shine in your driveway`,
    description,
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Apex Detail",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoWash",
  name: siteConfig.name,
  description,
  url: siteConfig.url,
  telephone: siteConfig.phoneE164,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: siteConfig.city,
    addressRegion: siteConfig.region,
    addressCountry: "US",
  },
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude,
    },
    geoRadius: Math.round(siteConfig.serviceRadiusMiles * 1609.34),
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: `${String(siteConfig.openHour).padStart(2, "0")}:00`,
      closes: `${String(siteConfig.closeHour).padStart(2, "0")}:00`,
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark bg-[#09090b]">
      <body className="font-sans text-zinc-100 antialiased selection:bg-emerald-500/30">
        <AmbientBackground />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
