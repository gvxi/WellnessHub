"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Plus, Minus, ShoppingCart, ChevronLeft,
  Tag, Trash2, Volume2, VolumeX, Languages, History,
} from "lucide-react";
import PosCheckoutDrawer from "./PosCheckoutDrawer";
import TodayPanel from "./TodayPanel";
import Image from "next/image";
import type { Category, SubCategory, ServiceItem, PriceTier } from "@/lib/services-data";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import { usePosToast, PosToastStack } from "@/lib/hooks/usePosToast";
import { playAddToCart } from "@/lib/sounds";

const CART_STORAGE_KEY = "pos_storefront_carts";

// Validate stored cart item price against DB catalog (tamper protection)
function validateCartItemPrice(item: CartItem, catalog: Category[]): boolean {
  for (const cat of catalog) {
    for (const sub of cat.subs) {
      const found = sub.items.find((i) => i.id === item.itemId);
      if (!found) continue;
      if (item.tierLabel) {
        const tier = found.tiers?.find((t) => t.label === item.tierLabel);
        return tier?.numericPrice === item.numericPrice;
      }
      return found.numericPrice === item.numericPrice;
    }
  }
  return false; // not in catalog → discard
}

// ── Cart types ─────────────────────────────────────────────────────────────
type CartItem = {
  key: string;
  itemId: string;
  name: string;
  nameAr?: string;
  categoryTitle: string;
  subTitle: string;
  price: string;
  numericPrice: number;
  tierLabel?: string;
  tierLabelAr?: string;
  qty: number;
};
type Cart = { id: string; label: string; items: CartItem[] };

function cartCount(c: Cart) { return c.items.reduce((s, i) => s + i.qty, 0); }
function cartTotal(c: Cart) { return c.items.reduce((s, i) => s + i.numericPrice * i.qty, 0); }

// ── Main ───────────────────────────────────────────────────────────────────
const SOUND_KEY = "pos_sound_enabled";

