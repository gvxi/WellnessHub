"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/lib/lang-context";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("order_id") ?? params.get("id");
  const { t } = useLang();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-3">{t("checkout.successTitle")}</h1>
        <p className="text-sm text-dark/55 leading-relaxed mb-6">{t("checkout.successBody")}</p>

        {orderId && (
          <p className="text-xs text-dark/35 mb-8 font-mono">
            {t("checkout.orderId")} #{orderId}
          </p>
        )}

        <Link
          href="/"
          className="inline-block px-8 py-3.5 rounded-2xl bg-primary text-light text-sm font-semibold
                     hover:bg-primary/90 transition-colors"
        >
          {t("checkout.backHome")}
        </Link>
      </div>
    </div>
  );
}
