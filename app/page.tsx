"use client";

import { useState } from "react";
import OrderForm from "@/components/OrderForm";
import PaymentManager from "@/components/PaymentManager";

type Tab = "pedido" | "pagos";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("pedido");

  return (
    <div className="min-h-screen bg-brand-50">
      <nav className="sticky top-0 z-50 bg-brand-800 px-4 pt-3 pb-2 flex gap-2 shadow-lg">
        <button
          onClick={() => setActiveTab("pedido")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${activeTab === "pedido"
              ? "bg-white text-brand-800 shadow-sm"
              : "text-brand-400 hover:text-brand-100"
            }`}
        >
          📋 Nuevo Pedido
        </button>
        <button
          onClick={() => setActiveTab("pagos")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${activeTab === "pagos"
              ? "bg-white text-brand-800 shadow-sm"
              : "text-brand-400 hover:text-brand-100"
            }`}
        >
          💳 Gestión de Pagos
        </button>
      </nav>

      {activeTab === "pedido" && <OrderForm partner="Juancho" />}
      {activeTab === "pagos" && <PaymentManager />}
    </div>
  );
}
