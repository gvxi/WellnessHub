"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { ApiEmployee } from "@/lib/supabase/types";

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
  can_edit_services: boolean;
  can_edit_ads: boolean;
  show_rejected_bookings: boolean;
  booking_delay_minutes: number;
  is_active: boolean;
};

function initForm(employee: ApiEmployee | null): FormState {
  if (!employee) {
    return {
      email: "",
      full_name: "",
      password: "",
      can_edit_services: false,
      can_edit_ads: false,
      show_rejected_bookings: false,
      booking_delay_minutes: 0,
      is_active: true,
    };
  }
  return {
    email: employee.email,
    full_name: employee.full_name ?? "",
    password: "",
    can_edit_services: employee.can_edit_services,
    can_edit_ads: employee.can_edit_ads,
    show_rejected_bookings: employee.show_rejected_bookings,
    booking_delay_minutes: employee.booking_delay_minutes,
    is_active: employee.is_active,
  };
}

export default function EmployeeSheet({ open, employee, onClose, onSaved }: Props) {
  const { t, isRTL } = useLang();
  const isCreate = !employee;

  const [form, setForm] = useState<FormState>(() => initForm(employee));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset form when employee changes
  function handleOpen() {
    setForm(initForm(employee));
    setError(null);
    setConfirmDelete(false);
    setShowPassword(false);
  }

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
        const res = await fetch("/api/admin/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            full_name: form.full_name,
            password: form.password,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Failed to create"); return; }

        // Now save permissions
        await fetch(`/api/admin/employees/${data.user_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            can_edit_services: form.can_edit_services,
            can_edit_ads: form.can_edit_ads,
            show_rejected_bookings: form.show_rejected_bookings,
            booking_delay_minutes: form.booking_delay_minutes,
            is_active: form.is_active,
          }),
        });
      } else {
        const res = await fetch(`/api/admin/employees/${employee.user_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            can_edit_services: form.can_edit_services,
            can_edit_ads: form.can_edit_ads,
            show_rejected_bookings: form.show_rejected_bookings,
            booking_delay_minutes: form.booking_delay_minutes,
            is_active: form.is_active,
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
      await fetch(`/api/admin/employees/${employee.user_id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence onExitComplete={handleOpen}>
      {open && (
        <>
          <motion.div
            key="es-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-dark/50 backdrop-blur-sm"
          />
          <motion.div
            key="es-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[80] bg-light rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {/* Handle + header */}
            <div className="flex-none px-5 pt-4 pb-4 border-b border-dark/8">
              <div className="w-10 h-1 rounded-full bg-dark/15 mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-dark">
                  {isCreate ? t("admin.team_add_employee") : (employee?.full_name ?? employee?.email)}
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-dark/6 flex items-center justify-center">
                  <X size={14} className="text-dark/60" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
              )}

              {isCreate && (
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
              )}

              {/* Permissions */}
              <div className="space-y-2 pt-1">
                <p className="text-[10px] uppercase tracking-[0.15em] text-dark/40 font-semibold px-0.5">
                  {t("admin.team_permissions")}
                </p>
                <Toggle
                  label={t("admin.team_can_edit_services")}
                  checked={form.can_edit_services}
                  onChange={(v) => set("can_edit_services", v)}
                />
                <Toggle
                  label={t("admin.team_can_edit_ads")}
                  checked={form.can_edit_ads}
                  onChange={(v) => set("can_edit_ads", v)}
                />
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

              {/* Booking delay */}
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
