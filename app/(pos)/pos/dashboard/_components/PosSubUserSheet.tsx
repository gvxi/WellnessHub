"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X, Eye, EyeOff, Upload, FileText, Trash2, ExternalLink, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { ApiEmployee, TabPermission } from "@/lib/supabase/types";

interface Props {
  open: boolean;
  employee: ApiEmployee | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}

type FormState = {
  email: string;
  full_name: string;
  password: string;
  licence: string;
  real_email: string;
  phone: string;
  show_rejected_bookings: boolean;
  booking_delay_minutes: number;
  is_active: boolean;
  tab_bookings: TabPermission;
  tab_services: TabPermission;
  tab_ads: TabPermission;
  tab_analytics: TabPermission;
  tab_settings: TabPermission;
  tab_about: TabPermission;
};

type FileEntry = { path: string; url: string };
type FilesState = { contract: FileEntry | null; documents: FileEntry[] };

function initForm(employee: ApiEmployee | null): FormState {
  if (!employee) {
    return {
      email: "",
      full_name: "",
      password: "",
      licence: "",
      real_email: "",
      phone: "",
      show_rejected_bookings: false,
      booking_delay_minutes: 0,
      is_active: true,
      tab_bookings: "enabled",
      tab_services: "read-only",
      tab_ads: "read-only",
      tab_analytics: "hidden",
      tab_settings: "hidden",
      tab_about: "hidden",
    };
  }
  return {
    email: employee.email,
    full_name: employee.full_name ?? "",
    password: "",
    licence: employee.licence ?? "",
    real_email: employee.real_email ?? "",
    phone: employee.phone ?? "",
    show_rejected_bookings: employee.show_rejected_bookings,
    booking_delay_minutes: employee.booking_delay_minutes,
    is_active: employee.is_active,
    tab_bookings: employee.tab_bookings ?? "enabled",
    tab_services: employee.tab_services ?? "read-only",
    tab_ads: employee.tab_ads ?? "read-only",
    tab_analytics: employee.tab_analytics ?? "hidden",
    tab_settings: employee.tab_settings ?? "hidden",
    tab_about: employee.tab_about ?? "hidden",
  };
}

