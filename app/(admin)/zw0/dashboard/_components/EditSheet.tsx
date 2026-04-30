"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "image";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  uploadFolder?: string;
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

export default function EditSheet({ open, title, fields, initialValues, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      for (const f of fields) init[f.key] = initialValues?.[f.key] ?? "";
      setDraft(init);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function set(key: string, val: string) {
    setDraft((d) => ({ ...d, [key]: val }));
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

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  }

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
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-dark">{title}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-dark/6 flex items-center justify-center"
              >
                <X size={13} className="text-dark/60" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-[11px] font-medium text-dark/45 uppercase tracking-wide block mb-1.5">
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      value={draft[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full border border-dark/10 rounded-xl px-3 py-2.5 text-sm text-dark bg-dark/[0.02] resize-none focus:outline-none focus:border-primary/50"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={draft[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full border border-dark/10 rounded-xl px-3 py-2.5 text-sm text-dark bg-dark/[0.02] focus:outline-none focus:border-primary/50"
                    >
                      <option value="">— select —</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === "image" ? (
                    <div className="space-y-2">
                      {draft[f.key] && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-dark/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={draft[f.key]} alt="" className="w-full h-full object-cover" />
                          {uploading === f.key && (
                            <div className="absolute inset-0 bg-dark/50 flex items-center justify-center">
                              <Loader2 size={16} className="animate-spin text-light" />
                            </div>
                          )}
                        </div>
                      )}
                      <label className={cn(
                        "inline-flex items-center gap-2 text-xs text-primary font-medium cursor-pointer py-1",
                        uploading === f.key && "opacity-50 pointer-events-none"
                      )}>
                        {uploading === f.key
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Upload size={12} />
                        }
                        {draft[f.key] ? "Change image" : "Upload image"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(f, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      value={draft[f.key] ?? ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-dark/10 rounded-xl px-3 py-2.5 text-sm text-dark bg-dark/[0.02] focus:outline-none focus:border-primary/50"
                    />
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
