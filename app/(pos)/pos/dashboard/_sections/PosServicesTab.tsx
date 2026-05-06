"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmployeePermissions } from "@/lib/supabase/types";

type InnerTab = "categories" | "products" | "sections";

interface Props {
  permissions: EmployeePermissions;
}

type CategoryRow = { id: string; name: string; subtitle: string | null; display_order: number };
type ServiceRow = {
  id: string; name: string; description: string | null; group_label: string | null;
  is_active: boolean; category_id: string | null;
  categories: { name: string } | null;
  packages: { id: string; name: string; price: number; currency: string }[];
};
type SectionRow = { id: string; name: string; display_order: number };

export default function PosServicesTab({ permissions }: Props) {
  const [innerTab, setInnerTab] = useState<InnerTab>("categories");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/pos/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  const loadServices = useCallback(async () => {
    const res = await fetch("/api/pos/services");
    if (res.ok) setServices(await res.json());
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCategories(), loadServices()]).finally(() => setLoading(false));
  }, [loadCategories, loadServices]);

  async function toggleServiceActive(service: ServiceRow) {
    if (!permissions.can_edit_services) return;
    setTogglingId(service.id);
    try {
      await fetch(`/api/pos/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      await loadServices();
    } finally {
      setTogglingId(null);
    }
  }

  const INNER_TABS: { id: InnerTab; label: string }[] = [
    { id: "categories", label: "Categories" },
    { id: "products",   label: "Products" },
  ];

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4 md:px-6">
      {/* Mini-tabs */}
      <div className="flex gap-1 pt-4 pb-3">
        {INNER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setInnerTab(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
              innerTab === tab.id
                ? "bg-primary text-light"
                : "bg-dark/6 text-dark/55 hover:bg-dark/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="pt-12 text-center text-sm text-dark/35">Loading…</div>
        ) : innerTab === "categories" ? (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl px-4 py-3.5 border border-dark/6 shadow-sm">
                <p className="text-sm font-semibold text-dark">{cat.name}</p>
                {cat.subtitle && <p className="text-xs text-dark/40 mt-0.5">{cat.subtitle}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((svc) => (
              <div key={svc.id} className="bg-white rounded-2xl border border-dark/6 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", !svc.is_active && "text-dark/35")}>
                      {svc.name}
                    </p>
                    <p className="text-xs text-dark/35 truncate">
                      {svc.categories?.name ?? "—"}
                      {svc.group_label ? ` · ${svc.group_label}` : ""}
                    </p>
                  </div>

                  {permissions.can_edit_services && (
                    <button
                      onClick={() => toggleServiceActive(svc)}
                      disabled={togglingId === svc.id}
                      className="flex-none p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors disabled:opacity-40"
                    >
                      {svc.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  )}
                </div>

                {svc.packages.length > 0 && (
                  <div className="border-t border-dark/6 px-4 py-2 flex flex-wrap gap-1.5">
                    {svc.packages.map((pkg) => (
                      <span key={pkg.id} className="text-[10px] bg-secondary/8 text-secondary font-medium px-2 py-0.5 rounded-full">
                        {pkg.name} · {pkg.price} {pkg.currency}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
