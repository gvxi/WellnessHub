"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, Edit2, Plus, Trash2, Languages, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import EditSheet, { type FieldDef } from "../_components/EditSheet";
import ConfirmSheet from "../_components/ConfirmSheet";
import { PACKAGE_ICONS } from "@/lib/package-icons";

type Translations = Record<string, Record<string, string>>;

type PkgRow = {
  id: string; name: string; price: number; currency: string;
  icon: string | null; display_order: number; is_active: boolean;
  translations: Translations;
};
type ServiceRow = {
  id: string; name: string; group_label: string | null; is_active: boolean;
  display_order: number; category_id: string | null;
  categories: { name: string } | null;
  packages: PkgRow[];
  translations: Translations;
};
type CategoryRow = {
  id: string; name: string; subtitle: string | null;
  unsplash_id: string | null; slug: string | null; display_order: number;
  translations: Translations;
};

type InnerTab = "categories" | "products";

type EditTarget =
  | { kind: "cat"; item: CategoryRow }
  | { kind: "addCat" }
  | { kind: "svc"; item: ServiceRow }
  | { kind: "addSvc"; categoryId?: string }
  | { kind: "pkg"; pkg: PkgRow; svcId: string }
  | { kind: "addPkg"; svcId: string };

type DeleteTarget =
  | { kind: "cat"; id: string; name: string }
  | { kind: "svc"; id: string; name: string }
  | { kind: "pkg"; id: string; svcId: string; name: string };

// ── Field definitions ──────────────────────────────────────────────────────

const CAT_FIELDS: FieldDef[] = [
  { key: "name",        label: "Name",                required: true, placeholder: "e.g. Fitness & Dance", translatable: true },
  { key: "subtitle",    label: "Subtitle",                            placeholder: "e.g. Classes for every level", translatable: true },
  { key: "image_url",   label: "Banner Image",        type: "image",  uploadFolder: "categories" },
  { key: "unsplash_id", label: "Unsplash Fallback ID",                placeholder: "e.g. photo-1581009146145" },
  { key: "slug",        label: "Slug",                                placeholder: "e.g. fitness" },
];

const PKG_FIELDS: FieldDef[] = [
  { key: "name",  label: "Name",       required: true, placeholder: "e.g. Single Session", translatable: true },
  { key: "price", label: "Price (OMR)", type: "number", required: true },
  {
    key: "icon", label: "Icon Badge", type: "select",
    options: [
      { value: "", label: "None" },
      ...Object.entries(PACKAGE_ICONS).map(([k, v]) => ({ value: k, label: `${v.emoji} ${v.label}` })),
    ],
  },
];

// Helper: extract AR values from translations JSONB
function arValues(translations: Translations, keys: string[]): Record<string, string> {
  const ar = translations?.ar ?? {};
  const out: Record<string, string> = {};
  for (const k of keys) out[`${k}_ar`] = ar[k] ?? "";
  return out;
}

// Helper: build translations JSONB from flat values with _ar suffix
function buildTranslations(values: Record<string, string>, keys: string[]): Translations {
  const ar: Record<string, string> = {};
  for (const k of keys) {
    const v = values[`${k}_ar`];
    if (v?.trim()) ar[k] = v.trim();
  }
  return Object.keys(ar).length ? { ar } : {};
}

