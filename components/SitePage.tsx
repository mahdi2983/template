"use client";

import { BlockList } from "@/components/blocks/BlockList";
import { BookingModal } from "@/components/BookingModal";
import { BookingProvider } from "@/components/BookingProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { ContentProvider, type ContentApi } from "@/lib/editor/content-context";
import type { ContentRoot } from "@/types/content";

/** The shared page chrome: header, the page's blocks, footer, sticky bar and booking sheet. */
export function PageShell() {
  return (
    <BookingProvider>
      <Header />
      <main
        id="main"
        className="mx-auto w-full max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:max-w-2xl lg:max-w-3xl"
      >
        <BlockList />
        <Footer />
      </main>
      <StickyBottomBar />
      <BookingModal />
    </BookingProvider>
  );
}

/** Public, read-only page. */
export function SitePage({ root }: { root: ContentRoot }) {
  const api: ContentApi = { root, editing: false };
  return (
    <ContentProvider value={api}>
      <PageShell />
    </ContentProvider>
  );
}
