import type { Block, BlockType, FaqBlock, GalleryItem, ServiceContent } from "@/types/content";
import type { FaqItem, Review } from "@/types";

/** Short random suffix for new ids (block ids double as section anchors). */
export function shortId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
}

export const NEW_SERVICE: ServiceContent = {
  id: "new-service",
  name: "Nouveau forfait",
  tagline: "Décrivez ce forfait en une phrase.",
  durationMinutes: 120,
  priceFrom: 99,
  features: ["Première prestation incluse", "Deuxième prestation incluse"],
  popular: false,
  accent: "emerald",
  imageUrl: "",
};

export const NEW_GALLERY_ITEM: GalleryItem = {
  step: "07",
  title: "Nouvelle étape",
  category: "Catégorie",
  desc: "Décrivez cette étape.",
  src: "/gallery/01-snow-foam.jpg",
  alt: "Photo de l'étape",
};

export const NEW_REVIEW: Review = {
  id: "review",
  author: "Prénom N.",
  city: "Quartier",
  vehicle: "2024 Modèle",
  rating: 5,
  quote: "Le témoignage du client.",
  serviceId: "wash-wax",
  tone: "obsidian",
  beforeSrc: "/before.jpg",
  afterSrc: "/after.jpg",
};

export const NEW_FAQ_ITEM: FaqItem = {
  id: "question",
  question: "Nouvelle question ?",
  answer: "La réponse à la question.",
};

type Template<T extends Block> = Omit<T, "id">;

const TEMPLATES: { [K in BlockType]: Template<Extract<Block, { type: K }>> } = {
  hero: {
    type: "hero",
    badge: "Mobile detailing studio",
    titleLine1: "Un grand titre",
    titleLine2: "sur deux lignes.",
    text: "Un paragraphe d'introduction pour cette page.",
    chips: ["Water onboard", "Power onboard", "Fully insured"],
    ctaLabel: "Voir les forfaits",
    ctaHref: "/#services",
    poster: "/hero-poster.jpg",
    showVideo: true,
    statValue: "100%",
    statLabel: "Self-contained. No hose, no outlet needed.",
    reviewsLabel: "Google reviews",
  },
  text: {
    type: "text",
    eyebrow: "Sur-titre",
    title: "Titre de la section",
    body: "Votre texte ici. Cliquez pour le modifier.",
  },
  image: {
    type: "image",
    src: "/hero-poster.jpg",
    alt: "Description de l'image",
    caption: "Légende de l'image",
  },
  cta: {
    type: "cta",
    title: "Prêt à réserver ?",
    text: "Estimation instantanée, sans acompte.",
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
    eyebrow: "Galerie",
    title: "Titre de la galerie",
    hint: "Tap to expand",
    introTitle: "Titre d'introduction",
    introText: "Texte d'introduction de la galerie.",
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
    title: "Avis clients",
    hint: "Tap any review",
    countLabel: "reviews on Google",
    verifiedText: "Every review from a verified customer",
    cardPrompt: "Click for full review",
    items: [{ ...NEW_REVIEW, id: "review-1" }],
  },
  faq: {
    type: "faq",
    eyebrow: "Quick answers",
    title: "Questions fréquentes",
    items: [{ ...NEW_FAQ_ITEM, id: "question-1" }] satisfies FaqBlock["items"],
  },
};

/** Labels shown in the "Add a section" menu, in display order. */
export const BLOCK_CHOICES: { type: BlockType; label: string; hint: string }[] = [
  { type: "hero", label: "Grand titre", hint: "Bandeau d'accroche avec image de fond" },
  { type: "text", label: "Texte", hint: "Titre + paragraphe" },
  { type: "image", label: "Image", hint: "Une photo avec légende" },
  { type: "cta", label: "Appel à l'action", hint: "Bouton de réservation" },
  { type: "services", label: "Forfaits & prix", hint: "Les cartes de services" },
  { type: "beforeAfter", label: "Avant / Après", hint: "Comparateur à glisser" },
  { type: "gallery", label: "Galerie", hint: "Grille de photos" },
  { type: "reviews", label: "Avis clients", hint: "Défilement de témoignages" },
  { type: "faq", label: "FAQ", hint: "Questions / réponses" },
];

export function createBlock(type: BlockType): Block {
  return { ...structuredClone(TEMPLATES[type]), id: shortId(type) } as Block;
}
