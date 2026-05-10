"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Eye, EyeOff, X, Edit2, Plus, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { resolveImage } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import { Skeleton } from "@/components/ui/skeleton";
import EditSheet, { type FieldDef } from "@/app/(admin)/zw0/dashboard/_components/EditSheet";
import ConfirmSheet from "@/app/(admin)/zw0/dashboard/_components/ConfirmSheet";
import { PACKAGE_ICONS } from "@/lib/package-icons";
import type { EmployeePermissions, Translations } from "@/lib/supabase/types";

type InnerTab = "categories" | "products";

interface Props {
  permissions: EmployeePermissions;
}

type CategoryRow = {
  id: string;
  name: string;
  subtitle: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  display_order: number;
  translations: Translations;
};

type PackageRow = {
  id: string;
  name: string;
  price: number;
  currency: string;
  icon: string | null;
  is_active: boolean;
  translations: Translations;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  group_label: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  is_active: boolean;
  category_id: string | null;
  translations: Translations;
  categories: { name: string; translations: Translations } | null;
  packages: PackageRow[];
};

type SortKey = "name" | "order";
type ActiveFilter = "all" | "active" | "hidden";

type EditTarget =
  | { kind: "cat"; item: CategoryRow }
  | { kind: "addCat" }
  | { kind: "svc"; item: ServiceRow }
  | { kind: "addSvc" }
  | { kind: "pkg"; pkg: PackageRow; svcId: string }
  | { kind: "addPkg"; svcId: string };

type DeleteTarget =
  | { kind: "cat"; id: string; name: string }
  | { kind: "svc"; id: string; name: string }
  | { kind: "pkg"; id: string; svcId: string; name: string };

const CAT_FIELDS: FieldDef[] = [
  { key: "name",        label: "Name",                required: true, placeholder: "e.g. Fitness & Dance", translatable: true },
  { key: "subtitle",    label: "Subtitle",                            placeholder: "e.g. Classes for every level", translatable: true },
  { key: "image_url",   label: "Banner Image",        type: "image",  uploadFolder: "categories" },
  { key: "unsplash_id", label: "Unsplash Fallback ID",                placeholder: "e.g. photo-1581009146145" },
];

const SVC_FIELDS = (cats: CategoryRow[]): FieldDef[] => [
  { key: "name",        label: "Name",        required: true, placeholder: "e.g. Yoga Beginner", translatable: true },
  { key: "group_label", label: "Section / Group",              placeholder: "e.g. Hair & Skin Care" },
  { key: "description", label: "Description",  type: "textarea", placeholder: "Optional description", translatable: true },
  {
    key: "category_id", label: "Category", type: "select",
    options: cats.map((c) => ({ value: c.id, label: c.name })),
  },
  { key: "image_url",   label: "Service Image", type: "image",  uploadFolder: "services" },
  { key: "unsplash_id", label: "Unsplash Fallback ID",          placeholder: "e.g. photo-1581009146145" },
];

const PKG_FIELDS: FieldDef[] = [
  { key: "name",  label: "Name",        required: true, placeholder: "e.g. Single Session", translatable: true },
  { key: "price", label: "Price (OMR)", type: "number", required: true },
  {
    key: "icon", label: "Icon Badge", type: "select",
    options: [
      { value: "", label: "None" },
      ...Object.entries(PACKAGE_ICONS).map(([k, v]) => ({ value: k, label: `${v.emoji} ${v.label}` })),
    ],
  },
];

function arValues(translations: Translations | null | undefined, keys: string[]): Record<string, string> {
  const ar = translations?.ar ?? {};
  const out: Record<string, string> = {};
  for (const k of keys) out[`${k}_ar`] = ar[k] ?? "";
  return out;
}

function buildTranslations(values: Record<string, string>, keys: string[]): Translations {
  const ar: Record<string, string> = {};
  for (const k of keys) {
    const v = values[`${k}_ar`];
    if (v?.trim()) ar[k] = v.trim();
  }
  return Object.keys(ar).length ? { ar } : {} as Translations;
}

function translated(name: string, translations: Translations | null | undefined, isRTL: boolean): string {
  if (isRTL && translations?.ar?.name) return translations.ar.name;
  return name;
}

