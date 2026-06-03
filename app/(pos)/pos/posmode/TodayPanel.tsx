"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle, Clock, Loader2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { ApiBooking } from "@/lib/supabase/types";

const SPRING = { type: "spring" as const, stiffness: 340, damping: 34 };

const STATUS_CFG = {
  approved: { icon: CheckCircle,  cls: "text-emerald-600 bg-emerald-50" },
  rejected: { icon: XCircle,      cls: "text-red-500 bg-red-50" },
  pending:  { icon: Clock,        cls: "text-amber-500 bg-amber-50" },
  refunded: { icon: XCircle,      cls: "text-secondary bg-accent/20" },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TodayPanel({ open, onClose }: Props) {
  const { t, isRTL } = useLang();
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/pos/bookings?today_mine=1&status=all")
      .then(r => r.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [open]);

  const totalRevenue = bookings
    .filter(b => b.status === "approved")
    .reduce((s, b) => s + (b.total_amount ?? 0), 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="today-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-dark/40 backdrop-blur-sm"
          />
          <motion.div
            key="today-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={SPRING}
            className="fixed inset-x-0 bottom-0 z-[71] bg-light rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: "80vh" }}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Handle */}
            <div className="flex-none flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-dark/15" />
            </div>

            {/* Header */}
            <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-dark/6">
              <div>
                <h2 className="text-sm font-bold text-dark">{t("pos.today_bookings")}</h2>
                {!loading && bookings.length > 0 && (
                  <p className="text-[11px] text-dark/40 mt-0.5">
                    {bookings.length} {t("pos.items_label")} · {totalRevenue.toFixed(3)} OMR
                  </p>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-dark/5 flex items-center justify-center text-dark/50 hover:text-dark/80 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={22} className="text-dark/20 animate-spin" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <CalendarDays size={32} className="text-dark/15 mb-3" />
                  <p className="text-sm text-dark/35">{t("pos.today_empty")}</p>
                </div>
              ) : (
                bookings.map(b => {
                  const cfg = STATUS_CFG[b.status] ?? STATUS_CFG.pending;
                  const StatusIcon = cfg.icon;
                  const time = new Date(b.created_at).toLocaleTimeString("en-OM", { hour: "2-digit", minute: "2-digit" });
                  const name = b.customer_name ?? "—";
                  const itemCount = b.cart_items?.reduce((s, i) => s + i.qty, 0) ?? 0;

                  return (
                    <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl bg-dark/[0.03]">
                      <span className={cn("flex-none w-8 h-8 rounded-xl flex items-center justify-center", cfg.cls)}>
                        <StatusIcon size={15} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark truncate">{name}</p>
                        <p className="text-[11px] text-dark/40">
                          {itemCount} {t("pos.items_label")} · {b.payment_method ?? "—"}
                        </p>
                      </div>
                      <div className="flex-none text-end">
                        <p className="text-sm font-bold text-dark tabular-nums">{(b.total_amount ?? 0).toFixed(3)}</p>
                        <p className="text-[10px] text-dark/35 tabular-nums">{time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
