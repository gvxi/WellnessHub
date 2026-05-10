"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Languages, Loader2, Save, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import AboutContent from "@/app/about/_components/AboutContent";
import type { AboutData, AboutField } from "@/lib/supabase/types";

// ── Default (empty) content ───────────────────────────────────────────────────
const EMPTY_FIELD: AboutField = { en: "", ar: "" };

const DEFAULT_DATA: AboutData = {
  heroSubtitle: EMPTY_FIELD,    heroHeadline: EMPTY_FIELD,    heroBody: EMPTY_FIELD,
  exploreServices: EMPTY_FIELD, contactUs: EMPTY_FIELD,
  heroImageUnsplashId: "",      heroImageUrl: "",
  whoWeAre: EMPTY_FIELD,        missionHeadline: EMPTY_FIELD,
  missionP1: EMPTY_FIELD,       missionP2: EMPTY_FIELD,
  missionImageUnsplashId: "",   missionImageUrl: "",
  ourValues: EMPTY_FIELD,       valuesHeadline: EMPTY_FIELD,
  val1Title: EMPTY_FIELD,       val1Body: EMPTY_FIELD,
  val2Title: EMPTY_FIELD,       val2Body: EMPTY_FIELD,
  val3Title: EMPTY_FIELD,       val3Body: EMPTY_FIELD,
  stat1Value: "",               stat2Value: "",               stat3Value: "",
  stat1: EMPTY_FIELD,           stat2: EMPTY_FIELD,           stat3: EMPTY_FIELD,
  getInTouch: EMPTY_FIELD,      contactHeadline: EMPTY_FIELD,
  location: EMPTY_FIELD,        locationValue: EMPTY_FIELD,
  phone: EMPTY_FIELD,           phoneValue: EMPTY_FIELD,
  instagram: EMPTY_FIELD,       instagramValue: EMPTY_FIELD,
  hours: EMPTY_FIELD,           hoursValue: EMPTY_FIELD,
  bookNow: EMPTY_FIELD,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

type TextareaField = { key: keyof AboutData; label: string; textarea?: boolean };
type SectionDef = { title: string; emoji: string; fields: TextareaField[] };

const SECTIONS: SectionDef[] = [
  {
    title: "Hero", emoji: "🖼️",
    fields: [
      { key: "heroSubtitle",    label: "Subtitle (label above headline)" },
      { key: "heroHeadline",    label: "Headline" },
      { key: "heroBody",        label: "Body text", textarea: true },
      { key: "exploreServices", label: "Button: Explore Services" },
      { key: "contactUs",       label: "Button: Contact Us" },
    ],
  },
  {
    title: "Mission", emoji: "🌿",
    fields: [
      { key: "whoWeAre",       label: "Section label" },
      { key: "missionHeadline",label: "Headline" },
      { key: "missionP1",      label: "Paragraph 1", textarea: true },
      { key: "missionP2",      label: "Paragraph 2", textarea: true },
    ],
  },
  {
    title: "Values", emoji: "💎",
    fields: [
      { key: "ourValues",      label: "Section label" },
      { key: "valuesHeadline", label: "Headline" },
      { key: "val1Title",      label: "Card 1 — Title" },
      { key: "val1Body",       label: "Card 1 — Body", textarea: true },
      { key: "val2Title",      label: "Card 2 — Title" },
      { key: "val2Body",       label: "Card 2 — Body", textarea: true },
      { key: "val3Title",      label: "Card 3 — Title" },
      { key: "val3Body",       label: "Card 3 — Body", textarea: true },
    ],
  },
  {
    title: "Stats", emoji: "📊",
    fields: [
      { key: "stat1",  label: "Stat 1 label" },
      { key: "stat2",  label: "Stat 2 label" },
      { key: "stat3",  label: "Stat 3 label" },
    ],
  },
  {
    title: "Contact", emoji: "📍",
    fields: [
      { key: "getInTouch",     label: "Section label" },
      { key: "contactHeadline",label: "Headline" },
      { key: "location",       label: "Location label" },
      { key: "locationValue",  label: "Location value" },
      { key: "phone",          label: "Phone label" },
      { key: "phoneValue",     label: "Phone value" },
      { key: "hours",          label: "Hours label" },
      { key: "hoursValue",     label: "Hours value" },
      { key: "instagram",      label: "Instagram label" },
      { key: "instagramValue", label: "Instagram handle" },
      { key: "bookNow",        label: "Button: Book Now" },
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function BilingualField({
  label,
  enValue,
  arValue,
  textarea,
  onChange,
  onTranslate,
  translating,
}: {
  label: string;
  enValue: string;
  arValue: string;
  textarea?: boolean;
  onChange: (lang: "en" | "ar", val: string) => void;
  onTranslate: () => void;
  translating: boolean;
}) {
  const inputClass = cn(
    "w-full rounded-xl border border-dark/12 bg-white px-3 py-2 text-sm text-dark",
    "placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
  );

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-dark/50 uppercase tracking-wider">{label}</p>
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          {textarea ? (
            <textarea
              value={enValue}
              onChange={(e) => onChange("en", e.target.value)}
              rows={3}
              className={cn(inputClass, "resize-none")}
              placeholder="English…"
            />
          ) : (
            <input
              value={enValue}
              onChange={(e) => onChange("en", e.target.value)}
              className={inputClass}
              placeholder="English…"
            />
          )}
        </div>

        <button
          onClick={onTranslate}
          disabled={translating || !enValue.trim()}
          title="Translate EN → AR"
          className="mt-1 shrink-0 w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center hover:bg-secondary/20 disabled:opacity-40 transition-colors"
        >
          {translating ? (
            <Loader2 size={13} className="text-secondary animate-spin" />
          ) : (
            <Languages size={13} className="text-secondary" />
          )}
        </button>

        <div className="flex-1">
          {textarea ? (
            <textarea
              value={arValue}
              onChange={(e) => onChange("ar", e.target.value)}
              rows={3}
              dir="rtl"
              className={cn(inputClass, "resize-none")}
              placeholder="العربية…"
            />
          ) : (
            <input
              value={arValue}
              onChange={(e) => onChange("ar", e.target.value)}
              dir="rtl"
              className={inputClass}
              placeholder="العربية…"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ImageField({
  label,
  unsplashId,
  imageUrl,
  uploadFolder,
  onUnsplashChange,
  onUpload,
}: {
  label: string;
  unsplashId: string;
  imageUrl: string;
  uploadFolder: string;
  onUnsplashChange: (val: string) => void;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = imageUrl || (unsplashId ? `https://images.unsplash.com/${unsplashId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=60&w=400` : null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", uploadFolder);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json();
      if (json.url) onUpload(json.url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-dark/50 uppercase tracking-wider">{label}</p>
      <div className="flex gap-3 items-start">
        {preview && (
          <div className="relative shrink-0 w-20 h-14 rounded-xl overflow-hidden bg-dark/5">
            <img src={preview} alt="" className="w-full h-full object-cover" />
            {imageUrl && (
              <button
                onClick={() => onUpload("")}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-dark/60 flex items-center justify-center"
              >
                <X size={9} className="text-white" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <input
            value={unsplashId}
            onChange={(e) => onUnsplashChange(e.target.value)}
            className="w-full rounded-xl border border-dark/12 bg-white px-3 py-2 text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Unsplash ID, e.g. photo-1540555700478…"
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dark/12 text-xs font-medium text-dark/60 hover:bg-dark/4 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Upload image
          </button>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, emoji, children, defaultOpen = false }: { title: string; emoji: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-dark/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-dark/[0.02] hover:bg-dark/[0.04] transition-colors text-start"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-dark">
          <span>{emoji}</span>
          {title}
        </span>
        {open ? <ChevronDown size={15} className="text-dark/40" /> : <ChevronRight size={15} className="text-dark/40" />}
      </button>
      {open && <div className="px-4 py-4 space-y-5 bg-white">{children}</div>}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function AboutEditTab() {
  const [data, setData] = useState<AboutData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [previewLang, setPreviewLang] = useState<"en" | "ar">("en");
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  useLang();

  useEffect(() => {
    fetch("/api/admin/about")
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  function setField(key: keyof AboutData, value: AboutField | string) {
    setData((prev) => ({ ...prev, [key]: value }));
    setStatus("idle");
  }

  function setBilingual(key: keyof AboutData, lang: "en" | "ar", val: string) {
    setData((prev) => {
      const cur = prev[key] as AboutField;
      return { ...prev, [key]: { ...cur, [lang]: val } };
    });
    setStatus("idle");
  }

  async function translateField(key: keyof AboutData) {
    const field = data[key] as AboutField;
    if (!field?.en?.trim()) return;
    setTranslating((t) => ({ ...t, [key]: true }));
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [field.en], from: "en", to: "ar" }),
      });
      const json = await res.json();
      if (json.translations?.[0]) {
        setBilingual(key, "ar", json.translations[0]);
      }
    } finally {
      setTranslating((t) => ({ ...t, [key]: false }));
    }
  }

  async function translateAll() {
    const bilingualKeys = SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
    const toTranslate = bilingualKeys.filter((k) => {
      const f = data[k] as AboutField;
      return f?.en?.trim() && !f?.ar?.trim();
    });
    if (!toTranslate.length) return;

    const texts = toTranslate.map((k) => (data[k] as AboutField).en);
    setTranslating(Object.fromEntries(toTranslate.map((k) => [k, true])));

    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, from: "en", to: "ar" }),
      });
      const json = await res.json();
      if (json.translations) {
        setData((prev) => {
          const next = { ...prev } as Record<string, AboutField | string>;
          toTranslate.forEach((k, i) => {
            const tr = json.translations[i];
            if (tr) next[k] = { ...(prev[k] as AboutField), ar: tr };
          });
          return next as unknown as AboutData;
        });
      }
    } finally {
      setTranslating({});
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-dark/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* ── Left: Form ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-light/95 backdrop-blur-sm border-b border-dark/8 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-dark">About Page</h2>
            <p className="text-xs text-dark/40">Edit content and translations</p>
          </div>

          <button
            onClick={translateAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark/12 text-xs font-medium text-dark/60 hover:bg-dark/4 transition-colors"
          >
            <Languages size={13} />
            Translate all
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors",
              status === "saved" ? "bg-green-500 text-white" :
              status === "error" ? "bg-red-500 text-white" :
              "bg-primary text-light hover:bg-primary/90"
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {status === "saved" ? "Saved!" : status === "error" ? "Error" : "Save"}
          </button>
        </div>

        <div className="p-4 space-y-3 pb-20">
          {/* Hero image */}
          <Accordion title="Hero" emoji="🖼️" defaultOpen>
            <ImageField
              label="Hero background image"
              unsplashId={data.heroImageUnsplashId}
              imageUrl={data.heroImageUrl}
              uploadFolder="about"
              onUnsplashChange={(v) => setField("heroImageUnsplashId", v)}
              onUpload={(url) => setField("heroImageUrl", url)}
            />
            {SECTIONS[0].fields.map(({ key, label, textarea }) => (
              <BilingualField
                key={key}
                label={label}
                enValue={(data[key] as AboutField).en}
                arValue={(data[key] as AboutField).ar}
                textarea={textarea}
                onChange={(lang, val) => setBilingual(key, lang, val)}
                onTranslate={() => translateField(key)}
                translating={!!translating[key]}
              />
            ))}
          </Accordion>

          {/* Mission */}
          <Accordion title="Mission" emoji="🌿">
            <ImageField
              label="Mission section image"
              unsplashId={data.missionImageUnsplashId}
              imageUrl={data.missionImageUrl}
              uploadFolder="about"
              onUnsplashChange={(v) => setField("missionImageUnsplashId", v)}
              onUpload={(url) => setField("missionImageUrl", url)}
            />
            {SECTIONS[1].fields.map(({ key, label, textarea }) => (
              <BilingualField
                key={key}
                label={label}
                enValue={(data[key] as AboutField).en}
                arValue={(data[key] as AboutField).ar}
                textarea={textarea}
                onChange={(lang, val) => setBilingual(key, lang, val)}
                onTranslate={() => translateField(key)}
                translating={!!translating[key]}
              />
            ))}
          </Accordion>

          {/* Values */}
          <Accordion title="Values" emoji="💎">
            {SECTIONS[2].fields.map(({ key, label, textarea }) => (
              <BilingualField
                key={key}
                label={label}
                enValue={(data[key] as AboutField).en}
                arValue={(data[key] as AboutField).ar}
                textarea={textarea}
                onChange={(lang, val) => setBilingual(key, lang, val)}
                onTranslate={() => translateField(key)}
                translating={!!translating[key]}
              />
            ))}
          </Accordion>

          {/* Stats */}
          <Accordion title="Stats" emoji="📊">
            <div className="grid grid-cols-3 gap-3">
              {(["stat1Value", "stat2Value", "stat3Value"] as const).map((k, i) => (
                <div key={k}>
                  <p className="text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">Stat {i + 1} value</p>
                  <input
                    value={data[k]}
                    onChange={(e) => setField(k, e.target.value)}
                    className="w-full rounded-xl border border-dark/12 bg-white px-3 py-2 text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder={`e.g. ${["5+", "2,000+", "30+"][i]}`}
                  />
                </div>
              ))}
            </div>
            {SECTIONS[3].fields.map(({ key, label }) => (
              <BilingualField
                key={key}
                label={label}
                enValue={(data[key] as AboutField).en}
                arValue={(data[key] as AboutField).ar}
                onChange={(lang, val) => setBilingual(key, lang, val)}
                onTranslate={() => translateField(key)}
                translating={!!translating[key]}
              />
            ))}
          </Accordion>

          {/* Contact */}
          <Accordion title="Contact" emoji="📍">
            {SECTIONS[4].fields.map(({ key, label, textarea }) => (
              <BilingualField
                key={key}
                label={label}
                enValue={(data[key] as AboutField).en}
                arValue={(data[key] as AboutField).ar}
                textarea={textarea}
                onChange={(lang, val) => setBilingual(key, lang, val)}
                onTranslate={() => translateField(key)}
                translating={!!translating[key]}
              />
            ))}
          </Accordion>
        </div>
      </div>

      {/* ── Right: Preview ────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[420px] shrink-0 border-s border-dark/8 bg-dark/[0.015]">
        {/* Preview header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark/8 bg-light/80">
          <span className="text-xs font-semibold text-dark/50 uppercase tracking-wider">Preview</span>
          <button
            onClick={() => setPreviewLang((l) => (l === "en" ? "ar" : "en"))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark/6 text-xs font-semibold text-dark/60 hover:bg-dark/10 transition-colors"
          >
            {previewLang === "en" ? "EN" : "AR"}
            <Languages size={11} />
          </button>
        </div>

        {/* Scaled preview */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-light">
          <div
            style={{
              zoom: 0.38,
              width: "100%",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <AboutContent data={data} forceLang={previewLang} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
