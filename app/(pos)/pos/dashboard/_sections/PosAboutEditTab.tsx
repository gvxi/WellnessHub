"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Languages, Loader2, LogIn, Save, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import AboutContent from "@/app/about/_components/AboutContent";
import type { AboutData, AboutField, TabPermission } from "@/lib/supabase/types";

interface Props {
  permissionLevel: Exclude<TabPermission, "hidden">;
}

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

type TextareaField = { key: keyof AboutData; labelKey: string; textarea?: boolean };
type SectionDef = { titleKey: string; imageKey?: "hero" | "mission"; fields: TextareaField[] };

const SECTIONS: SectionDef[] = [
  {
    titleKey: "admin.about_section_hero",
    imageKey: "hero",
    fields: [
      { key: "heroSubtitle",    labelKey: "admin.about_f_subtitle" },
      { key: "heroHeadline",    labelKey: "admin.about_f_headline" },
      { key: "heroBody",        labelKey: "admin.about_f_body", textarea: true },
      { key: "exploreServices", labelKey: "admin.about_f_btn_explore" },
      { key: "contactUs",       labelKey: "admin.about_f_btn_contact" },
    ],
  },
  {
    titleKey: "admin.about_section_mission",
    imageKey: "mission",
    fields: [
      { key: "whoWeAre",        labelKey: "admin.about_f_section_label" },
      { key: "missionHeadline", labelKey: "admin.about_f_headline" },
      { key: "missionP1",       labelKey: "admin.about_f_para1", textarea: true },
      { key: "missionP2",       labelKey: "admin.about_f_para2", textarea: true },
    ],
  },
  {
    titleKey: "admin.about_section_values",
    fields: [
      { key: "ourValues",      labelKey: "admin.about_f_section_label" },
      { key: "valuesHeadline", labelKey: "admin.about_f_headline" },
      { key: "val1Title",      labelKey: "admin.about_f_val1_title" },
      { key: "val1Body",       labelKey: "admin.about_f_val1_body", textarea: true },
      { key: "val2Title",      labelKey: "admin.about_f_val2_title" },
      { key: "val2Body",       labelKey: "admin.about_f_val2_body", textarea: true },
      { key: "val3Title",      labelKey: "admin.about_f_val3_title" },
      { key: "val3Body",       labelKey: "admin.about_f_val3_body", textarea: true },
    ],
  },
  {
    titleKey: "admin.about_section_stats",
    fields: [
      { key: "stat1", labelKey: "admin.about_f_stat1_lbl" },
      { key: "stat2", labelKey: "admin.about_f_stat2_lbl" },
      { key: "stat3", labelKey: "admin.about_f_stat3_lbl" },
    ],
  },
  {
    titleKey: "admin.about_section_contact",
    fields: [
      { key: "getInTouch",      labelKey: "admin.about_f_section_label" },
      { key: "contactHeadline", labelKey: "admin.about_f_headline" },
      { key: "location",        labelKey: "admin.about_f_location" },
      { key: "locationValue",   labelKey: "admin.about_f_location_val" },
      { key: "phone",           labelKey: "admin.about_f_phone" },
      { key: "phoneValue",      labelKey: "admin.about_f_phone_val" },
      { key: "hours",           labelKey: "admin.about_f_hours" },
      { key: "hoursValue",      labelKey: "admin.about_f_hours_val" },
      { key: "instagram",       labelKey: "admin.about_f_instagram" },
      { key: "instagramValue",  labelKey: "admin.about_f_instagram_val" },
      { key: "bookNow",         labelKey: "admin.about_f_btn_book" },
    ],
  },
];

function ReadOnlyField({ label, enValue, arValue }: { label: string; enValue: string; arValue: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-dark/50 uppercase tracking-wider">{label}</p>
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 rounded-xl bg-dark/4 text-sm text-dark min-h-[36px]">{enValue || <span className="text-dark/25">—</span>}</div>
        <div className="flex-1 px-3 py-2 rounded-xl bg-dark/4 text-sm text-dark text-right min-h-[36px]" dir="rtl">{arValue || <span className="text-dark/25">—</span>}</div>
      </div>
    </div>
  );
}

