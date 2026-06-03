"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Upload, Globe, CheckCircle2, AlertCircle, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Custom Combobox (fixed-position dropdown, works inside overflow containers) ──

interface ComboboxProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  onAddOption?: (value: string) => Promise<void>;
  inputClass: string;
}

function ComboboxField({ value, onChange, options, placeholder, onAddOption, inputClass }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [adding, setAdding] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = value.toLowerCase();
  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q))
    : options;
  const isNew = value.trim() !== "" && !options.some((o) => o.value.toLowerCase() === value.trim().toLowerCase());

  function openDropdown() {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  }

  function pick(v: string) {
    onChange(v);
    setOpen(false);
  }

  async function handleAdd() {
    if (!onAddOption || !value.trim()) return;
    setAdding(true);
    try { await onAddOption(value.trim()); } finally { setAdding(false); }
    setOpen(false);
  }

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      const drop = document.getElementById("editsheet-combobox-drop");
      if (drop?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => { onChange(e.target.value); if (!open) openDropdown(); }}
          onFocus={openDropdown}
          className={cn(inputClass, "pe-8")}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => open ? setOpen(false) : openDropdown()}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 p-1"
        >
          <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && typeof window !== "undefined" && (
        <div
          id="editsheet-combobox-drop"
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-light border border-dark/10 rounded-xl shadow-xl overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto overscroll-contain">
            {filtered.length === 0 && !isNew && (
              <p className="text-xs text-dark/35 px-3 py-3">No matching sections</p>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(o.value); }}
                className={cn(
                  "w-full text-start px-3 py-2 text-sm hover:bg-primary/8 transition-colors",
                  o.value === value ? "text-primary font-medium bg-primary/5" : "text-dark/80"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          {onAddOption && isNew && (
            <div className="border-t border-dark/8 px-3 py-2">
              <button
                type="button"
                disabled={adding}
                onMouseDown={(e) => { e.preventDefault(); handleAdd(); }}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary
                           bg-primary/8 hover:bg-primary/14 px-2.5 py-1 rounded-lg transition-colors
                           disabled:opacity-50 w-full justify-center"
              >
                {adding ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                Add &ldquo;{value.trim()}&rdquo; as new section
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "combobox" | "image";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  uploadFolder?: string;
  translatable?: boolean;
  onAddOption?: (value: string) => Promise<void>;
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

type TranslateStatus = "idle" | "loading" | "done" | "error" | "empty";
type TranslateDir = "en-ar" | "ar-en";

export default function EditSheet({ open, title, fields, initialValues, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [translateStatus, setTranslateStatus] = useState<TranslateStatus>("idle");
  const [translateDir, setTranslateDir] = useState<TranslateDir>("en-ar");

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
    const isEnToAr = translateDir === "en-ar";

    const toTranslate = translatableFields
      .map((f) => ({
        f,
        text: isEnToAr ? (draft[f.key] ?? "") : (draft[`${f.key}_ar`] ?? ""),
      }))
      .filter(({ text }) => text.trim());

    if (toTranslate.length === 0) {
      setTranslateStatus("empty");
      setTimeout(() => setTranslateStatus("idle"), 2000);
      return;
    }
    setTranslateStatus("loading");
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: toTranslate.map(({ text }) => text),
          from: isEnToAr ? "en" : "ar",
          to: isEnToAr ? "ar" : "en",
        }),
      });
      if (!res.ok) throw new Error("Translate API error");
      const json = await res.json();
      const translated: string[] = json.translations;
      setDraft((d) => {
        const next = { ...d };
        toTranslate.forEach(({ f }, idx) => {
          const result = translated[idx];
          if (result) {
            if (isEnToAr) next[`${f.key}_ar`] = result;
            else next[f.key] = result;
          }
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
    if (f.type === "combobox") {
      return (
        <ComboboxField
          value={value}
          onChange={(v) => set(key, v)}
          options={f.options ?? []}
          placeholder={f.placeholder}
          onAddOption={f.onAddOption}
          inputClass={inputClass}
        />
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
    if (translateStatus === "done") return <><CheckCircle2 size={12} className="text-emerald-500" />Done</>;
    if (translateStatus === "empty") return <><AlertCircle size={12} className="text-amber-400" />No source</>;
    if (translateStatus === "error") return <><AlertCircle size={12} className="text-red-400" />Failed</>;
    return <><Globe size={12} />{translateDir === "en-ar" ? "EN→AR" : "AR→EN"}</>;
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTranslateDir((d) => d === "en-ar" ? "ar-en" : "en-ar")}
                      className="w-6 h-6 rounded-lg bg-dark/6 flex items-center justify-center text-dark/40 hover:text-dark/70 hover:bg-dark/10 transition-colors text-[9px] font-bold"
                      title="Toggle direction"
                    >
                      ⇄
                    </button>
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
                            : translateStatus === "empty"
                              ? "bg-amber-50 text-amber-600 border border-amber-200"
                              : "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/15",
                        translateStatus === "loading" && "opacity-60"
                      )}
                    >
                      {translateButtonContent()}
                    </button>
                  </div>
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
