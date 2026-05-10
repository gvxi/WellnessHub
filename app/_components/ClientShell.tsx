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

function ShellInner({ children, serverIsPos }: { children: ReactNode; serverIsPos: boolean }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/zw0");
  const isPos = serverIsPos || pathname.startsWith("/pos");
  const { cartOpen, setCartOpen, favsOpen, setFavsOpen, selectedItem, setSelectedItem } = useUI();

  return (
    <>
      {children}
      {!isAdmin && !isPos && <BottomNav />}
      {!isAdmin && !isPos && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
      {!isAdmin && !isPos && <FavsDrawer open={favsOpen} onClose={() => setFavsOpen(false)} />}
      {!isAdmin && !isPos && <ItemDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {!isAdmin && !isPos && <AuthModal />}
      {!isAdmin && !isPos && <ProfileDrawer />}
      <ToastStack />
    </>
  );
}

export default function ClientShell({ children, isPos = false }: { children: ReactNode; isPos?: boolean }) {
  return (
    <LangProvider>
      <ToastProvider>
        <ShopProvider>
          <ShellInner serverIsPos={isPos}>{children}</ShellInner>
        </ShopProvider>
      </ToastProvider>
    </LangProvider>
  );
}