function BilingualField({
  label, enValue, arValue, textarea, onChange, onTranslate, translating,
}: {
  label: string; enValue: string; arValue: string; textarea?: boolean;
  onChange: (lang: "en" | "ar", val: string) => void;
  onTranslate: () => void; translating: boolean;
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
          {textarea
            ? <textarea value={enValue} onChange={(e) => onChange("en", e.target.value)} rows={3} className={cn(inputClass, "resize-none")} placeholder="English…" />
            : <input value={enValue} onChange={(e) => onChange("en", e.target.value)} className={inputClass} placeholder="English…" />}
        </div>
        <button onClick={onTranslate} disabled={translating || !enValue.trim()} title="Translate EN → AR"
          className="mt-1 shrink-0 w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center hover:bg-secondary/20 disabled:opacity-40 transition-colors">
          {translating ? <Loader2 size={13} className="text-secondary animate-spin" /> : <Languages size={13} className="text-secondary" />}
        </button>
        <div className="flex-1">
          {textarea
            ? <textarea value={arValue} onChange={(e) => onChange("ar", e.target.value)} rows={3} dir="rtl" className={cn(inputClass, "resize-none")} placeholder="العربية…" />
            : <input value={arValue} onChange={(e) => onChange("ar", e.target.value)} dir="rtl" className={inputClass} placeholder="العربية…" />}
        </div>
      </div>
    </div>
  );
}

function ImageField({
  label, uploadLabel, unsplashId, imageUrl, uploadFolder, onUnsplashChange, onUpload,
}: {
  label: string; uploadLabel: string; unsplashId: string; imageUrl: string;
  uploadFolder: string; onUnsplashChange: (val: string) => void; onUpload: (url: string) => void;
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
              <button onClick={() => onUpload("")} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-dark/60 flex items-center justify-center">
                <X size={9} className="text-white" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <input value={unsplashId} onChange={(e) => onUnsplashChange(e.target.value)}
            className="w-full rounded-xl border border-dark/12 bg-white px-3 py-2 text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Unsplash ID, e.g. photo-1540555700478…" />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dark/12 text-xs font-medium text-dark/60 hover:bg-dark/4 transition-colors disabled:opacity-50">
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploadLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-dark/8 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-dark/[0.02] hover:bg-dark/[0.04] transition-colors text-start">
        <span className="text-sm font-semibold text-dark">{title}</span>
        {open ? <ChevronDown size={15} className="text-dark/40" /> : <ChevronRight size={15} className="text-dark/40" />}
      </button>
      {open && <div className="px-4 py-4 space-y-5 bg-white">{children}</div>}
    </div>
  );
}

