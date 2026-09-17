import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/AmbientBackground";
import siteJson from "@/content/site.json";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const { meta } = siteJson;
const description = meta.description;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: meta.title,
  description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    title: meta.shareTitle,
    description,
    siteName: siteConfig.name,
    locale: "en_US",
    images: [
      {
        url: meta.shareImage,
        width: 1200,
        height: 630,
        alt: meta.shareTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: meta.shareTitle,
    description,
    images: [meta.shareImage],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: meta.appTitle,
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
