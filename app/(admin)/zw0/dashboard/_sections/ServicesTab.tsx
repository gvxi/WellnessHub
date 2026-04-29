"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, Edit2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ServiceRow = {
  id: string;
  name: string;
  group_label: string | null;
  is_active: boolean;
  display_order: number;
  category_id: string | null;
  categories: { name: string } | null;
  packages: { id: string; name: string; price: number; currency: string }[];
};

type CategoryRow = {
  id: string;
  name: string;
  subtitle: string | null;
  unsplash_id: string | null;
  slug: string | null;
  display_order: number;
};

type InnerTab = "categories" | "products";

export default function ServicesTab() {
  const [innerTab, setInnerTab] = useState<InnerTab>("categories");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSvc, setExpandedSvc] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/services").then((r) => r.json()),
    ]).then(([cats, svcs]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setServices(Array.isArray(svcs) ? svcs : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Group services by category then group_label
  const grouped = categories.map((cat) => {
    const catServices = services.filter((s) => s.category_id === cat.id);
    const groupMap = new Map<string, ServiceRow[]>();
    for (const svc of catServices) {
      const lbl = svc.group_label ?? "Other";
      if (!groupMap.has(lbl)) groupMap.set(lbl, []);
      groupMap.get(lbl)!.push(svc);
    }
    return { cat, groups: Array.from(groupMap.entries()) };
  });

  return (
    <div className="pb-6">
      {/* Inner tab switcher */}
      <div className="flex gap-1 mx-4 mt-5 mb-4 bg-dark/[0.04] p-1 rounded-xl">
        {(["categories", "products"] as InnerTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setInnerTab(t)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
              innerTab === t ? "bg-light text-dark shadow-sm" : "text-dark/45"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : innerTab === "categories" ? (
        <div className="px-4 space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="p-4 rounded-2xl bg-dark/[0.03] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-dark">{cat.name}</p>
                {cat.subtitle && <p className="text-xs text-dark/45 mt-0.5">{cat.subtitle}</p>}
              </div>
              <button className="w-7 h-7 rounded-lg bg-dark/5 flex items-center justify-center">
                <Edit2 size={13} className="text-dark/50" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-5">
          {grouped.map(({ cat, groups }) => (
            <div key={cat.id}>
              <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-secondary mb-2">
                {cat.name}
              </p>
              {groups.map(([label, svcs]) => (
                <div key={label} className="mb-3">
                  <p className="text-[11px] text-dark/40 font-medium px-1 mb-1">{label}</p>
                  <div className="space-y-1">
                    {svcs.map((svc) => (
                      <div key={svc.id} className="rounded-xl bg-dark/[0.03] overflow-hidden">
                        <button
                          onClick={() => setExpandedSvc(expandedSvc === svc.id ? null : svc.id)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", svc.is_active ? "bg-emerald-400" : "bg-dark/20")} />
                            <span className="text-sm text-dark truncate">{svc.name}</span>
                            <span className="text-xs text-dark/35 shrink-0">{svc.packages?.length ?? 0} pkg</span>
                          </div>
                          {expandedSvc === svc.id ? (
                            <ChevronDown size={14} className="text-dark/30 shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-dark/30 shrink-0" />
                          )}
                        </button>

                        {expandedSvc === svc.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 pb-3 space-y-1 border-t border-dark/5"
                          >
                            {(svc.packages ?? []).map((pkg) => (
                              <div key={pkg.id} className="flex justify-between items-center py-1">
                                <span className="text-xs text-dark/60">{pkg.name}</span>
                                <span className="text-xs font-semibold text-dark tabular-nums">
                                  {pkg.price} {pkg.currency}
                                </span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
