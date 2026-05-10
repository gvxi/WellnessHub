"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Building2, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
interface Props {
  employeeEmail?: string;
}

export default function PosSettingsTab({ employeeEmail }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [bizName, setBizName] = useState("WellnessHub");
  const [timezone, setTimezone] = useState("Asia/Muscat");
  const { t } = useLang();

  useEffect(() => {
    fetch("/api/pos/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setBizName(d.name);
        if (d.timezone) setTimezone(d.timezone);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/pos/auth", { method: "DELETE" });
    router.push("/pos");
  }

  return (
    <div className="px-4 py-5 pb-6 space-y-4">
      <SettingsSection icon={Building2} title={t("admin.settings_business")}>
        <SettingsRow label={t("admin.settings_business_name")} value={bizName} />
        <SettingsRow label={t("admin.settings_timezone")} value={timezone} />
        <SettingsRow label={t("admin.settings_currency")} value="OMR" />
      </SettingsSection>

      <SettingsSection icon={Shield} title={t("admin.settings_account")}>
        <SettingsRow label={t("admin.settings_role")} value="Employee" />
        {employeeEmail && <SettingsRow label={t("admin.settings_email")} value={employeeEmail} />}
      </SettingsSection>

      <SettingsSection icon={Clock} title={t("admin.settings_hours")}>
        <p className="text-xs text-dark/40 px-1 py-2">{t("admin.settings_hours_hint")}</p>
      </SettingsSection>

      <div className="pt-2">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl",
            "text-sm font-semibold text-red-500 bg-red-50",
            "hover:bg-red-100 active:scale-[0.98] transition-all",
            "disabled:opacity-50"
          )}
        >
          <LogOut size={16} />
          {loggingOut ? t("admin.signing_out") : t("admin.signOut")}
        </button>
      </div>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof LogOut;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-dark/[0.03] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-dark/5">
        <Icon size={14} className="text-secondary" />
        <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-secondary">{title}</p>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-dark/[0.04] last:border-0">
      <span className="text-sm text-dark/55">{label}</span>
      <span className="text-sm font-medium text-dark">{value}</span>
    </div>
  );
}
