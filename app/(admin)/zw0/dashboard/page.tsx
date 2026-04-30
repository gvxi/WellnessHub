"use client";

import { useState } from "react";
import { Menu, Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./_components/BottomNav";
import SideDrawer from "./_components/SideDrawer";
import QuickAddSheet from "./_components/QuickAddSheet";
import BookingsTab from "./_sections/BookingsTab";
import ServicesTab from "./_sections/ServicesTab";
import AdsTab from "./_sections/AdsTab";
import AnalyticsTab from "./_sections/AnalyticsTab";
import SettingsTab from "./_sections/SettingsTab";

export type AdminTab = "bookings" | "services" | "ads" | "analytics" | "settings";

const TAB_LABELS: Record<AdminTab, string> = {
  bookings: "Bookings",
  services: "Services",
  ads: "Ads",
  analytics: "Analytics",
  settings: "Settings",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("bookings");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  function handleTabChange(tab: AdminTab) {
    setActiveTab(tab);
    setDrawerOpen(false);
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-light z-50">
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 pt-12 pb-3 bg-light border-b border-dark/6">
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center"
        >
          <Menu size={18} className="text-dark/70" />
        </button>

        <div className="text-center">
          <p className="text-[10px] text-secondary uppercase tracking-[0.18em] font-medium">Admin</p>
          <h1 className="text-sm font-semibold text-dark leading-none">{TAB_LABELS[activeTab]}</h1>
        </div>

        <button className="w-9 h-9 rounded-xl bg-dark/5 flex items-center justify-center">
          <Bell size={18} className="text-dark/70" />
        </button>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="h-full"
          >
            {activeTab === "bookings" && <BookingsTab />}
            {activeTab === "services" && <ServicesTab />}
            {activeTab === "ads" && <AdsTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddPress={() => setAddSheetOpen(true)}
      />

      {/* Overlays */}
      <SideDrawer
        open={drawerOpen}
        activeTab={activeTab}
        onClose={() => setDrawerOpen(false)}
        onTabChange={handleTabChange}
      />
      <QuickAddSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onNavigate={(tab) => { handleTabChange(tab); setAddSheetOpen(false); }}
      />
    </div>
  );
}
