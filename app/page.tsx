"use client";

import { useEffect, useState } from "react";
import PartnerSelector, { type Partner } from "@/components/PartnerSelector";
import OrderForm from "@/components/OrderForm";

const STORAGE_KEY = "huevos_partner";

export default function Home() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Partner | null;
    if (saved) setPartner(saved);
    setHydrated(true);
  }, []);

  function selectPartner(name: Partner) {
    localStorage.setItem(STORAGE_KEY, name);
    setPartner(name);
  }

  function changePartner() {
    localStorage.removeItem(STORAGE_KEY);
    setPartner(null);
  }

  // Avoid flash before hydration
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!partner) {
    return <PartnerSelector onSelect={selectPartner} />;
  }

  return <OrderForm partner={partner} onChangePartner={changePartner} />;
}
