"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiBooking, EmployeePermissions, Translations } from "@/lib/supabase/types";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

interface Props {
  permissions: EmployeePermissions;
}

const REASON_PRESETS = ["reason_paid_desk", "reason_walk_in", "reason_staff_override", "reason_other"] as const;

function translated(name: string, translations: Translations | null | undefined, isRTL: boolean): string {
  if (isRTL && translations?.ar?.name) return translations.ar.name;
  return name;
}

function StatusBadge({ status, t }: { status: ApiBooking["status"]; t: (k: string) => string }) {
  const cfg = {
    pending:  { icon: Clock,        color: "text-amber-500",   bg: "bg-amber-50"   },
    approved: { icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50" },
    rejected: { icon: XCircle,      color: "text-red-500",     bg: "bg-red-50"     },
    refunded: { icon: AlertCircle,  color: "text-purple-500",  bg: "bg-purple-50"  },
  }[status] ?? { icon: Clock, color: "text-amber-500", bg: "bg-amber-50" };
  const Icon = cfg.icon;
  return (
    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-none", cfg.bg, cfg.color)}>
      <Icon size={9} />
      {t(`pos.status_${status}`)}
    </span>
  );
}

export default function PosBookingsTab({ permissions }: Props) {
  const { t, isRTL } = useLang();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<ApiBooking | null>(null);
  const [acting, setActing] = useState(false);
  const [actionMode, setActionMode] = useState<"approve" | "reject" | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/bookings?status=${filter}`);
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const visible = search.trim()
    ? bookings.filter((b) => {
        const q = search.toLowerCase();
        return (
          b.customer_name?.toLowerCase().includes(q) ||
          b.customer_email?.toLowerCase().includes(q) ||
          b.customer_phone?.includes(search.trim())
        );
      })
    : bookings;

  function openBooking(b: ApiBooking) {
    setSelectedBooking(b);
    setActionMode(null);
    setSelectedReason("");
    setCustomReason("");
  }

  function closePopup() {
    setSelectedBooking(null);
    setActionMode(null);
    setSelectedReason("");
    setCustomReason("");
  }

  async function confirmAction() {
    if (!selectedBooking || !actionMode) return;
    const reason = selectedReason === "reason_other"
      ? customReason
      : selectedReason ? t(`pos.${selectedReason}`) : "";
    setActing(true);
    try {
      await fetch(`/api/pos/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: actionMode === "approve" ? "approved" : "rejected", reason }),
      });
      await load();
      closePopup();
    } finally {
      setActing(false);
    }
  }

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: "all",      label: t("pos.filter_all") },
    { id: "pending",  label: t("pos.filter_pending") },
    { id: "approved", label: t("pos.filter_approved") },
    ...(permissions.show_rejected_bookings ? [{ id: "rejected" as FilterStatus, label: t("pos.filter_rejected") }] : []),
  ];

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto px-4 md:px-6">
      {/* Search */}
      <div className="relative mt-4 mb-1">
        <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-dark/35 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("pos.search_placeholder")}
          className="w-full bg-dark/5 rounded-xl ps-8 pe-8 py-2.5 text-sm text-dark outline-none placeholder:text-dark/30"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute inset-y-0 end-3 flex items-center text-dark/35">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 pt-3 pb-3 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex-none px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filter === f.id
                ? "bg-primary text-light"
                : "bg-dark/6 text-dark/55 hover:bg-dark/10"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-6 space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        ) : visible.length === 0 ? (
          <div className="pt-16 text-center text-sm text-dark/30">{t("pos.no_bookings")}</div>
        ) : (
          visible.map((b) => {
            const svcName = translated(b.service_name ?? "", b.service_translations, isRTL) || b.service_name;
            const pkgName = b.package_name
              ? (translated(b.package_name, b.package_translations, isRTL) || b.package_name)
              : null;
            return (
              <button
                key={b.id}
                onClick={() => openBooking(b)}
                className="w-full bg-white rounded-2xl shadow-sm border border-dark/6 overflow-hidden text-start px-4 py-3.5 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark truncate">
                    {b.customer_name ?? "Customer"}
                  </p>
                  <p className="text-xs text-dark/40 truncate">
                    {svcName ?? "—"}{pkgName ? ` · ${pkgName}` : ""}
                  </p>
                  <p className="text-[10px] text-dark/30 mt-0.5">
                    {new Date(b.scheduled_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={b.status} t={t} />
              </button>
            );
          })
        )}
      </div>

      {/* Booking detail popup */}
      <AnimatePresence>
        {selectedBooking && (
          <>
            <motion.div
              key="bd-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closePopup}
              className="fixed inset-0 z-[70] bg-dark/50 backdrop-blur-sm"
            />
            <motion.div
              key="bd-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed bottom-0 inset-x-0 z-[80] bg-light rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Handle + header */}
              <div className="flex-none px-5 pt-4 pb-4 border-b border-dark/8">
                <div className="w-10 h-1 rounded-full bg-dark/15 mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-dark">{t("pos.booking_details")}</h2>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedBooking.status} t={t} />
                    <button
                      onClick={closePopup}
                      className="w-8 h-8 rounded-full bg-dark/6 flex items-center justify-center"
                    >
                      <X size={14} className="text-dark/60" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Customer info */}
                <div className="bg-dark/4 rounded-2xl px-4 py-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-dark/40 font-semibold">{t("pos.customer")}</p>
                  <p className="text-sm font-semibold text-dark">{selectedBooking.customer_name ?? "—"}</p>
                  {selectedBooking.customer_email && (
                    <p className="text-xs text-dark/50">{selectedBooking.customer_email}</p>
                  )}
                  {selectedBooking.customer_phone && (
                    <p className="text-xs text-dark/50">{selectedBooking.customer_phone}</p>
                  )}
                </div>

                {/* Service + scheduled */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-dark/4 rounded-2xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-dark/40 font-semibold mb-1">{t("pos.service")}</p>
                    <p className="text-xs font-medium text-dark">
                      {translated(selectedBooking.service_name ?? "—", selectedBooking.service_translations, isRTL) || selectedBooking.service_name || "—"}
                    </p>
                    {selectedBooking.package_name && (
                      <p className="text-[10px] text-dark/50 mt-0.5">
                        {translated(selectedBooking.package_name, selectedBooking.package_translations, isRTL) || selectedBooking.package_name}
                      </p>
                    )}
                  </div>
                  <div className="bg-dark/4 rounded-2xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-dark/40 font-semibold mb-1">{t("pos.scheduled")}</p>
                    <p className="text-xs font-medium text-dark">
                      {new Date(selectedBooking.scheduled_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-dark/50 mt-0.5">
                      {new Date(selectedBooking.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Cart items */}
                {selectedBooking.cart_items && selectedBooking.cart_items.length > 0 && (
                  <div className="bg-dark/4 rounded-2xl px-4 py-3 space-y-1.5">
                    {selectedBooking.cart_items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-dark/60">
                          {isRTL && item.name_ar ? item.name_ar : item.name} × {item.qty}
                        </span>
                        <span className="text-dark/80 font-medium">{item.line_total} {item.currency}</span>
                      </div>
                    ))}
                    {selectedBooking.total_amount != null && (
                      <div className="flex justify-between text-xs font-semibold text-dark border-t border-dark/8 pt-1.5 mt-1">
                        <span>{t("pos.total")}</span>
                        <span>{selectedBooking.total_amount} OMR</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="bg-dark/4 rounded-2xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-dark/40 font-semibold mb-1">{t("pos.notes")}</p>
                    <p className="text-xs text-dark/60">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Payment ref */}
                {selectedBooking.payment_reference && (
                  <div className="bg-dark/4 rounded-2xl px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-dark/40 font-semibold mb-1">{t("pos.payment_ref")}</p>
                    <p className="text-xs font-mono text-dark/60">{selectedBooking.payment_reference}</p>
                  </div>
                )}

                {/* Actions */}
                {permissions.can_manage_bookings && selectedBooking.status === "pending" && (
                  <div className="space-y-2">
                    {!actionMode ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActionMode("approve")}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={11} />
                          {t("pos.approve")}
                        </button>
                        <button
                          onClick={() => setActionMode("reject")}
                          className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <XCircle size={11} />
                          {t("pos.reject")}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-dark/55">{t("pos.reason_label")}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {REASON_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              onClick={() => setSelectedReason(preset)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                selectedReason === preset
                                  ? "bg-primary text-light"
                                  : "bg-dark/6 text-dark/60 hover:bg-dark/10"
                              )}
                            >
                              {t(`pos.${preset}`)}
                            </button>
                          ))}
                        </div>
                        {selectedReason === "reason_other" && (
                          <input
                            className="w-full bg-dark/5 rounded-xl px-3 py-2 text-sm text-dark outline-none"
                            placeholder={t("pos.reason_placeholder")}
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                          />
                        )}
                        <div className="flex gap-2">
                          <button
                            disabled={acting || !selectedReason}
                            onClick={confirmAction}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1",
                              actionMode === "approve" ? "bg-emerald-500" : "bg-red-500"
                            )}
                          >
                            {acting
                              ? <Loader2 size={11} className="animate-spin" />
                              : actionMode === "approve" ? <CheckCircle size={11} /> : <XCircle size={11} />
                            }
                            {t("pos.confirm")}
                          </button>
                          <button
                            onClick={() => { setActionMode(null); setSelectedReason(""); setCustomReason(""); }}
                            className="px-4 py-2.5 rounded-xl bg-dark/6 text-dark/55 text-xs font-medium"
                          >
                            {t("pos.cancel")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer close button */}
              <div className="flex-none px-5 pb-8 pt-3 border-t border-dark/8">
                <button
                  onClick={closePopup}
                  className="w-full py-3 rounded-2xl bg-dark/6 text-dark/60 text-sm font-semibold"
                >
                  {t("pos.close")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
