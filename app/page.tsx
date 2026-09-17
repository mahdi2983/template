import { notFound } from "next/navigation";
import { SitePage } from "@/components/SitePage";
import { getPage, getSite, HOME_SLUG } from "@/lib/content";

export default async function HomePage() {
  const page = await getPage(HOME_SLUG);
  if (!page) notFound();

  return <SitePage root={{ site: getSite(), page }} />;
}
