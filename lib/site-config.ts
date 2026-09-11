import type { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "Apex Mobile Detailing",
  monogram: "A",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  city: "Charlotte",
  region: "NC",
  phoneDisplay: "(704) 555-0142",
  phoneE164: "+17045550142",
  hoursLabel: "Mon–Sat · 7am–7pm",
  hoursShort: "7a–7p",
  openHour: 7,
  closeHour: 19,
  openDays: [1, 2, 3, 4, 5, 6],
  timeZone: "America/New_York",
  serviceRadiusMiles: 25,
  googleRating: 5.0,
  googleReviewCount: 127,
  geo: { latitude: 35.2271, longitude: -80.8431 },
};
