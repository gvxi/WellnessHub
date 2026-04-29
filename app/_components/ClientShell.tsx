"use client";

import { type ReactNode } from "react";
import { ShopProvider, useUI } from "@/lib/shop-context";
import { ToastProvider } from "@/lib/toast-context";
import BottomNav from "@/components/ui/BottomNav";
import CartDrawer from "@/components/ui/CartDrawer";
import FavsDrawer from "@/components/ui/FavsDrawer";
import ItemDrawer from "@/components/ui/ItemDrawer";
import ToastStack from "@/components/ui/ToastStack";

function ShellInner({ children }: { children: ReactNode }) {
  const { cartOpen, setCartOpen, favsOpen, setFavsOpen, selectedItem, setSelectedItem } = useUI();

  return (
    <>
      {children}
      <BottomNav />
      {/* Add bottom padding on mobile so content isn't hidden behind BottomNav */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <FavsDrawer open={favsOpen} onClose={() => setFavsOpen(false)} />
      <ItemDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      <ToastStack />
    </>
  );
}

export default function ClientShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ShopProvider>
        <ShellInner>{children}</ShellInner>
      </ShopProvider>
    </ToastProvider>
  );
}
