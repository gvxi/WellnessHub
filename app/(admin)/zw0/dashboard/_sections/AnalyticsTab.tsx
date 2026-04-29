"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiAnalytics } from "@/lib/supabase/types";

const STAT_CARDS = (a: ApiAnalytics) => [
  { label: "Total Bookings", value: a.total, icon: TrendingUp, color: "text-secondary bg-secondary/10" },
  { label: "Pending", value: a.pending, icon: Clock, color: "text-amber-500 bg-amber-50" },
  { label: "Approved", value: a.approved, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  { label: "Rejected", value: a.rejected, icon: XCircle, color: "text-red-500 bg-red-50" },
];

export default function AnalyticsTab() {
  const [data, setData] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 py-5 pb-6">
      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {STAT_CARDS(data).map(({ label, value, icon: Icon, color }) => (
            <motion.div
              key={label}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
              className="p-4 rounded-2xl bg-dark/[0.03]"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                <Icon size={15} />
              </div>
              <p className="text-2xl font-bold text-dark tabular-nums">{value}</p>
              <p className="text-[11px] text-dark/45 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      {/* Top services */}
      {!loading && data && data.top_services.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-secondary mb-3">
            Top Services
          </p>
          <div className="space-y-2">
            {data.top_services.map(({ service_name, count }, i) => {
              const max = data.top_services[0].count;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={service_name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-dark/70 truncate">{service_name}</span>
                    <span className="text-dark font-semibold tabular-nums ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 bg-dark/8 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                      className="h-full bg-secondary rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && data && data.total === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <TrendingUp size={32} className="text-dark/20 mb-3" />
          <p className="text-sm text-dark/40">No data yet</p>
          <p className="text-xs text-dark/30 mt-1">Stats will appear once bookings come in</p>
        </div>
      )}
    </div>
  );
}
