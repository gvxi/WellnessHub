"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Upload, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "image";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  uploadFolder?: string;
  translatable?: boolean; // shows AR sub-field + included in auto-translate
};

interface Props {
  open: boolean;
  title: string;
  fields: FieldDef[];
  initialValues?: Record<string, string>;
  onClose: () => void;
  onSave: (values: Record<string, string>) => Promise<void>;
  onDelete?: () => void;
}

const SPRING = { type: "spring" as const, stiffness: 340, damping: 34 };

type TranslateStatus = "idle" | "loading" | "done" | "error";

export default function EditSheet({ open, title, fields, initialValues, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [translateStatus, setTranslateStatus] = useState<TranslateStatus>("idle");

  const translatableFields = fields.filter((f) => f.translatable && f.type !== "image" && f.type !== "select");

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      for (const f of fields) {
        init[f.key] = initialValues?.[f.key] ?? "";
        if (f.translatable) init[`${f.key}_ar`] = initialValues?.[`${f.key}_ar`] ?? "";
      }
      setDraft(init);
      setTranslateStatus("idle");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function set(key: string, val: string) {
    setDraft((d) => ({ ...d, [key]: val }));
    // reset translate status if user edits an EN field
    if (!key.endsWith("_ar")) setTranslateStatus("idle");
  }

  async function handleImageUpload(f: FieldDef, file?: File) {
    if (!file) return;
    setUploading(f.key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", f.uploadFolder ?? "misc");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) set(f.key, json.url);
    } finally {
      setUploading(null);
    }
  }

  async function handleTranslate() {
    if (translatableFields.length === 0) return;
    setTranslateStatus("loading");
    try {
      const texts = translatableFields.map((f) => draft[f.key] ?? "");
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, from: "en", to: "ar" }),
      });
      if (!res.ok) throw new Error("Translate API error");
      const json = await res.json();
      const translated: string[] = json.translations;
      setDraft((d) => {
        const next = { ...d };
        translatableFields.forEach((f, i) => {
          if (translated[i]) next[`${f.key}_ar`] = translated[i];
        });
        return next;
      });
      setTranslateStatus("done");
      setTimeout(() => setTranslateStatus("idle"), 3000);
    } catch {
      setTranslateStatus("error");
      setTimeout(() => setTranslateStatus("idle"), 3000);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function renderField(f: FieldDef, arVariant = false) {
    const key = arVariant ? `${f.key}_ar` : f.key;
    const value = draft[key] ?? "";
    const isRtl = arVariant;

    const inputClass = cn(
      "w-full border rounded-xl px-3 py-2.5 text-sm text-dark bg-dark/[0.02] focus:outline-none focus:border-primary/50 transition-colors",
      arVariant ? "border-secondary/30 focus:border-secondary/60" : "border-dark/10",
      isRtl && "text-right"
    );

    if (arVariant) {
      // AR field: only text / textarea (no image/select/number for translations)
      return f.type === "textarea" ? (
        <textarea
          dir="rtl"
          value={value}
          onChange={(e) => set(key, e.target.value)}
          placeholder={`ترجمة عربية…`}
          rows={3}
          className={cn(inputClass, "resize-none")}
        />
      ) : (
        <input
          dir="rtl"
          type="text"
          value={value}
          onChange={(e) => set(key, e.target.value)}
          placeholder="ترجمة عربية…"
          className={inputClass}
        />
      );
    }

    if (f.type === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(e) => set(key, e.target.value)}
          placeholder={f.placeholder}
          rows={3}
          className={cn(inputClass, "resize-none")}
        />
      );
    }
    if (f.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => set(key, e.target.value)}
          className={inputClass}
        >
          <option value="">— select —</option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (f.type === "image") {
      return (
        <div className="space-y-2">
          {value && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-dark/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="" className="w-full h-full object-cover" />
              {uploading === key && (
                <div className="absolute inset-0 bg-dark/50 flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-light" />
                </div>
              )}
            </div>
          )}
          <label className={cn(
            "inline-flex items-center gap-2 text-xs text-primary font-medium cursor-pointer py-1",
            uploading === key && "opacity-50 pointer-events-none"
          )}>
            {uploading === key ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {value ? "Change image" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(f, e.target.files?.[0])}
            />
          </label>
        </div>
      );
    }
    return (
      <input
        type={f.type ?? "text"}
        value={value}
        onChange={(e) => set(key, e.target.value)}
        placeholder={f.placeholder}
        className={inputClass}
      />
    );
  }

  const translateButtonContent = () => {
    if (translateStatus === "loading") return <><Loader2 size={12} className="animate-spin" />Translating…</>;
    if (translateStatus === "done") return <><CheckCircle2 size={12} className="text-emerald-500" />Translated</>;
    if (translateStatus === "error") return <><AlertCircle size={12} className="text-red-400" />Failed</>;
    return <><Globe size={12} />Translate EN→AR</>;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="es-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-dark/40 backdrop-blur-sm"
          />
          <motion.div
            key="es-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            className="fixed bottom-0 inset-x-0 z-[70] bg-light rounded-t-3xl px-5 pt-5 pb-10 shadow-2xl max-h-[88vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-dark">{title}</h3>
              <div className="flex items-center gap-2">
                {/* Translate button — only show if there are translatable fields */}
                {translatableFields.length > 0 && (
                  <button
                    type="button"
                    disabled={translateStatus === "loading"}
                    onClick={handleTranslate}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all",
                      translateStatus === "done"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : translateStatus === "error"
                          ? "bg-red-50 text-red-500 border border-red-200"
                          : "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15",
                      translateStatus === "loading" && "opacity-60"
                    )}
                  >
                    {translateButtonContent()}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-dark/6 flex items-center justify-center"
                >
                  <X size={13} className="text-dark/60" />
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4 mb-6">
              {fields.map((f) => (
                <div key={f.key}>
                  {/* EN field */}
                  <label className="text-[11px] font-medium text-dark/45 uppercase tracking-wide block mb-1.5">
                    {f.label}
                    {f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {renderField(f)}

                  {/* AR sub-field */}
                  {f.translatable && f.type !== "image" && f.type !== "select" && (
                    <div className="mt-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-md">ع</span>
                        <span className="text-[10px] text-dark/35 uppercase tracking-wide">{f.label} Arabic</span>
                        {draft[`${f.key}_ar`] && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto" title="Has Arabic translation" />
                        )}
                      </div>
                      {renderField(f, true)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              disabled={saving}
              onClick={handleSave}
              className="w-full py-3 rounded-2xl bg-primary text-light text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>

            {onDelete && (
              <button
                disabled={saving}
                onClick={() => { onClose(); onDelete(); }}
                className="w-full py-2.5 mt-2 rounded-2xl text-red-500/80 text-sm font-medium hover:bg-red-50/60 transition-colors disabled:opacity-60"
              >
                Delete
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