export default function PosStorefront() {
  const { isRTL, t, lang, setLang } = useLang();
  const { showToast, toasts } = usePosToast();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === "true";
  });
  const [todayOpen, setTodayOpen] = useState(false);
  const cartCounterRef = useRef(2);

  const [catalog, setCatalog] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [view, setView] = useState<"grid" | "category">("grid");
  const [activeCat, setActiveCat] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutCart, setCheckoutCart] = useState<Cart | null>(null);

  const [carts, setCarts] = useState<Cart[]>([{ id: "c1", label: "Cart 1", items: [] }]);
  const [activeCartId, setActiveCartId] = useState("c1");
  const restoredRef = useRef(false);

  // ── Fetch catalog then restore carts ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/catalog");
        const cats: Category[] = await res.json();
        setCatalog(cats);

        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (raw) {
          const stored: Cart[] = JSON.parse(raw);
          const validated = stored.map((cart) => ({
            ...cart,
            items: cart.items.filter((item) => validateCartItemPrice(item, cats)),
          }));
          if (validated.length > 0) {
            const hasItems = validated.some((c) => c.items.length > 0);
            setCarts(validated);
            setActiveCartId(validated[0].id);
            cartCounterRef.current = validated.length + 1;
            if (hasItems) showToast(t("pos.toast_cart_restored"), "info");
          }
        }
      } catch {
        // network error — show empty catalog
      } finally {
        restoredRef.current = true;
        setCatalogLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist carts to localStorage — only after restoration completes ──
  useEffect(() => {
    if (!restoredRef.current) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carts));
  }, [carts]);
  const activeCart = carts.find(c => c.id === activeCartId) ?? carts[0];

  // Flat item list for search
  const allItems = useMemo(() =>
    catalog.flatMap(cat =>
      cat.subs.flatMap(sub =>
        sub.items.map(item => ({ item, cat, sub }))
      )
    ), [catalog]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter(({ item }) =>
      item.name.toLowerCase().includes(q) ||
      (item.nameAr ?? "").includes(search)
    );
  }, [search, allItems]);

  const addToCart = useCallback((
    item: ServiceItem, cat: Category, sub: SubCategory, tier?: PriceTier
  ) => {
    const key = `${item.id}__${tier?.label ?? ""}`;
    const price = tier?.price ?? item.price ?? "";
    const numericPrice = tier?.numericPrice ?? item.numericPrice ?? 0;
    setCarts(prev => prev.map(c => {
      if (c.id !== activeCartId) return c;
      const idx = c.items.findIndex(i => i.key === key);
      if (idx >= 0) {
        const items = [...c.items];
        items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
        return { ...c, items };
      }
      return {
        ...c,
        items: [...c.items, {
          key, itemId: item.id,
          name: item.name, nameAr: item.nameAr,
          categoryTitle: cat.title, subTitle: sub.title,
          price, numericPrice,
          tierLabel: tier?.label, tierLabelAr: tier?.labelAr,
          qty: 1,
        }],
      };
    }));
    if (soundEnabled) playAddToCart();
  }, [activeCartId, soundEnabled]);

  const updateQty = useCallback((key: string, delta: number) => {
    setCarts(prev => prev.map(c => {
      if (c.id !== activeCartId) return c;
      return {
        ...c,
        items: c.items
          .map(i => i.key === key ? { ...i, qty: i.qty + delta } : i)
          .filter(i => i.qty > 0),
      };
    }));
  }, [activeCartId]);

  function newCart() {
    const id = `c${Date.now()}`;
    const label = `${t("pos.cart")} ${cartCounterRef.current++}`;
    setCarts(p => [...p, { id, label, items: [] }]);
    setActiveCartId(id);
  }

  function closeCart(id: string) {
    setCarts(prev => {
      if (prev.length === 1) return [{ ...prev[0], items: [] }];
      const next = prev.filter(c => c.id !== id);
      if (id === activeCartId) setActiveCartId(next[next.length - 1].id);
      return next;
    });
  }

  function placeOrder() {
    setCheckoutCart(activeCart);
    setCartOpen(false);
  }

  const cartPanelProps = { carts, activeCartId, activeCart, onSelectCart: setActiveCartId, onNewCart: newCart, onCloseCart: closeCart, onUpdateQty: updateQty, onPlaceOrder: placeOrder, showToast };

  return (
    <div className={cn("flex h-full overflow-hidden", isRTL && "flex-row-reverse")}>

      {/* ── Left: content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top nav: search + toggles */}
        <div className="flex-none px-4 py-3 border-b border-dark/6 bg-light flex items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-dark/35 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("pos.search_storefront")}
              className="w-full bg-dark/[0.04] border border-dark/8 rounded-xl ps-9 pe-9 py-2.5 text-sm text-dark placeholder:text-dark/30 outline-none focus:border-primary/30 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-dark/35 hover:text-dark/60">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            title="Toggle language"
            className="flex-none flex items-center gap-1.5 h-9 px-3 rounded-xl bg-dark/[0.04] border border-dark/8 text-dark/60 hover:text-dark hover:bg-dark/8 transition-colors text-xs font-semibold"
          >
            <Languages size={14} />
            <span>{lang === "en" ? "AR" : "EN"}</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem(SOUND_KEY, String(next));
            }}
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            className={cn(
              "flex-none w-9 h-9 rounded-xl border flex items-center justify-center transition-colors",
              soundEnabled
                ? "bg-dark/[0.04] border-dark/8 text-dark/60 hover:text-dark hover:bg-dark/8"
                : "bg-primary/8 border-primary/20 text-primary/60 hover:text-primary"
            )}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Today's bookings */}
          <button
            onClick={() => setTodayOpen(true)}
            title="Today's bookings"
            className="flex-none w-9 h-9 rounded-xl border border-dark/8 bg-dark/[0.04] flex items-center justify-center text-dark/60 hover:text-dark hover:bg-dark/8 transition-colors"
          >
            <History size={15} />
          </button>
        </div>

        {/* View area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {search ? (
              <motion.div key="search" {...FADE}>
                <SearchView results={searchResults} activeCart={activeCart} onAdd={addToCart} onUpdateQty={updateQty} />
              </motion.div>
            ) : view === "grid" ? (
              <motion.div key="grid" {...FADE}>
                <CategoryGridView
                  catalog={catalog}
                  loading={catalogLoading}
                  onSelect={cat => { setActiveCat(cat); setView("category"); }}
                />
              </motion.div>
            ) : (
              <motion.div key="detail" {...FADE}>
                <CategoryDetailView
                  category={activeCat!}
                  activeCart={activeCart}
                  onBack={() => setView("grid")}
                  onAdd={addToCart}
                  onUpdateQty={updateQty}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Desktop: cart sidebar ── */}
      <div className="hidden md:flex flex-none w-80 border-s border-dark/8 flex-col bg-light">
        <CartPanel {...cartPanelProps} />
      </div>

      {/* ── Mobile: cart FAB (bottom-left) + sheet ── */}
      <div className="md:hidden">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-24 left-4 z-40 w-14 h-14 rounded-full bg-primary shadow-xl flex items-center justify-center"
        >
          <ShoppingCart size={22} className="text-light" />
          {cartCount(activeCart) > 0 && (
            <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-dark text-light text-[10px] font-bold flex items-center justify-center">
              {Math.min(cartCount(activeCart), 99)}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {cartOpen && (
            <>
              <motion.div key="overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-dark/30"
                onClick={() => setCartOpen(false)}
              />
              <motion.div key="sheet"
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                className="fixed inset-x-0 bottom-0 z-50 bg-light rounded-t-2xl shadow-2xl flex flex-col"
                style={{ maxHeight: "80vh" }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-dark/6">
                  <span className="font-semibold text-sm text-dark">{t("pos.cart")}</span>
                  <button onClick={() => setCartOpen(false)} className="text-dark/40 hover:text-dark/70">
                    <X size={18} />
                  </button>
                </div>
                <CartPanel {...cartPanelProps} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Checkout drawer ── */}
      <PosCheckoutDrawer
        open={checkoutCart !== null}
        cart={checkoutCart ?? { id: "", label: "", items: [] }}
        soundEnabled={soundEnabled}
        onSuccess={(cartId, status) => {
          closeCart(cartId);
          setCheckoutCart(null);
          showToast(
            status === "approved" ? t("pos.toast_confirmed") : t("pos.toast_declined"),
            status === "approved" ? "success" : "info"
          );
        }}
        onClose={() => setCheckoutCart(null)}
        showToast={showToast}
      />

      <TodayPanel open={todayOpen} onClose={() => setTodayOpen(false)} />
      <PosToastStack toasts={toasts} />
    </div>
  );
}

// ── Animation preset ───────────────────────────────────────────────────────
const FADE = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18 },
};

