import { BeforeAfterInteractive } from "@/components/BeforeAfterInteractive";
import { BookingModal } from "@/components/BookingModal";
import { BookingProvider } from "@/components/BookingProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroBento } from "@/components/HeroBento";
import { QuickFaqAccordion } from "@/components/QuickFaqAccordion";
import { ServiceBentoPricing } from "@/components/ServiceBentoPricing";
import { SocialProofTicker } from "@/components/SocialProofTicker";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { WorkGallery } from "@/components/WorkGallery";
import { faqs, reviews } from "@/lib/data";
import { getServices } from "@/lib/services";

/**
 * Dynamic server rendering ensures changes made in Google Sheets
 * reflect immediately on live Vercel deployments as soon as Google publishes the edit.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const services = await getServices();

  return (
    <BookingProvider services={services}>
      <Header />
      <main
        id="main"
        className="mx-auto w-full max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:max-w-2xl lg:max-w-3xl"
      >
        <HeroBento />
        <BeforeAfterInteractive tone="obsidian" beforeSrc="/before.jpg" afterSrc="/after.jpg" />
        <ServiceBentoPricing services={services} />
        <WorkGallery />
        <SocialProofTicker reviews={reviews} services={services} />
        <QuickFaqAccordion items={faqs} />
        <Footer />
      </main>
      <StickyBottomBar />
      <BookingModal />
    </BookingProvider>
  );
}
