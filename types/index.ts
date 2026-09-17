export type PaintTone = "obsidian" | "crimson" | "cobalt" | "pearl" | "graphite";
export type ServiceAccent = "emerald" | "ice";
export type VehicleSize = "coupe" | "suv" | "xl";
export type PreferredDay = "today" | "tomorrow" | "week";

export interface ServiceItem {
  id: string;
  name: string;
  tagline: string;
  durationMinutes: number;
  priceFrom: number;
  features: string[];
  popular: boolean;
  accent: ServiceAccent;
  imageUrl?: string;
}

export interface Review {
  id: string;
  author: string;
  city: string;
  vehicle: string;
  rating: number;
  quote: string;
  serviceId: string;
  tone: PaintTone;
  /** Optional real thumbnail photos (e.g. "/reviews/marcus-before.jpg"); the procedural render is used when omitted. */
  beforeSrc?: string;
  afterSrc?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface VehicleSizeOption {
  id: VehicleSize;
  label: string;
  hint: string;
  priceMultiplier: number;
  timeMultiplier: number;
}

export interface DayOption {
  id: PreferredDay;
  label: string;
}

export interface Estimate {
  low: number;
  high: number;
  durationLabel: string;
}

export interface SiteConfig {
  name: string;
  monogram: string;
  url: string;
  city: string;
  region: string;
  phoneDisplay: string;
  phoneE164: string;
  hoursLabel: string;
  hoursShort: string;
  openHour: number;
  closeHour: number;
  /** 0 = Sunday … 6 = Saturday */
  openDays: number[];
  timeZone: string;
  serviceRadiusMiles: number;
  googleRating: number;
  googleReviewCount: number;
  geo: { latitude: number; longitude: number };
}

export interface BookingContextValue {
  services: ServiceItem[];
  isOpen: boolean;
  selectedServiceId: string | null;
  openBooking: (serviceId?: string) => void;
  closeBooking: () => void;
}
