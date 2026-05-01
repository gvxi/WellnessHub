"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShopProvider, useUI } from "@/lib/shop-context";
import { ToastProvider } from "@/lib/toast-context";
import { LangProvider } from "@/lib/lang-context";
import BottomNav from "@/components/ui/BottomNav";
import CartDrawer from "@/components/ui/CartDrawer";
import FavsDrawer from "@/components/ui/FavsDrawer";
import ItemDrawer from "@/components/ui/ItemDrawer";
import AuthModal from "@/components/ui/AuthModal";
import ProfileDrawer from "@/components/ui/ProfileDrawer";
import ToastStack from "@/components/ui/ToastStack";

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/zw0");
  const { cartOpen, setCartOpen, favsOpen, setFavsOpen, selectedItem, setSelectedItem } = useUI();

  return (
    <>
      {children}
      {!isAdmin && <BottomNav />}
      {!isAdmin && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
      {!isAdmin && <FavsDrawer open={favsOpen} onClose={() => setFavsOpen(false)} />}
      {!isAdmin && <ItemDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {!isAdmin && <AuthModal />}
      {!isAdmin && <ProfileDrawer />}
      <ToastStack />
    </>
  );
}

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <ToastProvider>
        <ShopProvider>
          <ShellInner>{children}</ShellInner>
        </ShopProvider>
      </ToastProvider>
    </LangProvider>
  );
}
