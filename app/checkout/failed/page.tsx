"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/lang-context";

function FailedContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const { t } = useLang();

  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.top!.location.href = window.location.href;
    }
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/8 mb-6">
          <XCircle size={40} className="text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-3">{t("checkout.failedTitle")}</h1>
        <p className="text-sm text-dark/55 leading-relaxed mb-6">{t("checkout.failedBody")}</p>

        {orderId && (
          <p className="text-xs text-dark/35 mb-8 font-mono">
            {t("checkout.orderId")} #{orderId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/checkout"
            className="inline-block px-8 py-3.5 rounded-2xl bg-primary text-light text-sm font-semibold
                       hover:bg-primary/90 transition-colors"
          >
            {t("checkout.tryAgain")}
          </Link>
          <Link
            href="/"
            className="inline-block px-8 py-3.5 rounded-2xl bg-dark/6 text-dark text-sm font-semibold
                       hover:bg-dark/10 transition-colors"
          >
            {t("checkout.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={28} className="text-dark/20 animate-spin" />
      </div>
    }>
      <FailedContent />
    </Suspense>
  );
}
