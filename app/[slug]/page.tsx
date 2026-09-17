import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SitePage } from "@/components/SitePage";
import { getPage, getSite, HOME_SLUG, listPageSlugs } from "@/lib/content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Every page is pre-rendered from `content/pages/*.json`; a deploy adds new ones. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await listPageSlugs();
  return slugs.filter((slug) => slug !== HOME_SLUG).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};

  const site = getSite();
  const title = page.seoTitle || `${page.title} · ${site.business.name}`;
  const description = page.seoDescription || site.meta.description;
  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description },
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug === HOME_SLUG) notFound();

  const page = await getPage(slug);
  if (!page) notFound();

  return <SitePage root={{ site: getSite(), page }} />;
}