export default function PosAboutEditTab({ permissionLevel }: Props) {
  const canEdit = permissionLevel === "enabled";
  const [data, setData] = useState<AboutData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [previewLang, setPreviewLang] = useState<"en" | "ar">("en");
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [sessionExpired, setSessionExpired] = useState(false);
  const { t } = useLang();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/pos/about")
      .then(async (r) => {
        if (r.status === 401) { setSessionExpired(true); return; }
        const d = await r.json();
        if (d && !d.error) setData(d);
      })
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
      if (json.translations?.[0]) setBilingual(key, "ar", json.translations[0]);
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
      const res = await fetch("/api/pos/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 401) { setSessionExpired(true); return; }
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  async function handleRelogin() {
    await fetch("/api/pos/auth", { method: "DELETE" });
    router.push("/pos");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-dark/30" />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
          <LogIn size={20} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-dark">{t("admin.sessionExpired")}</p>
          <p className="text-xs text-dark/40 mt-1">{t("admin.sessionExpiredHint")}</p>
        </div>
        <button onClick={handleRelogin}
          className="px-5 py-2.5 rounded-2xl bg-primary text-light text-sm font-semibold hover:bg-primary/90 transition-colors">
          {t("admin.login_sign_in")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-light/95 backdrop-blur-sm border-b border-dark/8 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-dark">{t("admin.about_editor_title")}</h2>
            <p className="text-xs text-dark/40">{t("admin.about_editor_subtitle")}</p>
          </div>
          {canEdit && (
            <>
              <button onClick={translateAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dark/12 text-xs font-medium text-dark/60 hover:bg-dark/4 transition-colors">
                <Languages size={13} />
                {t("admin.translate_all")}
              </button>
              <button onClick={handleSave} disabled={saving}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors",
                  status === "saved" ? "bg-green-500 text-white" :
                  status === "error" ? "bg-red-500 text-white" :
                  "bg-primary text-light hover:bg-primary/90"
                )}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {status === "saved" ? t("admin.about_saved") : status === "error" ? t("admin.about_error") : t("admin.about_save")}
              </button>
            </>
          )}
        </div>

        <div className="p-4 space-y-3 pb-20">
          {SECTIONS.map((section, si) => (
            <Accordion key={section.titleKey} title={t(section.titleKey)} defaultOpen={si === 0}>
              {section.imageKey === "hero" && (
                canEdit
                  ? <ImageField label={t("admin.about_hero_image")} uploadLabel={t("admin.about_upload")}
                      unsplashId={data.heroImageUnsplashId} imageUrl={data.heroImageUrl} uploadFolder="about"
                      onUnsplashChange={(v) => setField("heroImageUnsplashId", v)} onUpload={(url) => setField("heroImageUrl", url)} />
                  : <div className="w-full h-24 rounded-xl overflow-hidden bg-dark/5">
                      {(data.heroImageUrl || data.heroImageUnsplashId) && (
                        <img src={data.heroImageUrl || `https://images.unsplash.com/${data.heroImageUnsplashId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=60&w=400`} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
              )}
              {section.imageKey === "mission" && (
                canEdit
                  ? <ImageField label={t("admin.about_mission_image")} uploadLabel={t("admin.about_upload")}
                      unsplashId={data.missionImageUnsplashId} imageUrl={data.missionImageUrl} uploadFolder="about"
                      onUnsplashChange={(v) => setField("missionImageUnsplashId", v)} onUpload={(url) => setField("missionImageUrl", url)} />
                  : <div className="w-full h-24 rounded-xl overflow-hidden bg-dark/5">
                      {(data.missionImageUrl || data.missionImageUnsplashId) && (
                        <img src={data.missionImageUrl || `https://images.unsplash.com/${data.missionImageUnsplashId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=60&w=400`} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
              )}
              {section.titleKey === "admin.about_section_stats" && (
                <div className="grid grid-cols-3 gap-3">
                  {(["stat1Value", "stat2Value", "stat3Value"] as const).map((k, i) => (
                    <div key={k}>
                      <p className="text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                        {t(`admin.about_f_stat${i + 1}_val`)}
                      </p>
                      {canEdit
                        ? <input value={data[k]} onChange={(e) => setField(k, e.target.value)}
                            className="w-full rounded-xl border border-dark/12 bg-white px-3 py-2 text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder={`e.g. ${["5+", "2,000+", "30+"][i]}`} />
                        : <div className="px-3 py-2 rounded-xl bg-dark/4 text-sm text-dark">{data[k] || <span className="text-dark/25">—</span>}</div>
                      }
                    </div>
                  ))}
                </div>
              )}
              {section.fields.map(({ key, labelKey, textarea }) => (
                canEdit
                  ? <BilingualField key={key} label={t(labelKey)}
                      enValue={(data[key] as AboutField).en} arValue={(data[key] as AboutField).ar}
                      textarea={textarea}
                      onChange={(lang, val) => setBilingual(key, lang, val)}
                      onTranslate={() => translateField(key)} translating={!!translating[key]} />
                  : <ReadOnlyField key={key} label={t(labelKey)}
                      enValue={(data[key] as AboutField).en} arValue={(data[key] as AboutField).ar} />
              ))}
            </Accordion>
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-col w-[420px] shrink-0 border-s border-dark/8 bg-dark/[0.015]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark/8 bg-light/80">
          <span className="text-xs font-semibold text-dark/50 uppercase tracking-wider">{t("admin.about_preview")}</span>
          <button onClick={() => setPreviewLang((l) => (l === "en" ? "ar" : "en"))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark/6 text-xs font-semibold text-dark/60 hover:bg-dark/10 transition-colors">
            {previewLang === "en" ? "EN" : "AR"}
            <Languages size={11} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-light">
          <div style={{ zoom: 0.38, width: "100%", pointerEvents: "none", userSelect: "none" }}>
            <AboutContent data={data} forceLang={previewLang} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
