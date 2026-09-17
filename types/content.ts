import type siteJson from "@/content/site.json";
import type { FaqItem, PaintTone, Review } from "@/types";

/** Shape of `content/site.json`, inferred from the committed file. */
export type SiteContent = typeof siteJson;
export type BusinessInfo = SiteContent["business"];

export interface ServiceContent {
  id: string;
  name: string;
  tagline: string;
  durationMinutes: number;
  priceFrom: number;
  features: string[];
  popular: boolean;
  accent: string;
  imageUrl?: string;
}

interface BlockBase {
  id: string;
}

export interface HeroBlock extends BlockBase {
  type: "hero";
  badge: string;
  titleLine1: string;
  titleLine2: string;
  text: string;
  chips: string[];
  ctaLabel: string;
  ctaHref: string;
  poster: string;
  showVideo: boolean;
  statValue: string;
  statLabel: string;
  reviewsLabel: string;
}

export interface BeforeAfterBlock extends BlockBase {
  type: "beforeAfter";
  eyebrow: string;
  title: string;
  hint: string;
  tone: PaintTone;
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
  beforeAlt: string;
  afterAlt: string;
  stats: { value: string; label: string }[];
}

export interface ServicesBlock extends BlockBase {
  type: "services";
  eyebrow: string;
  title: string;
  hint: string;
  note: string;
  emptyText: string;
}

export interface GalleryItem {
  step: string;
  title: string;
  category: string;
  desc: string;
  src: string;
  alt: string;
}

export interface GalleryBlock extends BlockBase {
  type: "gallery";
  eyebrow: string;
  title: string;
  hint: string;
  introTitle: string;
  introText: string;
  stepLabel: string;
  items: GalleryItem[];
}

export interface ReviewsBlock extends BlockBase {
  type: "reviews";
  eyebrow: string;
  title: string;
  hint: string;
  countLabel: string;
  verifiedText: string;
  cardPrompt: string;
  items: Review[];
}

export interface FaqBlock extends BlockBase {
  type: "faq";
  eyebrow: string;
  title: string;
  items: FaqItem[];
}

export interface TextBlock extends BlockBase {
  type: "text";
  eyebrow: string;
  title: string;
  body: string;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  src: string;
  alt: string;
  caption: string;
}

export interface CtaBlock extends BlockBase {
  type: "cta";
  title: string;
  text: string;
  buttonLabel: string;
}

export type Block =
  | HeroBlock
  | BeforeAfterBlock
  | ServicesBlock
  | GalleryBlock
  | ReviewsBlock
  | FaqBlock
  | TextBlock
  | ImageBlock
  | CtaBlock;

export type BlockType = Block["type"];

export interface PageContent {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  blocks: Block[];
}

/** Everything a rendered page can read: global site content + the current page. */
export interface ContentRoot {
  site: SiteContent;
  page: PageContent;
}
