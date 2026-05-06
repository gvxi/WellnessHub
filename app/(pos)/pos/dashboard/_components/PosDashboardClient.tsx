"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import PosTopNav from "./PosTopNav";
import PosBookingsTab from "../_sections/PosBookingsTab";
import PosServicesTab from "../_sections/PosServicesTab";
import PosAdsTab from "../_sections/PosAdsTab";
import type { EmployeePermissions } from "@/lib/supabase/types";

export type PosTab = "bookings" | "services" | "ads";

interface Props {
  permissions: EmployeePermissions;
}

export default function PosDashboardClient({ permissions }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PosTab>("bookings");

  // Extend session every 25 min
  useEffect(() => {
    async function extend() {
      const res = await fetch("/api/pos/auth", { method: "PUT" });
      if (res.status === 401) {
        await fetch("/api/pos/auth", { method: "DELETE" });
        router.push("/pos");
      }
    }
    extend();
    const id = setInterval(extend, 25 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  async function handleLogout() {
    await fetch("/api/pos/auth", { method: "DELETE" });
    router.push("/pos");
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-light">
      {/* Top nav bar */}
      <PosTopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full"
          >
            {activeTab === "bookings" && <PosBookingsTab permissions={permissions} />}
            {activeTab === "services" && <PosServicesTab permissions={permissions} />}
            {activeTab === "ads"      && <PosAdsTab permissions={permissions} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
