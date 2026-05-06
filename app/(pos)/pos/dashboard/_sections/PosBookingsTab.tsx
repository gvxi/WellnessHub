"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Info, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiBooking, EmployeePermissions } from "@/lib/supabase/types";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

interface Props {
  permissions: EmployeePermissions;
}

const STATUS_CONFIG = {
  pending:  { icon: Clock,        color: "text-amber-500",  bg: "bg-amber-50",  label: "Pending" },
  approved: { icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50", label: "Approved" },
  rejected: { icon: XCircle,      color: "text-red-500",    bg: "bg-red-50",    label: "Rejected" },
  refunded: { icon: AlertCircle,  color: "text-purple-500", bg: "bg-purple-50", label: "Refunded" },
};

export default function PosBookingsTab({ permissions }: Props) {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos/bookings?status=${filter}`);
      if (res.ok) setBookings(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Client-side search filter on name/email/phone
  const visible = search.trim()
    ? bookings.filter((b) => {
        const q = search.toLowerCase();
        return (
          b.customer_name?.toLowerCase().includes(q) ||
          b.customer_email?.toLowerCase().includes(q)
        );
      })
    : bookings;

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setActing(id);
    try {
      await fetch(`/api/pos/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setActing(null);
    }
  }

  const FILTERS: { id: FilterStatus; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    ...(permissions.show_rejected_bookings ? [{ id: "rejected" as FilterStatus, label: "Rejected" }] : []),
  ];

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4 md:px-6">
      {/* Delay banner */}
      {permissions.booking_delay_minutes > 0 && (
        <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
          <Info size={12} className="flex-none" />
          Showing bookings from {permissions.booking_delay_minutes}+ minutes ago
        </div>
      )}

      {/* Customer search */}
      <div className="relative mt-4 mb-1">
        <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-dark/35 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
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

      {/* Bookings grid */}
      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="pt-12 text-center text-sm text-dark/35">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="pt-16 text-center text-sm text-dark/30">No bookings found</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((b) => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const isExpanded = expanded === b.id;

              return (
                <motion.div
                  key={b.id}
                  layout
                  className="bg-white rounded-2xl shadow-sm border border-dark/6 overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : b.id)}
                    className="w-full text-start px-4 pt-4 pb-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-dark truncate">
                          {b.customer_name ?? "Customer"}
                        </p>
                        <p className="text-xs text-dark/40 truncate">
                          {b.customer_email ?? "—"}
                        </p>
                      </div>
                      <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-none", cfg.bg, cfg.color)}>
                        <Icon size={9} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-dark/55 truncate">
                      {b.service_name ?? "—"}{b.package_name ? ` · ${b.package_name}` : ""}
                    </p>
                    <p className="text-[10px] text-dark/30 mt-1">
                      {new Date(b.scheduled_at).toLocaleString()}
                    </p>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-dark/6 px-4 py-3 space-y-3"
                    >
                      {b.cart_items && b.cart_items.length > 0 && (
                        <div className="space-y-1">
                          {b.cart_items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-dark/60">{item.name} × {item.qty}</span>
                              <span className="text-dark/80 font-medium">{item.line_total} {item.currency}</span>
                            </div>
                          ))}
                          {b.total_amount != null && (
                            <div className="flex justify-between text-xs font-semibold text-dark border-t border-dark/8 pt-1 mt-1">
                              <span>Total</span>
                              <span>{b.total_amount} OMR</span>
                            </div>
                          )}
                        </div>
                      )}

                      {b.notes && (
                        <p className="text-xs text-dark/50 bg-dark/4 rounded-lg px-2.5 py-2">
                          {b.notes}
                        </p>
                      )}

                      {/* Actions */}
                      {b.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            disabled={acting === b.id}
                            onClick={() => updateStatus(b.id, "approved")}
                            className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {acting === b.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                            Approve
                          </button>
                          <button
                            disabled={acting === b.id}
                            onClick={() => updateStatus(b.id, "rejected")}
                            className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <XCircle size={11} />
                            Reject
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
