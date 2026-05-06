"use client";

import { useEffect, useState, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Clock, ChevronRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import { useRouter, useSearchParams } from "next/navigation";
import type { ApiBooking } from "@/lib/supabase/types";

type Filter = "all" | "pending" | "approved" | "rejected";
const VALID_FILTERS: Filter[] = ["all", "pending", "approved", "rejected"];

function BookingsTabInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFilter = (() => {
    const p = searchParams.get("filter");
    return VALID_FILTERS.includes(p as Filter) ? (p as Filter) : "all";
  })();

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const { t, lang } = useLang();
  const isRTL = lang === "ar";

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",      label: t("admin.filter_all") },
    { key: "pending",  label: t("admin.filter_pending") },
    { key: "approved", label: t("admin.filter_approved") },
    { key: "rejected", label: t("admin.filter_rejected") },
  ];

  const STATUS_CONFIG = {
    pending:  { icon: Clock,        color: "text-amber-500",   bg: "bg-amber-50",    label: t("admin.status_pending") },
    approved: { icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50",  label: t("admin.status_approved") },
    rejected: { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50",      label: t("admin.status_rejected") },
    refunded: { icon: XCircle,      color: "text-secondary",   bg: "bg-accent/20",   label: t("admin.status_refunded") },
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/bookings${filter !== "all" ? `?status=${filter}` : ""}`)
      .then((r) => r.json())
      .then((data) => { setBookings(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setUpdating(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    setSelectedBooking((prev) => (prev?.id === id ? { ...prev, status } : prev));
    setUpdating(null);
  }

  return (
    <div className="px-4 py-5 pb-6">
      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-dark/[0.04] p-1 rounded-xl">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key);
              const params = new URLSearchParams(searchParams.toString());
              if (key === "all") params.delete("filter");
              else params.set("filter", key);
              router.replace(`?${params.toString()}`, { scroll: false });
            }}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
              filter === key ? "bg-light text-dark shadow-sm" : "text-dark/45"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-dark/[0.03] space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle size={32} className="text-dark/20 mb-3" />
          <p className="text-sm text-dark/40">{t("admin.no_bookings")}</p>
        </div>
      ) : (
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {bookings.map((booking) => {
            const cfg = STATUS_CONFIG[booking.status];
            const StatusIcon = cfg.icon;

            return (
              <motion.div
                key={booking.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="rounded-2xl bg-dark/[0.03] overflow-hidden"
              >
                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full p-4 text-start"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark truncate">
                        {booking.customer_name ?? t("admin.customer")}
                      </p>
                      <p className="text-xs text-dark/50 mt-0.5 truncate">
                        {booking.service_name ?? (booking.cart_items?.[0]?.name ?? "—")}
                        {booking.package_name ? ` · ${booking.package_name}` : ""}
                      </p>
                      <p className="text-xs text-dark/35 mt-0.5">
                        {new Date(booking.scheduled_at).toLocaleDateString("en-OM", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium", cfg.bg, cfg.color)}>
                        <StatusIcon size={10} />
                        {cfg.label}
                      </span>
                      <ChevronRight size={14} className={cn("text-dark/25", isRTL && "rotate-180")} />
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedBooking && (() => {
          const b = selectedBooking;
          const cfg = STATUS_CONFIG[b.status];
          const StatusIcon = cfg.icon;
          const items = b.cart_items ?? [];

          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="booking-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedBooking(null)}
                className="fixed inset-0 z-[59] bg-dark/40"
              />

              {/* Sheet */}
              <motion.div
                key="booking-sheet"
                initial={{ x: isRTL ? "-100%" : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? "-100%" : "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className={cn(
                  "fixed top-0 bottom-0 z-[60] w-full max-w-[360px] bg-light shadow-2xl flex flex-col",
                  isRTL ? "left-0" : "right-0"
                )}
                dir={isRTL ? "rtl" : "ltr"}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-dark/8 shrink-0">
                  <p className="text-base font-bold text-dark">
                    {b.customer_name ?? t("admin.customer")}
                  </p>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark/8 transition-colors"
                  >
                    <X size={16} className="text-dark/50" />
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                  {/* Status + date */}
                  <div className="flex items-center justify-between">
                    <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                    <span className="text-xs text-dark/45">
                      {new Date(b.scheduled_at).toLocaleDateString("en-OM", {
                        weekday: "short", month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Customer info */}
                  {b.customer_email && (
                    <p className="text-xs text-dark/50">{b.customer_email}</p>
                  )}

                  {/* Service · Package */}
                  {(b.service_name || b.package_name) && (
                    <p className="text-sm font-medium text-dark">
                      {b.service_name ?? ""}
                      {b.service_name && b.package_name ? " · " : ""}
                      {b.package_name ?? ""}
                    </p>
                  )}

                  {/* Cart items table */}
                  {items.length > 0 && (
                    <div className="border border-dark/8 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-semibold text-dark/40 uppercase px-3 py-2 bg-dark/[0.03] gap-3">
                        <span>{t("profile.service")}</span>
                        <span className="text-center">{t("profile.qty")}</span>
                        <span className="text-end">{t("profile.price")}</span>
                      </div>
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[1fr_auto_auto] items-center px-3 py-2.5 gap-3 border-t border-dark/6"
                        >
                          <span className="text-xs text-dark leading-snug">
                            {isRTL && item.name_ar ? item.name_ar : item.name}
                          </span>
                          <span className="text-xs text-dark/50 text-center">{item.qty}</span>
                          <span className="text-xs font-semibold text-dark text-end tabular-nums">
                            {item.line_total} OMR
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  {b.total_amount != null && (
                    <div className="flex justify-between items-center px-3 py-2.5 bg-primary/6 rounded-xl">
                      <span className="text-sm font-semibold text-dark">{t("profile.total")}</span>
                      <span className="text-sm font-bold text-primary tabular-nums">{b.total_amount} OMR</span>
                    </div>
                  )}

                  {/* Notes */}
                  {b.notes && (
                    <div className="bg-dark/[0.03] rounded-xl px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-dark/40 uppercase mb-1">Notes</p>
                      <p className="text-xs text-dark/60">{b.notes}</p>
                    </div>
                  )}

                  {/* Booking ID + Payment Reference */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-dark/30">
                      {t("profile.bookingId")}: <span className="font-mono">{b.id.slice(0, 8).toUpperCase()}</span>
                    </p>
                    {b.payment_reference && (
                      <p className="text-[10px] text-dark/30">
                        {t("admin.payment_ref")}: <span className="font-mono text-dark/50">{b.payment_reference}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Approve / Reject (pending only) */}
                {b.status === "pending" && (
                  <div className="px-5 py-4 border-t border-dark/8 flex gap-2 shrink-0">
                    <button
                      disabled={updating === b.id}
                      onClick={() => updateStatus(b.id, "approved")}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {t("admin.booking_approve")}
                    </button>
                    <button
                      disabled={updating === b.id}
                      onClick={() => updateStatus(b.id, "rejected")}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {t("admin.booking_reject")}
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

export default function BookingsTab() {
  return (
    <Suspense>
      <BookingsTabInner />
    </Suspense>
  );
}