// ── Category grid ──────────────────────────────────────────────────────────
function CategoryGridView({
  catalog, loading, onSelect,
}: {
  catalog: Category[];
  loading: boolean;
  onSelect: (cat: Category) => void;
}) {
  const { isRTL } = useLang();

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl aspect-video bg-dark/6 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {catalog.map(cat => {
        const img = cat.imageUrl || `https://images.unsplash.com/${cat.unsplashId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=60&w=400`;
        const title = isRTL && cat.titleAr ? cat.titleAr : cat.title;
        const subtitle = isRTL && cat.subtitleAr ? cat.subtitleAr : cat.subtitle;
        return (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(cat)}
            className="relative overflow-hidden rounded-2xl aspect-video text-start shadow-md"
          >
            <Image src={img} alt={title} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-light font-semibold text-sm leading-tight">{title}</p>
              <p className="text-light/60 text-[11px] mt-0.5">{subtitle}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Category detail ────────────────────────────────────────────────────────
function CategoryDetailView({
  category, activeCart, onBack, onAdd, onUpdateQty,
}: {
  category: Category;
  activeCart: Cart;
  onBack: () => void;
  onAdd: (item: ServiceItem, cat: Category, sub: SubCategory, tier?: PriceTier) => void;
  onUpdateQty: (key: string, delta: number) => void;
}) {
  const { isRTL } = useLang();
  const title = isRTL && category.titleAr ? category.titleAr : category.title;
  const subtitle = isRTL && category.subtitleAr ? category.subtitleAr : category.subtitle;
  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark/6 bg-light sticky top-0 z-10">
        <button onClick={onBack}
          className="w-8 h-8 rounded-xl bg-dark/5 flex items-center justify-center text-dark/60 hover:text-dark/90 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 className="text-sm font-bold text-dark">{title}</h2>
          <p className="text-[11px] text-dark/40">{subtitle}</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {category.subs.map(sub => {
          const subTitle = isRTL && sub.titleAr ? sub.titleAr : sub.title;
          return (
            <div key={sub.title}>
              <h3 className="text-xs font-semibold text-dark/40 uppercase tracking-wider mb-3">{subTitle}</h3>
              <div className="space-y-2">
                {sub.items.map(item => (
                  <ItemCard key={item.id} item={item} cat={category} sub={sub}
                    activeCart={activeCart} onAdd={onAdd} onUpdateQty={onUpdateQty} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Search view ────────────────────────────────────────────────────────────
function SearchView({
  results, activeCart, onAdd, onUpdateQty,
}: {
  results: { item: ServiceItem; cat: Category; sub: SubCategory }[];
  activeCart: Cart;
  onAdd: (item: ServiceItem, cat: Category, sub: SubCategory, tier?: PriceTier) => void;
  onUpdateQty: (key: string, delta: number) => void;
}) {
  const { t } = useLang();
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-dark/30 gap-3">
        <Search size={32} />
        <p className="text-sm">{t("pos.no_services_found")}</p>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-2">
      {results.map(({ item, cat, sub }) => (
        <ItemCard key={`${cat.id}-${item.id}`} item={item} cat={cat} sub={sub}
          activeCart={activeCart} onAdd={onAdd} onUpdateQty={onUpdateQty} />
      ))}
    </div>
  );
}

// ── Item card ──────────────────────────────────────────────────────────────
function ItemCard({
  item, cat, sub, activeCart, onAdd, onUpdateQty,
}: {
  item: ServiceItem;
  cat: Category;
  sub: SubCategory;
  activeCart: Cart;
  onAdd: (item: ServiceItem, cat: Category, sub: SubCategory, tier?: PriceTier) => void;
  onUpdateQty: (key: string, delta: number) => void;
}) {
  const { isRTL } = useLang();
  const [expanded, setExpanded] = useState(false);
  const itemName = isRTL && item.nameAr ? item.nameAr : item.name;
  const subTitle = isRTL && sub.titleAr ? sub.titleAr : sub.title;

  if (item.tiers && item.tiers.length > 0) {
    return (
      <div className="rounded-2xl border border-dark/8 bg-white overflow-hidden">
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-start"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark truncate">{itemName}</p>
            <p className="text-[11px] text-dark/40 mt-0.5">{subTitle} · {item.tiers.length}</p>
          </div>
          <Tag size={14} className="text-dark/30 flex-none ms-3" />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
              className="overflow-hidden border-t border-dark/6"
            >
              <div className="px-4 py-2 space-y-1.5">
                {item.tiers.map(tier => {
                  const key = `${item.id}__${tier.label}`;
                  const cartItem = activeCart.items.find(i => i.key === key);
                  const tierLabel = isRTL && tier.labelAr ? tier.labelAr : tier.label;
                  return (
                    <div key={tier.label} className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-xs font-medium text-dark">{tierLabel}</span>
                        <span className="text-xs text-primary font-semibold ms-2">{tier.price}</span>
                      </div>
                      {cartItem ? (
                        <QtyControl qty={cartItem.qty} onMinus={() => onUpdateQty(key, -1)} onPlus={() => onAdd(item, cat, sub, tier)} />
                      ) : (
                        <button onClick={() => onAdd(item, cat, sub, tier)}
                          className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/25">
                          <Plus size={14} className="text-light" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const key = `${item.id}__`;
  const cartItem = activeCart.items.find(i => i.key === key);

  return (
    <div className="rounded-2xl border border-dark/8 bg-white flex items-center px-4 py-3 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark truncate">{itemName}</p>
        <p className="text-[11px] text-dark/40 mt-0.5">{subTitle}</p>
        {item.price && <p className="text-xs font-semibold text-primary mt-0.5">{item.price}</p>}
      </div>
      {cartItem ? (
        <QtyControl qty={cartItem.qty} onMinus={() => onUpdateQty(key, -1)} onPlus={() => onAdd(item, cat, sub)} />
      ) : (
        <button onClick={() => onAdd(item, cat, sub)}
          className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/25 flex-none">
          <Plus size={16} className="text-light" />
        </button>
      )}
    </div>
  );
}

// ── Qty control ────────────────────────────────────────────────────────────
function QtyControl({ qty, onMinus, onPlus }: { qty: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onMinus}
        className="w-7 h-7 rounded-lg bg-dark/6 flex items-center justify-center hover:bg-dark/10 transition-colors">
        <Minus size={12} className="text-dark/70" />
      </button>
      <span className="text-sm font-semibold text-dark w-5 text-center tabular-nums">{qty}</span>
      <button onClick={onPlus}
        className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
        <Plus size={12} className="text-light" />
      </button>
    </div>
  );
}

// ── Cart panel ─────────────────────────────────────────────────────────────
interface CartPanelProps {
  carts: Cart[];
  activeCartId: string;
  activeCart: Cart;
  onSelectCart: (id: string) => void;
  onNewCart: () => void;
  onCloseCart: (id: string) => void;
  onUpdateQty: (key: string, delta: number) => void;
  onPlaceOrder: () => void;
  showToast: (msg: string, kind?: "success" | "error" | "info") => void;
  className?: string;
}

function CartPanel({
  carts, activeCartId, activeCart,
  onSelectCart, onNewCart, onCloseCart, onUpdateQty, onPlaceOrder, showToast,
}: CartPanelProps) {
  const { t, isRTL } = useLang();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const total = cartTotal(activeCart);
  const count = cartCount(activeCart);
  const pendingCart = carts.find((c) => c.id === pendingDeleteId);

  return (
    <div className="flex flex-col h-full">
      {/* Cart tabs */}
      <div className="flex-none flex items-center gap-1 px-2 pt-2 pb-1 overflow-x-auto border-b border-dark/6">
        {carts.map(cart => (
          <div key={cart.id}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap flex-none",
              cart.id === activeCartId
                ? "bg-primary text-light"
                : "bg-dark/6 text-dark/50 hover:bg-dark/10"
            )}
            onClick={() => onSelectCart(cart.id)}
          >
            <span>{cart.label}</span>
            {cartCount(cart) > 0 && (
              <span className={cn(
                "text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center",
                cart.id === activeCartId ? "bg-light/20 text-light" : "bg-dark/10 text-dark/60"
              )}>
                {cartCount(cart)}
              </span>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                setPendingDeleteId(cart.id);
              }}
              className={cn("ms-0.5 rounded transition-colors",
                cart.id === activeCartId ? "text-light/60 hover:text-light" : "text-dark/30 hover:text-dark/60"
              )}
            >
              <X size={11} />
            </button>
          </div>
        ))}
        <button onClick={onNewCart}
          className="flex-none w-7 h-7 rounded-xl bg-dark/5 flex items-center justify-center text-dark/40 hover:bg-dark/10 hover:text-dark/70 transition-colors">
          <Plus size={14} />
        </button>
      </div>

      {/* Delete cart confirmation banner */}
      <AnimatePresence>
        {pendingDeleteId && pendingCart && (
          <motion.div
            key="delete-confirm"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border-b border-red-100">
              <Trash2 size={12} className="text-red-500 flex-none" />
              <span className="text-xs text-red-700 flex-1 truncate">{t("pos.cart_delete_confirm")} "{pendingCart.label}"?</span>
              <button
                onClick={() => {
                  onCloseCart(pendingDeleteId);
                  showToast(`${pendingCart.label} ${t("pos.toast_cart_deleted")}`, "info");
                  setPendingDeleteId(null);
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors px-1"
              >
                {t("pos.cart_delete_confirm")}
              </button>
              <button
                onClick={() => setPendingDeleteId(null)}
                className="text-xs text-dark/40 hover:text-dark/60 transition-colors"
              >
                {t("pos.cancel")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {activeCart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-dark/25 gap-2">
            <ShoppingCart size={24} />
            <p className="text-xs">{t("pos.cart_empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeCart.items.map(item => (
              <div key={item.key} className="flex items-start gap-2 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark leading-tight truncate">
                    {isRTL && item.nameAr ? item.nameAr : item.name}
                  </p>
                  {item.tierLabel && (
                    <p className="text-[10px] text-dark/40">
                      {isRTL && item.tierLabelAr ? item.tierLabelAr : item.tierLabel}
                    </p>
                  )}
                  <p className="text-[11px] text-primary font-semibold mt-0.5">{item.price}</p>
                </div>
                <QtyControl qty={item.qty}
                  onMinus={() => onUpdateQty(item.key, -1)}
                  onPlus={() => onUpdateQty(item.key, 1)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {count > 0 && (
        <div className="flex-none px-3 pb-3 pt-2 border-t border-dark/6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark/50 font-medium">{count} {t("pos.items_label")}</span>
            <span className="font-bold text-dark">{total.toFixed(2)}</span>
          </div>
          <button onClick={onPlaceOrder}
            className="w-full py-2.5 rounded-xl bg-primary text-light text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/20">
            {t("pos.place_order")}
          </button>
        </div>
      )}
    </div>
  );
}
