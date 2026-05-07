"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Shield, Eye, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import EmployeeSheet from "../_components/EmployeeSheet";
import type { ApiEmployee } from "@/lib/supabase/types";

export default function TeamTab() {
  const { t } = useLang();
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<ApiEmployee | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setSelected(null);
    setSheetOpen(true);
  }

  function openEdit(emp: ApiEmployee) {
    setSelected(emp);
    setSheetOpen(true);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-dark">{t("admin.tab_team")}</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-light text-xs font-semibold rounded-xl"
        >
          <UserPlus size={13} />
          {t("admin.team_add_employee")}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        {loading ? (
          <div className="pt-12 text-center text-sm text-dark/35">{t("admin.team_loading")}</div>
        ) : employees.length === 0 ? (
          <div className="pt-16 flex flex-col items-center gap-2 text-center">
            <UserPlus size={28} className="text-dark/20" />
            <p className="text-sm font-medium text-dark/50">{t("admin.team_empty")}</p>
            <p className="text-xs text-dark/30">{t("admin.team_empty_hint")}</p>
          </div>
        ) : (
          employees.map((emp) => (
            <button
              key={emp.user_id}
              onClick={() => openEdit(emp)}
              className="w-full bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-dark/6 text-start"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark truncate">
                    {emp.full_name ?? emp.email}
                  </p>
                  <p className="text-xs text-dark/40 truncate">{emp.email}</p>
                </div>
                <span
                  className={cn(
                    "ms-2 flex-none px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    emp.is_active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-500"
                  )}
                >
                  {emp.is_active ? t("admin.team_active") : t("admin.team_inactive")}
                </span>
              </div>

              {/* Permission chips */}
              <div className="flex flex-wrap gap-1.5">
                {emp.can_edit_services && (
                  <Chip icon={<Shield size={9} />} label={t("admin.team_can_edit_services")} color="bg-secondary/10 text-secondary" />
                )}
                {emp.can_edit_ads && (
                  <Chip icon={<Shield size={9} />} label={t("admin.team_can_edit_ads")} color="bg-secondary/10 text-secondary" />
                )}
                {emp.show_rejected_bookings && (
                  <Chip icon={<Eye size={9} />} label={t("admin.team_show_rejected")} color="bg-amber-50 text-amber-600" />
                )}
                {emp.can_manage_bookings && (
                  <Chip icon={<CheckCircle size={9} />} label={t("admin.team_can_manage_bookings")} color="bg-emerald-50 text-emerald-600" />
                )}
                {emp.booking_delay_minutes > 0 && (
                  <Chip icon={<Clock size={9} />} label={`${emp.booking_delay_minutes} ${t("admin.team_delay_min")}`} color="bg-dark/6 text-dark/50" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <EmployeeSheet
        open={sheetOpen}
        employee={selected}
        onClose={() => setSheetOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

function Chip({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", color)}>
      {icon}
      {label}
    </span>
  );
}
