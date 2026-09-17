"use client";

import { Check, Clock, Loader2, MessageSquare, Phone, Send, X } from "lucide-react";
import { useCallback, useId, useLayoutEffect, useRef, useState, type AnimationEvent, type FormEvent } from "react";
import { submitBooking } from "@/app/actions/book";
import { useBooking } from "@/components/BookingProvider";
import { T } from "@/components/editable/T";
import { cn } from "@/lib/cn";
import { useField } from "@/lib/editor/content-context";
import { calcEstimate, formatDuration, formatPrice } from "@/lib/estimate";
import { focusRing, pressable } from "@/lib/styles";
import type { DayOption, PreferredDay, ServiceItem, VehicleSize, VehicleSizeOption } from "@/types";
import type { BusinessInfo, SiteContent } from "@/types/content";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Slightly longer than the 280ms sheet-out animation. */
const CLOSE_FALLBACK_MS = 320;

export function BookingModal() {
  const { isOpen, selectedServiceId, services, closeBooking } = useBooking();

  if (!isOpen || services.length === 0) return null;

  const fallbackId = services.find((service) => service.popular)?.id ?? services[0]?.id ?? "";

  return (
    <BookingSheet initialServiceId={selectedServiceId ?? fallbackId} services={services} onClosed={closeBooking} />
  );
}

interface BookingSheetProps {
  initialServiceId: string;
  services: ServiceItem[];
  onClosed: () => void;
}