export default function PosSubUserSheet({ open, employee, onClose, onSaved }: Props) {
  const { t, isRTL } = useLang();
  const isCreate = !employee;

  const [form, setForm] = useState<FormState>(() => initForm(employee));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [files, setFiles] = useState<FilesState>({ contract: null, documents: [] });
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const contractInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setForm(initForm(employee));
    setError(null);
    setConfirmDelete(false);
    setShowPassword(false);
    setFiles({ contract: null, documents: [] });
  }

  useEffect(() => {
    if (!open) return;
    resetState();
    if (!isCreate && employee) {
      setFilesLoading(true);
      fetch(`/api/pos/team/${employee.user_id}/docs`)
        .then((r) => r.json())
        .then((d) => setFiles({ contract: d.contract ?? null, documents: d.documents ?? [] }))
        .catch(() => {})
        .finally(() => setFilesLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee?.user_id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      if (isCreate) {
        if (!form.email || !form.full_name || !form.password) {
          setError("Email, name and password are required");
          return;
        }
        const res = await fetch("/api/pos/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            full_name: form.full_name,
            password: form.password,
            show_rejected_bookings: form.show_rejected_bookings,
            booking_delay_minutes: form.booking_delay_minutes,
            is_active: form.is_active,
            tab_bookings: form.tab_bookings,
            tab_services: form.tab_services,
            tab_ads: form.tab_ads,
            tab_analytics: form.tab_analytics,
            tab_settings: form.tab_settings,
            tab_about: form.tab_about,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError((data as { error?: string }).error ?? "Failed to create"); return; }
      } else {
        const res = await fetch(`/api/pos/team/${employee.user_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: form.full_name,
            licence: form.licence || null,
            real_email: form.real_email || null,
            phone: form.phone || null,
            show_rejected_bookings: form.show_rejected_bookings,
            booking_delay_minutes: form.booking_delay_minutes,
            is_active: form.is_active,
            tab_bookings: form.tab_bookings,
            tab_services: form.tab_services,
            tab_ads: form.tab_ads,
            tab_analytics: form.tab_analytics,
            tab_settings: form.tab_settings,
            tab_about: form.tab_about,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!employee) return;
    setDeleting(true);
    try {
      await fetch(`/api/pos/team/${employee.user_id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  async function uploadFile(file: File, type: "contract" | "document") {
    if (!employee) return;
    const setter = type === "contract" ? setUploadingContract : setUploadingDoc;
    setter(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch(`/api/pos/team/${employee.user_id}/docs`, { method: "POST", body: fd });
      if (!res.ok) return;
      const refreshed = await fetch(`/api/pos/team/${employee.user_id}/docs`).then((r) => r.json());
      setFiles({ contract: refreshed.contract ?? null, documents: refreshed.documents ?? [] });
    } finally {
      setter(false);
    }
  }

  async function deleteFile(path: string, type: "contract" | "document") {
    if (!employee) return;
    setDeletingPath(path);
    try {
      await fetch(`/api/pos/team/${employee.user_id}/docs`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, type }),
      });
      setFiles((prev) =>
        type === "contract"
          ? { ...prev, contract: null }
          : { ...prev, documents: prev.documents.filter((d) => d.path !== path) }
      );
    } finally {
      setDeletingPath(null);
    }
  }

  function fileName(path: string) {
    return path.split("/").pop()?.replace(/^\d+-/, "") ?? path;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="pss-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-dark/50 backdrop-blur-sm"
          />
          <motion.div
            key="pss-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[80] bg-light rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Handle + header */}
            <div className="flex-none px-5 pt-4 pb-4 border-b border-dark/8">
              <div className="w-10 h-1 rounded-full bg-dark/15 mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-dark">
                  {isCreate ? t("admin.team_add_sub_user") : (employee?.full_name ?? employee?.email)}
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-dark/6 flex items-center justify-center">
                  <X size={14} className="text-dark/60" />
                </button>
              </div>
            </div>

            {/* Two-column body on md+ */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left column — basic info + permissions */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 md:border-e md:border-dark/8">
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
                )}

                {isCreate ? (
                  <>
                    <Field label={t("admin.team_full_name")}>
                      <input
                        className="w-full bg-dark/5 rounded-xl px-3 py-2.5 text-sm text-dark outline-none"
                        value={form.full_name}
                        onChange={(e) => set("full_name", e.target.value)}
                        placeholder="Jane Smith"
                      />
                    </Field>
                    <Field label={t("admin.team_email")}>
                      <input
                        type="email"
                        className="w-full bg-dark/5 rounded-xl px-3 py-2.5 text-sm text-dark outline-none"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="jane@example.com"
                      />
                    </Field>
                    <Field label={t("admin.team_password")}>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full bg-dark/5 rounded-xl px-3 py-2.5 pe-10 text-sm text-dark outline-none"
                          value={form.password}
                          onChange={(e) => set("password", e.target.value)}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 end-3 flex items-center text-dark/40"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </Field>
                  </>
                ) : (
                  <Field label={t("admin.team_full_name")}>
                    <input
                      className="w-full bg-dark/5 rounded-xl px-3 py-2.5 text-sm text-dark outline-none"
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                      placeholder="Jane Smith"
                    />
                  </Field>
                )}

                {/* Tab Permissions */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-dark/40 font-semibold px-0.5">
                    {t("admin.team_permissions")}
                  </p>
                  <TabPermissionRow label={t("admin.tab_bookings")} value={form.tab_bookings} onChange={(v) => set("tab_bookings", v)} />
                  <TabPermissionRow label={t("admin.tab_services")} value={form.tab_services} onChange={(v) => set("tab_services", v)} />
                  <TabPermissionRow label={t("admin.tab_ads")}      value={form.tab_ads}      onChange={(v) => set("tab_ads", v)} />
                  <TabPermissionRow label={t("admin.tab_analytics")} value={form.tab_analytics} onChange={(v) => set("tab_analytics", v)} />
                  <TabPermissionRow label={t("admin.tab_settings")} value={form.tab_settings} onChange={(v) => set("tab_settings", v)} />
                  <TabPermissionRow label={t("admin.tab_about")}    value={form.tab_about}    onChange={(v) => set("tab_about", v)} />
                </div>

                {/* Options */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-dark/40 font-semibold px-0.5">
                    {t("admin.tab_bookings")} options
                  </p>
                  <Toggle
                    label={t("admin.team_show_rejected")}
                    checked={form.show_rejected_bookings}
                    onChange={(v) => set("show_rejected_bookings", v)}
                  />
                  <Toggle
                    label={t("admin.team_active")}
                    checked={form.is_active}
                    onChange={(v) => set("is_active", v)}
                    activeColor="bg-emerald-500"
                  />
                </div>

                <Field label={t("admin.team_booking_delay")}>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-dark/5 rounded-xl px-3 py-2.5 text-sm text-dark outline-none"
                    value={form.booking_delay_minutes}
                    onChange={(e) => set("booking_delay_minutes", Number(e.target.value))}
                  />
                  <p className="text-[10px] text-dark/35 mt-1 px-0.5">
                    {t("admin.team_booking_delay_hint")}
                  </p>
                </Field>
              </div>

              {/* Right column — profile info + files (edit mode only on files) */}
              <div className="md:w-[360px] md:shrink-0 overflow-y-auto px-5 py-4 space-y-4 border-t border-dark/8 md:border-t-0">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-dark/40 font-semibold px-0.5">
                    {t("admin.team_profile_info")}
                  </p>
                  <Field label={t("admin.team_licence")}>
                    <input
                      className="w-full bg-dark/5 rounded-xl px-3 py-2.5 text-sm text-dark outline-none"
                      value={form.licence}
                      onChange={(e) => set("licence", e.target.value)}
                      placeholder="LIC-123456"
                    />
                  </Field>
                  <Field label={t("admin.team_real_email")}>
                    <input
                      type="email"
                      className="w-full bg-dark/5 rounded-xl px-3 py-2.5 text-sm text-dark outline-none"
                      value={form.real_email}
                      onChange={(e) => set("real_email", e.target.value)}
                      placeholder="jane@personal.com"
                    />
                    <p className="text-[10px] text-dark/35 mt-1 px-0.5">{t("admin.team_real_email_hint")}</p>
                  </Field>
                  <Field label={t("admin.team_phone")}>
                    <input
                      type="tel"
                      className="w-full bg-dark/5 rounded-xl px-3 py-2.5 text-sm text-dark outline-none"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+1 555 000 0000"
                    />
                  </Field>
                </div>

                {!isCreate && (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-dark/40 font-semibold px-0.5">
                      {t("admin.team_files")}
                    </p>

                    {filesLoading ? (
                      <div className="flex items-center gap-2 text-dark/40 text-xs py-2">
                        <Loader2 size={12} className="animate-spin" />
                        {t("admin.team_loading")}
                      </div>
                    ) : (
                      <>
                        {/* Contract */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-dark/55">{t("admin.team_contract")}</label>
                          {files.contract ? (
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-dark/4 rounded-xl">
                              <FileText size={14} className="text-dark/40 shrink-0" />
                              <span className="text-xs text-dark/70 flex-1 truncate">{fileName(files.contract.path)}</span>
                              <button
                                type="button"
                                onClick={() => window.open(files.contract!.url, "_blank")}
                                className="text-primary shrink-0"
                              >
                                <ExternalLink size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => contractInputRef.current?.click()}
                                className="text-dark/40 shrink-0 text-[10px] font-medium"
                                disabled={uploadingContract}
                              >
                                {uploadingContract ? <Loader2 size={12} className="animate-spin" /> : t("admin.team_contract_replace")}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteFile(files.contract!.path, "contract")}
                                className="text-red-400 shrink-0"
                                disabled={deletingPath === files.contract.path}
                              >
                                {deletingPath === files.contract.path ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => contractInputRef.current?.click()}
                              disabled={uploadingContract}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-dark/4 rounded-xl text-xs text-dark/50 hover:text-dark/70 transition-colors"
                            >
                              {uploadingContract ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                              {uploadingContract ? t("admin.team_uploading") : t("admin.team_contract_upload")}
                            </button>
                          )}
                          <input
                            ref={contractInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadFile(f, "contract");
                              e.target.value = "";
                            }}
                          />
                        </div>

                        {/* Documents */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-dark/55">{t("admin.team_documents")}</label>
                          <div className="space-y-1">
                            {files.documents.map((doc) => (
                              <div key={doc.path} className="flex items-center gap-2 px-3 py-2 bg-dark/4 rounded-xl">
                                <FileText size={13} className="text-dark/40 shrink-0" />
                                <span className="text-xs text-dark/70 flex-1 truncate">{fileName(doc.path)}</span>
                                <button
                                  type="button"
                                  onClick={() => window.open(doc.url, "_blank")}
                                  className="text-primary shrink-0"
                                >
                                  <ExternalLink size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteFile(doc.path, "document")}
                                  className="text-red-400 shrink-0"
                                  disabled={deletingPath === doc.path}
                                >
                                  {deletingPath === doc.path ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => docInputRef.current?.click()}
                            disabled={uploadingDoc}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-dark/4 rounded-xl text-xs text-dark/50 hover:text-dark/70 transition-colors"
                          >
                            {uploadingDoc ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            {uploadingDoc ? t("admin.team_uploading") : t("admin.team_documents_add")}
                          </button>
                          <input
                            ref={docInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadFile(f, "document");
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-none px-5 pb-8 pt-3 border-t border-dark/8 space-y-2">
              <button
                disabled={loading}
                onClick={handleSave}
                className="w-full py-3 rounded-2xl bg-primary text-light text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {isCreate ? t("admin.team_create_employee") : t("admin.team_save_changes")}
              </button>

              {!isCreate && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 text-sm font-medium text-red-500/80"
                >
                  {t("admin.team_delete_employee")}
                </button>
              )}

              {!isCreate && confirmDelete && (
                <div className="space-y-2">
                  <p className="text-xs text-center text-dark/50">{t("admin.team_delete_confirm")}</p>
                  <button
                    disabled={deleting}
                    onClick={handleDelete}
                    className="w-full py-2.5 rounded-2xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {deleting && <Loader2 size={14} className="animate-spin" />}
                    {t("admin.team_delete_employee")}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="w-full py-2 text-sm text-dark/40"
                  >
                    {t("admin.team_cancel")}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-dark/55">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  activeColor = "bg-primary",
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between px-3 py-2.5 bg-dark/4 rounded-xl"
    >
      <span className="text-sm text-dark/70">{label}</span>
      <span
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors",
          checked ? activeColor : "bg-dark/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
            checked ? "start-5" : "start-0.5"
          )}
        />
      </span>
    </button>
  );
}

const TAB_LEVELS: TabPermission[] = ["hidden", "read-only", "enabled"];
const LEVEL_COLORS: Record<TabPermission, string> = {
  hidden: "bg-dark/10 text-dark/40",
  "read-only": "bg-amber-50 text-amber-600",
  enabled: "bg-emerald-50 text-emerald-600",
};

function TabPermissionRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TabPermission;
  onChange: (v: TabPermission) => void;
}) {
  const { t } = useLang();
  const LEVEL_LABELS: Record<TabPermission, string> = {
    hidden: t("admin.team_perm_hidden"),
    "read-only": t("admin.team_perm_read_only"),
    enabled: t("admin.team_perm_enabled"),
  };
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-dark/4 rounded-xl gap-3">
      <span className="text-sm text-dark/70 flex-1 truncate">{label}</span>
      <div className="flex gap-1">
        {TAB_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors",
              value === level ? LEVEL_COLORS[level] : "text-dark/30 hover:text-dark/50"
            )}
          >
            {LEVEL_LABELS[level]}
          </button>
        ))}
      </div>
    </div>
  );
}
