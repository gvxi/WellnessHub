"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Building2, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsTab() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/zw0");
  }

  return (
    <div className="px-4 py-5 pb-6 space-y-4">
      {/* Business section */}
      <SettingsSection icon={Building2} title="Business">
        <SettingsRow label="Business Name" value="WellnessHub" />
        <SettingsRow label="Timezone" value="Asia/Muscat" />
        <SettingsRow label="Currency" value="OMR" />
      </SettingsSection>

      <SettingsSection icon={Shield} title="Account">
        <SettingsRow label="Role" value="Admin" />
        <SettingsRow label="Email" value="admin@wellnesshub.com" />
      </SettingsSection>

      <SettingsSection icon={Clock} title="Working Hours">
        <p className="text-xs text-dark/40 px-1 py-2">Configure working hours in the business settings.</p>
      </SettingsSection>

      {/* Logout */}
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
          {loggingOut ? "Signing out…" : "Sign out"}
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
