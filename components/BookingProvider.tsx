"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useField } from "@/lib/editor/content-context";
import { toServiceItem } from "@/lib/services";
import type { BookingContextValue } from "@/types";
import type { ServiceContent } from "@/types/content";

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const serviceContent = useField<ServiceContent[]>("site.services");
  const services = useMemo(() => serviceContent.map(toServiceItem), [serviceContent]);
  const [state, setState] = useState<{ isOpen: boolean; selectedServiceId: string | null }>({
    isOpen: false,
    selectedServiceId: null,
  });

  const openBooking = useCallback((serviceId?: string) => {
    setState({ isOpen: true, selectedServiceId: serviceId ?? null });
  }, []);

  const closeBooking = useCallback(() => {
    setState((previous) => ({ ...previous, isOpen: false }));
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({ services, ...state, openBooking, closeBooking }),
    [services, state, openBooking, closeBooking],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used inside <BookingProvider>");
  }
  return context;
}