export default function PosServicesTab({ permissions }: Props) {
  const { t, isRTL } = useLang();
  const canEdit = permissions.tab_services === "enabled";
  const ChevronInline = isRTL ? ChevronLeft : ChevronRight;

  const [innerTab, setInnerTab] = useState<InnerTab>("categories");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [expandedSvc, setExpandedSvc] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, svcsRes] = await Promise.all([
        fetch("/api/pos/categories"),
        fetch("/api/pos/services"),
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (svcsRes.ok) setServices(await svcsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveCat(values: Record<string, string>) {
    const { name, subtitle, image_url, unsplash_id } = values;
    const translations = buildTranslations(values, ["name", "subtitle"]);
    const payload = { name, subtitle, image_url, unsplash_id, translations };

    if (editing?.kind === "cat") {
      const res = await fetch(`/api/pos/categories/${editing.item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => c.id === editing.item.id ? { ...c, ...updated } : c));
    } else {
      const res = await fetch("/api/pos/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, display_order: categories.length }),
      });
      const created = await res.json();
      setCategories((prev) => [...prev, created]);
    }
  }

  async function deleteCat() {
    if (deleting?.kind !== "cat") return;
    await fetch(`/api/pos/categories/${deleting.id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
    setServices((prev) => prev.filter((s) => s.category_id !== deleting.id));
  }

  async function toggleServiceActive(svc: ServiceRow) {
    if (!canEdit) return;
    setTogglingId(svc.id);
    try {
      await fetch(`/api/pos/services/${svc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !svc.is_active }),
      });
      setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, is_active: !s.is_active } : s));
    } finally {
      setTogglingId(null);
    }
  }

  async function saveSvc(values: Record<string, string>) {
    const { name, group_label, description, category_id, image_url, unsplash_id } = values;
    const translations = buildTranslations(values, ["name", "description"]);
    const payload = { name, group_label, description, category_id, image_url, unsplash_id, translations };

    if (editing?.kind === "svc") {
      const res = await fetch(`/api/pos/services/${editing.item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setServices((prev) => prev.map((s) => s.id === editing.item.id ? { ...s, ...updated } : s));
    } else {
      const res = await fetch("/api/pos/services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, display_order: services.length }),
      });
      const created = await res.json();
      const cat = categories.find((c) => c.id === created.category_id) ?? null;
      setServices((prev) => [...prev, { ...created, categories: cat ? { name: cat.name, translations: cat.translations } : null, packages: [] }]);
    }
  }

  async function deleteSvc() {
    if (deleting?.kind !== "svc") return;
    await fetch(`/api/pos/services/${deleting.id}`, { method: "DELETE" });
    setServices((prev) => prev.filter((s) => s.id !== deleting.id));
  }

  async function savePkg(values: Record<string, string>) {
    const translations = buildTranslations(values, ["name"]);

    if (editing?.kind === "pkg") {
      const { svcId, pkg } = editing;
      const res = await fetch(`/api/pos/packages/${pkg.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, price: Number(values.price), icon: values.icon || null, translations }),
      });
      const updated = await res.json();
      setServices((prev) => prev.map((s) =>
        s.id === svcId ? { ...s, packages: s.packages.map((p) => p.id === pkg.id ? { ...p, ...updated } : p) } : s
      ));
    } else if (editing?.kind === "addPkg") {
      const { svcId } = editing;
      const res = await fetch("/api/pos/packages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: svcId, name: values.name, price: Number(values.price), icon: values.icon || null, translations }),
      });
      const created = await res.json();
      setServices((prev) => prev.map((s) =>
        s.id === svcId ? { ...s, packages: [...(s.packages ?? []), created] } : s
      ));
    }
  }

  async function deletePkg() {
    if (deleting?.kind !== "pkg") return;
    await fetch(`/api/pos/packages/${deleting.id}`, { method: "DELETE" });
    setServices((prev) => prev.map((s) =>
      s.id === deleting.svcId ? { ...s, packages: s.packages.filter((p) => p.id !== deleting.id) } : s
    ));
  }

  async function handleDelete() {
    if (deleting?.kind === "cat") return deleteCat();
    if (deleting?.kind === "svc") return deleteSvc();
    if (deleting?.kind === "pkg") return deletePkg();
  }

  function editFields(): FieldDef[] {
    if (!editing) return [];
    if (editing.kind === "cat" || editing.kind === "addCat") return CAT_FIELDS;
    if (editing.kind === "svc" || editing.kind === "addSvc") return SVC_FIELDS(categories);
    return PKG_FIELDS;
  }

  function editInitial(): Record<string, string> {
    if (!editing) return {};
    if (editing.kind === "cat") return {
      name: editing.item.name,
      subtitle: editing.item.subtitle ?? "",
      image_url: editing.item.image_url ?? "",
      unsplash_id: editing.item.unsplash_id ?? "",
      ...arValues(editing.item.translations, ["name", "subtitle"]),
    };
    if (editing.kind === "svc") return {
      name: editing.item.name,
      group_label: editing.item.group_label ?? "",
      description: editing.item.description ?? "",
      category_id: editing.item.category_id ?? "",
      image_url: editing.item.image_url ?? "",
      unsplash_id: editing.item.unsplash_id ?? "",
      ...arValues(editing.item.translations, ["name", "description"]),
    };
    if (editing.kind === "pkg") return {
      name: editing.pkg.name,
      price: String(editing.pkg.price),
      icon: editing.pkg.icon ?? "",
      ...arValues(editing.pkg.translations, ["name"]),
    };
    return {};
  }

  function editTitle(): string {
    if (!editing) return "";
    if (editing.kind === "addCat") return t("admin.add_category");
    if (editing.kind === "cat") return t("admin.edit_category");
    if (editing.kind === "addSvc") return t("admin.new_service");
    if (editing.kind === "svc") return t("admin.edit_service");
    if (editing.kind === "addPkg") return t("admin.add_package");
    return t("admin.edit_package");
  }

  function editDeleteHandler(): (() => void) | undefined {
    if (editing?.kind === "cat") return () => setDeleting({ kind: "cat", id: editing.item.id, name: editing.item.name });
    if (editing?.kind === "svc") return () => setDeleting({ kind: "svc", id: editing.item.id, name: editing.item.name });
    if (editing?.kind === "pkg") return () => setDeleting({ kind: "pkg", id: editing.pkg.id, svcId: editing.svcId, name: editing.pkg.name });
    return undefined;
  }

  // Filtered + sorted services
  const filteredServices = services
    .filter((svc) => {
      if (catFilter !== "all" && svc.category_id !== catFilter) return false;
      if (activeFilter === "active" && !svc.is_active) return false;
      if (activeFilter === "hidden" && svc.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameAr = svc.translations?.ar?.name ?? "";
        return svc.name.toLowerCase().includes(q) || nameAr.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : 0);

  const INNER_TABS: { id: InnerTab; label: string }[] = [
    { id: "categories", label: t("pos.tab_categories") },
    { id: "products",   label: t("pos.tab_products") },
  ];

  const ACTIVE_FILTERS: { id: ActiveFilter; label: string }[] = [
    { id: "all",    label: t("pos.filter_all") },
    { id: "active", label: t("pos.filter_active") },
    { id: "hidden", label: t("pos.filter_inactive") },
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

      {/* Products controls */}
      {innerTab === "products" && (
        <div className="space-y-2 pb-2">
          {canEdit && (
            <button
              onClick={() => setEditing({ kind: "addSvc" })}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/4 transition-colors"
            >
              <Plus size={14} />
              {t("admin.add_service")}
            </button>
          )}

          {/* Search */}
          <div className="relative">
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

          {/* Category filter + sort + active filter row */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            <button
              onClick={() => setCatFilter("all")}
              className={cn(
                "flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                catFilter === "all" ? "bg-secondary text-light" : "bg-dark/6 text-dark/55 hover:bg-dark/10"
              )}
            >
              {t("pos.filter_category")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatFilter(catFilter === cat.id ? "all" : cat.id)}
                className={cn(
                  "flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  catFilter === cat.id ? "bg-secondary text-light" : "bg-dark/6 text-dark/55 hover:bg-dark/10"
                )}
              >
                {translated(cat.name, cat.translations, isRTL)}
              </button>
            ))}

            <div className="w-px bg-dark/10 flex-none self-stretch mx-1" />

            <button
              onClick={() => setSort(sort === "order" ? "name" : "order")}
              className="flex-none px-3 py-1.5 rounded-full text-xs font-semibold bg-dark/6 text-dark/55 hover:bg-dark/10 transition-colors"
            >
              {sort === "name" ? t("pos.sort_name") : t("pos.sort_order")}
            </button>

            <div className="w-px bg-dark/10 flex-none self-stretch mx-1" />

            {ACTIVE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  activeFilter === f.id ? "bg-dark/20 text-dark" : "bg-dark/6 text-dark/55 hover:bg-dark/10"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="space-y-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : innerTab === "categories" ? (
          <div className="space-y-2">
            {canEdit && (
              <button
                onClick={() => setEditing({ kind: "addCat" })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/4 transition-colors"
              >
                <Plus size={14} />
                {t("admin.add_category")}
              </button>
            )}
            {categories.map((cat) => {
              const imgUrl = resolveImage(cat.image_url, cat.unsplash_id, 300);
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-dark/6 shadow-sm overflow-hidden flex items-center gap-3 px-3 py-2.5">
                  {imgUrl ? (
                    <img src={imgUrl} alt={cat.name} className="w-12 h-12 rounded-xl object-cover flex-none" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-dark/8 flex-none" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">
                      {translated(cat.name, cat.translations, isRTL)}
                    </p>
                    {cat.subtitle && (
                      <p className="text-xs text-dark/40 truncate mt-0.5">
                        {isRTL && cat.translations?.ar?.subtitle ? cat.translations.ar.subtitle : cat.subtitle}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setEditing({ kind: "cat", item: cat })}
                      className="p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors flex-none"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="pt-16 text-center text-sm text-dark/30">{t("pos.no_results")}</div>
        ) : (
          <div className="space-y-2">
            {filteredServices.map((svc) => {
              const imgUrl = resolveImage(svc.image_url, svc.unsplash_id, 200);
              const displayName = translated(svc.name, svc.translations, isRTL);
              const catName = svc.categories
                ? translated(svc.categories.name, svc.categories.translations, isRTL)
                : null;

              return (
                <div
                  key={svc.id}
                  className={cn(
                    "bg-white rounded-2xl border border-dark/6 shadow-sm overflow-hidden transition-opacity",
                    !svc.is_active && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {/* Thumbnail */}
                    {imgUrl ? (
                      <img src={imgUrl} alt={svc.name} className="w-10 h-10 rounded-lg object-cover flex-none" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-dark/8 flex-none" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dark truncate">{displayName}</p>
                        {!svc.is_active && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-500 uppercase tracking-wide flex-none">
                            {t("pos.visibility_hidden")}
                          </span>
                        )}
                      </div>
                      {catName && (
                        <p className="text-xs text-secondary/70 font-medium truncate">{catName}</p>
                      )}
                      {svc.description && (
                        <p className="text-[10px] text-dark/35 truncate mt-0.5">
                          {isRTL && svc.translations?.ar?.description ? svc.translations.ar.description : svc.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-none">
                      {canEdit && (
                        <button
                          onClick={() => toggleServiceActive(svc)}
                          disabled={togglingId === svc.id}
                          className="p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors disabled:opacity-40"
                        >
                          {svc.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => { setEditing({ kind: "svc", item: svc }); }}
                          className="p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      {svc.packages.length > 0 && (
                        <button
                          onClick={() => setExpandedSvc(expandedSvc === svc.id ? null : svc.id)}
                          className="p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors"
                        >
                          {expandedSvc === svc.id
                            ? <ChevronDown size={14} />
                            : <ChevronInline size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Packages expanded */}
                  {expandedSvc === svc.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-dark/6 px-3 py-2"
                    >
                      {svc.packages.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-dark/60 flex-1 truncate">
                            {pkg.icon && PACKAGE_ICONS[pkg.icon as keyof typeof PACKAGE_ICONS]?.emoji + " "}
                            {translated(pkg.name, pkg.translations, isRTL)}
                          </span>
                          <span className="text-xs font-semibold text-dark tabular-nums me-3">
                            {pkg.price} {pkg.currency}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => setEditing({ kind: "pkg", pkg, svcId: svc.id })}
                              className="w-5 h-5 rounded-md bg-dark/5 flex items-center justify-center"
                            >
                              <Edit2 size={9} className="text-dark/40" />
                            </button>
                          )}
                        </div>
                      ))}
                      {canEdit && (
                        <button
                          onClick={() => setEditing({ kind: "addPkg", svcId: svc.id })}
                          className="mt-1 flex items-center gap-1.5 text-[11px] text-primary font-medium py-1"
                        >
                          <Plus size={11} />
                          {t("admin.add_package")}
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Packages summary (collapsed) */}
                  {expandedSvc !== svc.id && svc.packages.length > 0 && (
                    <div className="border-t border-dark/6 px-3 py-2 flex flex-wrap gap-1.5">
                      {svc.packages.map((pkg) => (
                        <span
                          key={pkg.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/8 text-dark/70",
                            !pkg.is_active && "opacity-40"
                          )}
                        >
                          <span className="font-bold text-primary text-sm">{pkg.price}</span>
                          <span className="text-dark/40 text-[10px]">{pkg.currency}</span>
                          <span className="text-dark/50">·</span>
                          <span>{translated(pkg.name, pkg.translations, isRTL)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canEdit && (
        <>
          <EditSheet
            open={editing !== null}
            title={editTitle()}
            fields={editFields()}
            initialValues={editInitial()}
            onClose={() => setEditing(null)}
            onSave={async (values) => {
              if (editing?.kind === "cat" || editing?.kind === "addCat") return saveCat(values);
              if (editing?.kind === "svc" || editing?.kind === "addSvc") return saveSvc(values);
              return savePkg(values);
            }}
            onDelete={editDeleteHandler()}
          />
          <ConfirmSheet
            open={!!deleting}
            message={`${t("admin.delete")} "${deleting?.name}"?`}
            onConfirm={handleDelete}
            onClose={() => setDeleting(null)}
          />
        </>
      )}
    </div>
  );
}
