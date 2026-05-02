"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = params.get("success");
    const orderId = params.get("order") ?? params.get("order_id");
    const merchantOrderId = params.get("merchant_order_id");

    if (success === "true") {
      const dest = new URLSearchParams();
      if (orderId) dest.set("order_id", orderId);
      if (merchantOrderId) dest.set("booking_id", merchantOrderId);
      router.replace(`/checkout/success?${dest.toString()}`);
    } else {
      const dest = new URLSearchParams();
      if (orderId) dest.set("order_id", orderId);
      router.replace(`/checkout/failed?${dest.toString()}`);
    }
  }, [params, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <Loader2 size={28} className="text-dark/20 animate-spin" />
    </div>
  );
}

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 size={28} className="text-dark/20 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
