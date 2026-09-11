import { siteConfig } from "@/lib/site-config";
import type { DayOption, FaqItem, Review, VehicleSizeOption } from "@/types";

export const reviews: Review[] = [
  {
    id: "r-marcus",
    author: "Marcus T.",
    city: "Ballantyne",
    vehicle: "2021 Tesla Model Y",
    rating: 5,
    quote: "Swirls I'd lived with for three years are just gone. Paint looks wet — and they never touched my hose.",
    serviceId: "correction-ceramic",
    tone: "pearl",
    beforeSrc: "/reviews/marcus-before.jpg",
    afterSrc: "/reviews/marcus-after.jpg",
  },
  {
    id: "r-priya",
    author: "Priya S.",
    city: "South End",
    vehicle: "2019 Audi Q5",
    rating: 5,
    quote: "Two kids and a golden retriever. Interior smells brand new. Booked it from my office parking deck.",
    serviceId: "interior-reset",
    tone: "graphite",
    beforeSrc: "/reviews/priya-before.jpg",
    afterSrc: "/reviews/priya-after.jpg",
  },
  {
    id: "r-jordan",
    author: "Jordan W.",
    city: "Matthews",
    vehicle: "2022 Ford F-150",
    rating: 5,
    quote: "On time, set up in five minutes, zero mess on the driveway. Truck hasn't looked this good since the lot.",
    serviceId: "wash-wax",
    tone: "cobalt",
    beforeSrc: "/reviews/jordan-before.jpg",
    afterSrc: "/reviews/jordan-after.jpg",
  },
  {
    id: "r-alyssa",
    author: "Alyssa R.",
    city: "Huntersville",
    vehicle: "2020 Mazda CX-5",
    rating: 5,
    quote: "Soul Red finally pops like it did in the showroom. Rain beads right off now.",
    serviceId: "correction-ceramic",
    tone: "crimson",
    beforeSrc: "/reviews/alyssa-before.jpg",
    afterSrc: "/reviews/alyssa-after.jpg",
  },
  {
    id: "r-dev",
    author: "Dev P.",
    city: "Mooresville",
    vehicle: "2018 BMW 340i",
    rating: 5,
    quote: "Black paint, zero new swirls. Proper two-bucket technique — you can tell they care.",
    serviceId: "wash-wax",
    tone: "obsidian",
    beforeSrc: "/reviews/dev-before.jpg",
    afterSrc: "/reviews/dev-after.jpg",
  },
  {
    id: "r-kendra",
    author: "Kendra M.",
    city: "Dilworth",
    vehicle: "2023 Honda Civic",
    rating: 5,
    quote: "Coffee stains I'd given up on came right out. Texted a quote at 8am, done by lunch.",
    serviceId: "interior-reset",
    tone: "graphite",
    beforeSrc: "/reviews/kendra-before.jpg",
    afterSrc: "/reviews/kendra-after.jpg",
  },
];

export const faqs: FaqItem[] = [
  {
    id: "payment",
    question: "What payment methods do you take?",
    answer:
      "Apple Pay, Google Pay, all major cards, Venmo, Zelle and cash. You pay after the job, once we've walked the car together. Standard packages need no deposit; ceramic bookings hold with a $50 deposit that comes off your total.",
  },
  {
    id: "water",
    question: "Do I need to provide water or power?",
    answer:
      "Nope. The van carries a 100-gallon deionized water tank for spot-free rinsing, a whisper-quiet generator and its own lighting. Driveway, office lot or apartment garage all work — we just need a space the size of a parking spot.",
  },
  {
    id: "rain",
    question: "What happens if it rains?",
    answer:
      "We check radar the night before. If rain looks likely, we'll text to reschedule at no cost — or work under your garage or covered parking. Ceramic coatings need 24 dry hours, so those always get moved to a clear day.",
  },
  {
    id: "radius",
    question: "How far do you travel?",
    answer: `We cover a ${siteConfig.serviceRadiusMiles}-mile radius around Uptown Charlotte — Ballantyne, South End, Matthews, Mint Hill, Huntersville, Cornelius, Mooresville, Concord and Fort Mill, SC. Beyond that, a flat $1/mile travel fee applies.`,
  },
];

export const vehicleSizes: VehicleSizeOption[] = [
  { id: "coupe", label: "Sedan", hint: "Car · coupe", priceMultiplier: 1, timeMultiplier: 1 },
  { id: "suv", label: "SUV / Truck", hint: "2-row · pickup", priceMultiplier: 1.2, timeMultiplier: 1.15 },
  { id: "xl", label: "3-Row", hint: "Minivan · XL", priceMultiplier: 1.4, timeMultiplier: 1.3 },
];

export const dayOptions: DayOption[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week", label: "This week" },
];