export default function ServicesTab() {
  const [innerTab, setInnerTab] = useState<InnerTab>("categories");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSvc, setExpandedSvc] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [batchStatus, setBatchStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const load = useCallback(() => {
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

  useEffect(() => { load(); }, [load]);

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

  // ── Category CRUD ──────────────────────────────────────────────────────────
  async function saveCat(values: Record<string, string>) {
    const { name, subtitle, unsplash_id, slug, image_url } = values;
    const translations = buildTranslations(values, ["name", "subtitle"]);
    const payload = { name, subtitle, unsplash_id, slug, image_url, translations };

    if (editing?.kind === "cat") {
      const res = await fetch(`/api/admin/categories/${editing.item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => c.id === editing.item.id ? { ...c, ...updated } : c));
    } else {
      const res = await fetch("/api/admin/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, display_order: categories.length }),
      });
      const created = await res.json();
      setCategories((prev) => [...prev, created]);
    }
  }

  async function deleteCat(id: string) {
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setServices((prev) => prev.filter((s) => s.category_id !== id));
  }

  // ── Service CRUD ───────────────────────────────────────────────────────────
  function svcFields(cats: CategoryRow[]): FieldDef[] {
    return [
      { key: "name",        label: "Name",        required: true, placeholder: "e.g. Yoga Beginner", translatable: true },
      { key: "group_label", label: "Group Label",                 placeholder: "e.g. Hair & Skin Care" },
      { key: "description", label: "Description",  type: "textarea", placeholder: "Optional description", translatable: true },
      {
        key: "category_id", label: "Category", type: "select",
        options: cats.map((c) => ({ value: c.id, label: c.name })),
      },
    ];
  }

  async function saveSvc(values: Record<string, string>) {
    const { name, group_label, description, category_id } = values;
    const translations = buildTranslations(values, ["name", "description"]);
    const payload = { name, group_label, description, category_id, translations };

    if (editing?.kind === "svc") {
      const res = await fetch(`/api/admin/services/${editing.item.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setServices((prev) => prev.map((s) => s.id === editing.item.id ? { ...s, ...updated } : s));
    } else {
      const res = await fetch("/api/admin/services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, display_order: services.length }),
      });
      const created = await res.json();
      setServices((prev) => [...prev, { ...created, categories: null, packages: [] }]);
    }
  }

  async function deleteSvc(id: string) {
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleSvc(svc: ServiceRow) {
    setToggling((s) => new Set(s).add(svc.id));
    await fetch(`/api/admin/services/${svc.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !svc.is_active }),
    });
    setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, is_active: !s.is_active } : s));
    setToggling((s) => { const n = new Set(s); n.delete(svc.id); return n; });
  }

  // ── Package CRUD ───────────────────────────────────────────────────────────
  async function savePkg(values: Record<string, string>) {
    const translations = buildTranslations(values, ["name"]);

    if (editing?.kind === "pkg") {
      const { svcId, pkg } = editing;
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, price: Number(values.price), icon: values.icon || null, translations }),
      });
      const updated = await res.json();
      setServices((prev) => prev.map((s) =>
        s.id === svcId
          ? { ...s, packages: s.packages.map((p) => p.id === pkg.id ? { ...p, ...updated } : p) }
          : s
      ));
    } else if (editing?.kind === "addPkg") {
      const { svcId } = editing;
      const res = await fetch("/api/admin/packages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: svcId, name: values.name, price: Number(values.price), icon: values.icon || null, translations }),
      });
      const created = await res.json();
      setServices((prev) => prev.map((s) =>
        s.id === svcId ? { ...s, packages: [...(s.packages ?? []), created] } : s
      ));
    }
  }

  async function deletePkg(id: string, svcId: string) {
    await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    setServices((prev) => prev.map((s) =>
      s.id === svcId ? { ...s, packages: s.packages.filter((p) => p.id !== id) } : s
    ));
  }

  // ── Edit sheet config ──────────────────────────────────────────────────────
  function editFields(): FieldDef[] {
    if (!editing) return [];
    if (editing.kind === "cat" || editing.kind === "addCat") return CAT_FIELDS;
    if (editing.kind === "svc" || editing.kind === "addSvc") return svcFields(categories);
    return PKG_FIELDS;
  }

  function editInitial(): Record<string, string> {
    if (!editing) return {};
    if (editing.kind === "cat") return {
      name: editing.item.name,
      subtitle: editing.item.subtitle ?? "",
      image_url: (editing.item as { image_url?: string | null }).image_url ?? "",
      unsplash_id: editing.item.unsplash_id ?? "",
      slug: editing.item.slug ?? "",
      ...arValues(editing.item.translations, ["name", "subtitle"]),
    };
    if (editing.kind === "svc") return {
      name: editing.item.name,
      group_label: editing.item.group_label ?? "",
      description: "",
      category_id: editing.item.category_id ?? "",
      ...arValues(editing.item.translations, ["name", "description"]),
    };
    if (editing.kind === "pkg") return {
      name: editing.pkg.name,
      price: String(editing.pkg.price),
      icon: editing.pkg.icon ?? "",
      ...arValues(editing.pkg.translations, ["name"]),
    };
    if (editing.kind === "addSvc") return { category_id: editing.categoryId ?? "" };
    return {};
  }

  function editTitle(): string {
    if (!editing) return "";
    if (editing.kind === "addCat") return "New Category";
    if (editing.kind === "cat") return "Edit Category";
    if (editing.kind === "addSvc") return "New Service";
    if (editing.kind === "svc") return "Edit Service";
    if (editing.kind === "addPkg") return "New Package";
    return "Edit Package";
  }

  async function handleSave(values: Record<string, string>) {
    if (!editing) return;
    if (editing.kind === "cat" || editing.kind === "addCat") return saveCat(values);
    if (editing.kind === "svc" || editing.kind === "addSvc") return saveSvc(values);
    return savePkg(values);
  }

  function editDeleteHandler(): (() => void) | undefined {
    if (!editing) return undefined;
    if (editing.kind === "cat") return () => setDeleting({ kind: "cat", id: editing.item.id, name: editing.item.name });
    if (editing.kind === "svc") return () => setDeleting({ kind: "svc", id: editing.item.id, name: editing.item.name });
    if (editing.kind === "pkg") return () => setDeleting({ kind: "pkg", id: editing.pkg.id, svcId: editing.svcId, name: editing.pkg.name });
    return undefined;
  }

  async function handleDelete() {
    if (!deleting) return;
    if (deleting.kind === "cat") return deleteCat(deleting.id);
    if (deleting.kind === "svc") return deleteSvc(deleting.id);
    return deletePkg(deleting.id, (deleting as { kind: "pkg"; svcId: string }).svcId);
  }

  async function handleBatchTranslate() {
    setBatchStatus("loading");
    try {
      type TranslateJob = { type: "cat" | "svc" | "pkg"; id: string; svcId?: string; texts: string[]; keys: string[]; existing: Translations };
      const jobs: TranslateJob[] = [];

      for (const cat of categories) {
        if (!cat.translations?.ar?.name) {
          jobs.push({ type: "cat", id: cat.id, texts: [cat.name, cat.subtitle ?? ""], keys: ["name", "subtitle"], existing: cat.translations ?? {} });
        }
      }
      for (const svc of services) {
        if (!svc.translations?.ar?.name) {
          jobs.push({ type: "svc", id: svc.id, texts: [svc.name], keys: ["name"], existing: svc.translations ?? {} });
        }
        for (const pkg of svc.packages ?? []) {
          if (!pkg.translations?.ar?.name) {
            jobs.push({ type: "pkg", id: pkg.id, svcId: svc.id, texts: [pkg.name], keys: ["name"], existing: pkg.translations ?? {} });
          }
        }
      }

      if (jobs.length === 0) { setBatchStatus("done"); setTimeout(() => setBatchStatus("idle"), 3000); return; }

      const allTexts = jobs.flatMap((j) => j.texts);
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: allTexts, from: "en", to: "ar" }),
      });
      if (!res.ok) throw new Error("translate failed");
      const { translations } = await res.json() as { translations: string[] };

      let offset = 0;
      await Promise.all(jobs.map(async (job) => {
        const chunk = translations.slice(offset, offset + job.texts.length);
        offset += job.texts.length;
        const ar: Record<string, string> = {};
        job.keys.forEach((k, i) => { if (chunk[i]?.trim()) ar[k] = chunk[i]; });
        if (Object.keys(ar).length === 0) return;
        const merged = { ...job.existing, ar: { ...(job.existing.ar ?? {}), ...ar } };

        if (job.type === "cat") {
          await fetch(`/api/admin/categories/${job.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translations: merged }) });
        } else if (job.type === "svc") {
          await fetch(`/api/admin/services/${job.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translations: merged }) });
        } else {
          await fetch(`/api/admin/packages/${job.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ translations: merged }) });
        }
      }));

      load();
      setBatchStatus("done");
      setTimeout(() => setBatchStatus("idle"), 3000);
    } catch {
      setBatchStatus("error");
      setTimeout(() => setBatchStatus("idle"), 3000);
    }
  }

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
          <div className="flex gap-2">
            <button
              onClick={() => setEditing({ kind: "addCat" })}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/4 transition-colors"
            >
              <Plus size={14} />
              Add Category
            </button>
            <button
              onClick={handleBatchTranslate}
              disabled={batchStatus === "loading"}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-2xl
                         bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {batchStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
              {batchStatus === "done" ? "Done!" : batchStatus === "error" ? "Error" : "Translate All"}
            </button>
          </div>

          {categories.map((cat) => (
            <div key={cat.id} className="p-4 rounded-2xl bg-dark/[0.03] flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dark">{cat.name}</p>
                {cat.subtitle && <p className="text-xs text-dark/45 mt-0.5 truncate">{cat.subtitle}</p>}
                {cat.translations?.ar?.name && (
                  <p className="text-[10px] text-secondary/70 mt-0.5 truncate" dir="rtl">{cat.translations.ar.name}</p>
                )}
              </div>
              <button
                onClick={() => setEditing({ kind: "cat", item: cat })}
                className="w-7 h-7 rounded-lg bg-dark/5 flex items-center justify-center shrink-0 ml-3"
              >
                <Edit2 size={13} className="text-dark/50" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-5">
          <div className="flex gap-2">
            <button
              onClick={() => setEditing({ kind: "addSvc" })}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/4 transition-colors"
            >
              <Plus size={14} />
              Add Service
            </button>
            <button
              onClick={handleBatchTranslate}
              disabled={batchStatus === "loading"}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-2xl
                         bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {batchStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
              {batchStatus === "done" ? "Done!" : batchStatus === "error" ? "Error" : "Translate All"}
            </button>
          </div>

          {grouped.map(({ cat, groups }) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-secondary">{cat.name}</p>
                <button
                  onClick={() => setEditing({ kind: "addSvc", categoryId: cat.id })}
                  className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center"
                >
                  <Plus size={11} className="text-secondary" />
                </button>
              </div>

              {groups.map(([label, svcs]) => (
                <div key={label} className="mb-3">
                  <p className="text-[11px] text-dark/40 font-medium px-1 mb-1">{label}</p>
                  <div className="space-y-1">
                    {svcs.map((svc) => (
                      <div key={svc.id} className="rounded-xl bg-dark/[0.03] overflow-hidden">
                        <div className="flex items-center px-4 py-3">
                          <button
                            disabled={toggling.has(svc.id)}
                            onClick={() => toggleSvc(svc)}
                            className="shrink-0 mr-2.5 disabled:opacity-40"
                          >
                            <div className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              svc.is_active ? "bg-emerald-400" : "bg-dark/20"
                            )} />
                          </button>

                          <button
                            onClick={() => setExpandedSvc(expandedSvc === svc.id ? null : svc.id)}
                            className="flex-1 flex items-center justify-between text-left min-w-0"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm text-dark truncate">{svc.name}</span>
                              {svc.translations?.ar?.name && (
                                <span className="text-[9px] font-bold text-secondary bg-secondary/10 px-1 rounded shrink-0">ع</span>
                              )}
                              <span className="text-xs text-dark/35 shrink-0">{svc.packages?.length ?? 0} pkg</span>
                            </div>
                            {expandedSvc === svc.id
                              ? <ChevronDown size={14} className="text-dark/30 shrink-0" />
                              : <ChevronRight size={14} className="text-dark/30 shrink-0" />
                            }
                          </button>

                          <button
                            onClick={() => setEditing({ kind: "svc", item: svc })}
                            className="w-6 h-6 rounded-lg bg-dark/5 flex items-center justify-center shrink-0 ml-2"
                          >
                            <Edit2 size={11} className="text-dark/40" />
                          </button>
                        </div>

                        {expandedSvc === svc.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 pb-3 border-t border-dark/5"
                          >
                            {(svc.packages ?? []).map((pkg) => (
                              <div key={pkg.id} className="flex items-center justify-between py-2">
                                <span className="text-xs text-dark/60 flex-1">
                                  {pkg.icon && PACKAGE_ICONS[pkg.icon as keyof typeof PACKAGE_ICONS]?.emoji + " "}
                                  {pkg.name}
                                  {pkg.translations?.ar?.name && (
                                    <span className="ml-1 text-[9px] font-bold text-secondary bg-secondary/10 px-1 rounded">ع</span>
                                  )}
                                </span>
                                <span className="text-xs font-semibold text-dark tabular-nums mr-3">
                                  {pkg.price} {pkg.currency}
                                </span>
                                <button
                                  onClick={() => setEditing({ kind: "pkg", pkg, svcId: svc.id })}
                                  className="w-5 h-5 rounded-md bg-dark/5 flex items-center justify-center"
                                >
                                  <Edit2 size={9} className="text-dark/40" />
                                </button>
                              </div>
                            ))}

                            <button
                              onClick={() => setEditing({ kind: "addPkg", svcId: svc.id })}
                              className="mt-1 flex items-center gap-1.5 text-[11px] text-primary font-medium py-1"
                            >
                              <Plus size={11} />
                              Add package
                            </button>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {groups.length === 0 && (
                <p className="text-xs text-dark/30 px-1 mb-2">No services yet</p>
              )}
            </div>
          ))}
        </div>
      )}

      <EditSheet
        open={editing !== null}
        title={editTitle()}
        fields={editFields()}
        initialValues={editInitial()}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={editDeleteHandler()}
      />

      <ConfirmSheet
        open={deleting !== null}
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
