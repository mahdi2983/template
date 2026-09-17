import type { Block, BlockType, FaqBlock, GalleryItem, ServiceContent } from "@/types/content";
import type { FaqItem, Review } from "@/types";

/** Short random suffix for new ids (block ids double as section anchors). */
export function shortId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

export const NEW_SERVICE: ServiceContent = {
  id: "new-service",
  name: "New package",
  tagline: "Describe this package in one sentence.",
  durationMinutes: 120,
  priceFrom: 99,
  features: ["First included service", "Second included service"],
  popular: false,
  accent: "emerald",
  imageUrl: "",
};

export const NEW_GALLERY_ITEM: GalleryItem = {
  step: "07",
  title: "New step",
  category: "Category",
  desc: "Describe this step.",
  src: "/gallery/01-snow-foam.jpg",
  alt: "Step photo",
};

export const NEW_REVIEW: Review = {
  id: "review",
  author: "First L.",
  city: "Neighborhood",
  vehicle: "2024 Model",
  rating: 5,
  quote: "The customer's testimonial.",
  serviceId: "wash-wax",
  tone: "obsidian",
  beforeSrc: "/before.jpg",
  afterSrc: "/after.jpg",
};

export const NEW_FAQ_ITEM: FaqItem = {
  id: "question",
  question: "New question?",
  answer: "The answer to the question.",
};

type Template<T extends Block> = Omit<T, "id">;

const TEMPLATES: { [K in BlockType]: Template<Extract<Block, { type: K }>> } = {
  hero: {
    type: "hero",
    badge: "Mobile detailing studio",
    titleLine1: "A big headline",
    titleLine2: "on two lines.",
    text: "An introduction paragraph for this page.",
    chips: ["Water onboard", "Power onboard", "Fully insured"],
    ctaLabel: "See packages & pricing",
    ctaHref: "/#services",
    poster: "/hero-poster.jpg",
    showVideo: true,
    statValue: "100%",
    statLabel: "Self-contained. No hose, no outlet needed.",
    reviewsLabel: "Google reviews",
  },
  text: {
    type: "text",
    eyebrow: "Eyebrow",
    title: "Section title",
    body: "Your text here. Click to edit it.",
  },
  image: {
    type: "image",
    src: "/hero-poster.jpg",
    alt: "Image description",
    caption: "Image caption",
  },
  cta: {
    type: "cta",
    title: "Ready to book?",
    text: "Instant estimate, no deposit required.",
    buttonLabel: "Instant Estimate",
  },
  beforeAfter: {
    type: "beforeAfter",
    eyebrow: "Real results",
    title: "Swipe the difference",
    hint: "Drag",
    tone: "obsidian",
    beforeSrc: "/before.jpg",
    afterSrc: "/after.jpg",
    beforeLabel: "Before",
    afterLabel: "After",
    beforeAlt: "Before",
    afterAlt: "After",
    stats: [
      { value: "70%", label: "Swirls removed" },
      { value: "3 yr", label: "Ceramic protection" },
      { value: "6 hrs", label: "In your driveway" },
    ],
  },
  services: {
    type: "services",
    eyebrow: "Packages",
    title: "Pick your reset",
    hint: "Sedan pricing",
    note: "SUVs, trucks & 3-row vehicles adjust automatically in the instant estimate.",
    emptyText: "Pricing is being refreshed — call for a same-day quote.",
  },
  gallery: {
    type: "gallery",
    eyebrow: "Gallery",
    title: "Gallery title",
    hint: "Tap to expand",
    introTitle: "Introduction title",
    introText: "Gallery introduction text.",
    stepLabel: "Step",
    items: [
      { ...NEW_GALLERY_ITEM, step: "01" },
      { ...NEW_GALLERY_ITEM, step: "02", src: "/gallery/02-hand-wash.jpg" },
      { ...NEW_GALLERY_ITEM, step: "03", src: "/gallery/03-spot-free-rinse.jpg" },
    ],
  },
  reviews: {
    type: "reviews",
    eyebrow: "Google reviews",
    title: "Customer reviews",
    hint: "Tap any review",
    countLabel: "reviews on Google",
    verifiedText: "Every review from a verified customer",
    cardPrompt: "Click for full review",
    items: [{ ...NEW_REVIEW, id: "review-1" }],
  },
  faq: {
    type: "faq",
    eyebrow: "Quick answers",
    title: "Frequently asked questions",
    items: [{ ...NEW_FAQ_ITEM, id: "question-1" }] satisfies FaqBlock["items"],
  },
};

/** Labels shown in the "Add a section" menu, in display order. */
export const BLOCK_CHOICES: { type: BlockType; label: string; hint: string }[] = [
  { type: "hero", label: "Hero", hint: "Headline banner with background image" },
  { type: "text", label: "Text", hint: "Heading + paragraph" },
  { type: "image", label: "Image", hint: "One photo with a caption" },
  { type: "cta", label: "Call to action", hint: "Booking button" },
  { type: "services", label: "Packages & pricing", hint: "The service cards" },
  { type: "beforeAfter", label: "Before / After", hint: "Drag-to-compare slider" },
  { type: "gallery", label: "Gallery", hint: "Photo grid" },
  { type: "reviews", label: "Reviews", hint: "Scrolling testimonials" },
  { type: "faq", label: "FAQ", hint: "Questions & answers" },
];

export function createBlock(type: BlockType): Block {
  return { ...structuredClone(TEMPLATES[type]), id: shortId(type) } as Block;
}