/** Mounted fresh on every open, so its state always starts from the tapped service. */
function BookingSheet({ initialServiceId, services, onClosed }: BookingSheetProps) {
  const business = useField<BusinessInfo>("site.business");
  const copy = useField<SiteContent["booking"]>("site.booking");
  const vehicleSizes = copy.vehicleSizes as VehicleSizeOption[];
  const dayOptions = copy.dayOptions as DayOption[];
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [size, setSize] = useState<VehicleSize>("coupe");
  const [day, setDay] = useState<PreferredDay>("today");
  const [zip, setZip] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isClosing, setIsClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const groupId = useId();

  const service = services.find((item) => item.id === serviceId) ?? services[0]!;
  const sizeOption = vehicleSizes.find((option) => option.id === size) ?? vehicleSizes[0]!;
  const dayOption = dayOptions.find((option) => option.id === day) ?? dayOptions[0]!;
  const estimate = calcEstimate(service, sizeOption);

  const closeTimerRef = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    setIsClosing(true);
    if (closeTimerRef.current === null) {
      closeTimerRef.current = window.setTimeout(onClosed, CLOSE_FALLBACK_MS);
    }
  }, [onClosed]);

  useLayoutEffect(() => {
    const closeTimer = closeTimerRef;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      const panel = panelRef.current;
      if (event.key !== "Tab" || !panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      root.style.overflow = previousOverflow;
      previouslyFocused?.focus();
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [requestClose]);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (isClosing && event.target === event.currentTarget) {
      onClosed();
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    // Explicitly append structured fields
    formData.set("service", `${service.name} (${formatPrice(estimate.low)} – ${formatPrice(estimate.high)})`);
    formData.set("estimate", `${formatPrice(estimate.low)} – ${formatPrice(estimate.high)} (approx. ${estimate.durationLabel})`);
    formData.set("vehicle", vehicleModel.trim() ? `${vehicleModel.trim()} (${sizeOption.label})` : sizeOption.label);
    formData.set("date", dayOption.label);
    formData.set("zip", zip);
    formData.set("notes", notes);

    const res = await submitBooking(formData);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMessage(res.error || "Failed to send confirmation. Please try again or text us.");
    }
  }

  const messageLines = [
    `Hi ${business.name}! I'd like to book:`,
    `• ${service.name}`,
    `• Vehicle: ${vehicleModel ? `${vehicleModel} (${sizeOption.label})` : sizeOption.label}`,
    `• When: ${dayOption.label}`,
    zip ? `• ZIP: ${zip}` : null,
    `Instant estimate: ${formatPrice(estimate.low)}–${formatPrice(estimate.high)}`,
  ].filter(Boolean);
  const smsHref = `sms:${business.phoneE164}?&body=${encodeURIComponent(messageLines.join("\n"))}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden
        onClick={requestClose}
        className={cn("absolute inset-0 bg-black/65 backdrop-blur-sm", isClosing ? "animate-fade-out" : "animate-fade-in")}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onAnimationEnd={handleAnimationEnd}
        className={cn(
          "relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] border border-zinc-800/80 bg-zinc-900/95 shadow-2xl outline-none backdrop-blur-xl sm:rounded-3xl",
          isClosing ? "animate-sheet-out" : "animate-sheet-in",
        )}
      >
        <div className="no-scrollbar overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-700 sm:hidden" />

          {/* Top Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-xl font-semibold tracking-tight text-zinc-100">
                <T p={submitted ? "site.booking.successTitle" : "site.booking.title"} />
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                <T p={submitted ? "site.booking.successSubtitle" : "site.booking.subtitle"} />
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close"
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-2xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
                pressable,
                focusRing,
              )}
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>

          {/* Success Screen */}
          {submitted ? (
            <div className="mt-5 rounded-3xl border border-emerald-500/30 bg-zinc-950/70 p-6 text-center shadow-xl sm:p-7">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
                <Check className="size-7" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-zinc-100">
                <T p="site.booking.successHeading" />
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                <T p="site.booking.successSentTo" /> <strong className="text-zinc-200">{customerEmail}</strong>.{" "}
                <T p="site.booking.successCallback" /> <strong className="text-zinc-200">{phone}</strong>
              </p>

              <div className="mt-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 text-left text-xs">
                <div className="flex justify-between py-1 text-zinc-400">
                  <span>
                    <T p="site.booking.summaryCustomer" />
                  </span>
                  <span className="font-semibold text-zinc-200">{customerName}</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-400">
                  <span>
                    <T p="site.booking.summaryPackage" />
                  </span>
                  <span className="font-semibold text-zinc-200">{service.name}</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-400">
                  <span>
                    <T p="site.booking.summaryVehicle" />
                  </span>
                  <span className="font-semibold text-zinc-200">{vehicleModel || sizeOption.label}</span>
                </div>
                <div className="flex justify-between py-1 text-zinc-400">
                  <span>
                    <T p="site.booking.summaryDay" />
                  </span>
                  <span className="font-semibold text-zinc-200">{dayOption.label}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-1.5 text-zinc-400">
                  <span>
                    <T p="site.booking.summaryTotal" />
                  </span>
                  <span className="font-bold text-emerald-400">
                    {formatPrice(estimate.low)} – {formatPrice(estimate.high)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={requestClose}
                  className={cn(
                    "flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-white text-sm font-semibold text-zinc-950 hover:bg-zinc-200",
                    pressable,
                    focusRing,
                  )}
                >
                  <T p="site.booking.doneLabel" inButton />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Service Selection */}
              <fieldset>
                <legend className="mb-2 text-xs font-medium tracking-[0.14em] text-zinc-400 uppercase">
                  <T p="site.booking.stepService" />
                </legend>
                <div className="space-y-1.5">
                  {services.map((item) => {
                    const active = item.id === serviceId;
                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all duration-200 active:scale-[0.99] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400/70",
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${groupId}-service`}
                          value={item.id}
                          checked={active}
                          onChange={() => setServiceId(item.id)}
                          className="sr-only"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-zinc-100">{item.name}</span>
                          <span className="text-xs text-zinc-400">
                            from {formatPrice(item.priceFrom)} · {formatDuration(item.durationMinutes)}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                            active ? "border-emerald-400 bg-emerald-500 text-zinc-950" : "border-zinc-700",
                          )}
                        >
                          {active ? <Check className="size-3" strokeWidth={3} /> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Vehicle Size & Model */}
              <fieldset>
                <legend className="mb-2 text-xs font-medium tracking-[0.14em] text-zinc-400 uppercase">
                  <T p="site.booking.stepVehicle" />
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {vehicleSizes.map((option) => {
                    const active = option.id === size;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex min-h-[54px] cursor-pointer flex-col items-center justify-center rounded-2xl border px-2 text-center transition-all duration-200 active:scale-95 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400/70",
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${groupId}-size`}
                          value={option.id}
                          checked={active}
                          onChange={() => setSize(option.id)}
                          className="sr-only"
                        />
                        <span className="text-xs font-semibold text-zinc-100">
                          <T p={`site.booking.vehicleSizes.${vehicleSizes.indexOf(option)}.label`} />
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          <T p={`site.booking.vehicleSizes.${vehicleSizes.indexOf(option)}.hint`} />
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-2">
                  <input
                    name="vehicle"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder={copy.placeholders.vehicle}
                    required
                    className="min-h-[44px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>
              </fieldset>

              {/* Preferred Day */}
              <fieldset>
                <legend className="mb-2 text-xs font-medium tracking-[0.14em] text-zinc-400 uppercase">
                  <T p="site.booking.stepDay" />
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {dayOptions.map((option) => {
                    const active = option.id === day;
                    return (
                      <label
                        key={option.id}
                        className={cn(
                          "flex min-h-[44px] cursor-pointer items-center justify-center rounded-2xl border px-2 text-xs font-medium transition-all duration-200 active:scale-95 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400/70",
                          active
                            ? "border-emerald-500/60 bg-emerald-500/10 text-zinc-100 font-semibold"
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${groupId}-day`}
                          value={option.id}
                          checked={active}
                          onChange={() => setDay(option.id)}
                          className="sr-only"
                        />
                        <T p={`site.booking.dayOptions.${dayOptions.indexOf(option)}.label`} />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Contact Details Section */}
              <fieldset className="space-y-2">
                <legend className="mb-1 text-xs font-medium tracking-[0.14em] text-zinc-400 uppercase">
                  <T p="site.booking.stepContact" />
                </legend>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    name="name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={copy.placeholders.name}
                    required
                    className="min-h-[44px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
                  />
                  <input
                    type="email"
                    name="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder={copy.placeholders.email}
                    required
                    className="min-h-[44px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={copy.placeholders.phone}
                    required
                    className="min-h-[44px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
                  />
                  <input
                    name="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    placeholder={copy.placeholders.zip}
                    className="min-h-[44px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
                  />
                </div>

                <input
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={copy.placeholders.notes}
                  className="min-h-[44px] w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none"
                />
              </fieldset>

              {/* Estimate Summary Pill */}
              <div aria-live="polite" className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                    <T p="site.booking.estimateLabel" />
                  </p>
                  <p className="text-xl font-bold tracking-tight text-emerald-400">
                    {formatPrice(estimate.low)}
                    <span className="text-zinc-500"> – </span>
                    {formatPrice(estimate.high)}
                  </p>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
                  <Clock className="size-3 shrink-0 text-zinc-400" />
                  <T p="site.booking.aboutLabel" /> {estimate.durationLabel} <T p="site.booking.estimateNote" />
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* Primary Live Submission Button */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50",
                  focusRing,
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <T p="site.booking.sendingLabel" inButton />
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <T p="site.booking.submitLabel" inButton />
                  </>
                )}
              </button>

              {/* Direct Instant Alternatives */}
              <div className="pt-1">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                  </div>
                  <span className="relative bg-zinc-900 px-2 text-[10px] font-semibold text-zinc-500 uppercase">
                    <T p="site.booking.altContactLabel" />
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <a
                    href={smsHref}
                    className={cn(
                      "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/80 text-xs font-semibold text-zinc-200 hover:bg-zinc-800",
                      pressable,
                      focusRing,
                    )}
                  >
                    <MessageSquare className="size-3.5 text-zinc-400" />
                    <T p="site.booking.textRequestLabel" />
                  </a>
                  <a
                    href={`tel:${business.phoneE164}`}
                    aria-label={`Call ${business.phoneDisplay}`}
                    className={cn(
                      "grid min-h-[44px] min-w-[44px] place-items-center rounded-xl border border-zinc-700/80 bg-zinc-800/80 text-emerald-400 hover:bg-zinc-800",
                      pressable,
                      focusRing,
                    )}
                  >
                    <Phone className="size-4" />
                  </a>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
