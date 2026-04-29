"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ApiBooking } from "@/lib/supabase/types";

type Filter = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Pending" },
  approved: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Rejected" },
  refunded: { icon: XCircle, color: "text-secondary", bg: "bg-accent/20", label: "Refunded" },
};

export default function BookingsTab() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

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
    setExpanded(null);
    setUpdating(null);
  }

  return (
    <div className="px-4 py-5 pb-6">
      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-dark/[0.04] p-1 rounded-xl">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
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
          <p className="text-sm text-dark/40">No bookings yet</p>
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
            const isExpanded = expanded === booking.id;

            return (
              <motion.div
                key={booking.id}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="rounded-2xl bg-dark/[0.03] overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : booking.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark truncate">
                        {booking.customer_name ?? "Customer"}
                      </p>
                      <p className="text-xs text-dark/50 mt-0.5 truncate">
                        {booking.service_name ?? "—"}{booking.package_name ? ` · ${booking.package_name}` : ""}
                      </p>
                      <p className="text-xs text-dark/35 mt-0.5">
                        {new Date(booking.scheduled_at).toLocaleDateString("en-OM", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium shrink-0", cfg.bg, cfg.color)}>
                      <StatusIcon size={10} />
                      {cfg.label}
                    </span>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && booking.status === "pending" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 flex gap-2">
                        <button
                          disabled={updating === booking.id}
                          onClick={() => updateStatus(booking.id, "approved")}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={updating === booking.id}
                          onClick={() => updateStatus(booking.id, "rejected")}
                          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
