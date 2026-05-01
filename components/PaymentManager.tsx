"use client";

import { useState } from "react";

interface Order {
  sheetRow:   number;
  fecha:      string;
  semana:     string;
  client:     string;
  address:    string;
  phone:      string;
  total:      string;
  pagoStatus: string;
}

function fmtCurrency(raw: string) {
  const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
  if (isNaN(n)) return raw;
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(n);
}

const inputCls = `
  w-full rounded-xl border border-brand-200 bg-white
  px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500
  focus:border-transparent text-base
`;

export default function PaymentManager() {
  const [query, setQuery]         = useState("");
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [updatingRow, setUpdatingRow] = useState<number | null>(null);

  async function search() {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/orders?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error("Error al consultar pedidos");
      const { orders: data } = await res.json() as { orders: Order[] };
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid(sheetRow: number) {
    setUpdatingRow(sheetRow);
    // Actualización optimista: inmediata en UI
    setOrders(prev =>
      prev.map(o => o.sheetRow === sheetRow ? { ...o, pagoStatus: "SÍ" } : o)
    );
    try {
      const res = await fetch("/api/update-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetRow }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
    } catch {
      // Revertir si falla
      setOrders(prev =>
        prev.map(o => o.sheetRow === sheetRow ? { ...o, pagoStatus: "Pendiente" } : o)
      );
      setError("No se pudo marcar como pagado. Revisa la conexión e intenta de nuevo.");
    } finally {
      setUpdatingRow(null);
    }
  }

  const pendientes = orders.filter(o => o.pagoStatus !== "SÍ").length;
  const pagados    = orders.filter(o => o.pagoStatus === "SÍ").length;

  return (
    <div className="pb-10">
      {/* Header */}
      <header className="bg-brand-700 text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto">
          <h1 className="font-bold text-lg leading-tight">Gestión de Pagos</h1>
          <p className="text-brand-300 text-xs">Consulta y registra pagos de pedidos</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Buscador */}
        <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 space-y-4">
          <h2 className="text-brand-700 font-semibold text-base flex items-center gap-2">
            <span>🔍</span> Buscar pedidos
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && search()}
              placeholder="Nombre del cliente (vacío = todos)"
              className={inputCls}
              autoComplete="off"
            />
            <button
              onClick={search}
              disabled={loading}
              className="
                flex-shrink-0 px-5 py-3 rounded-xl font-semibold text-sm
                bg-brand-700 hover:bg-brand-800 active:bg-brand-900
                text-white transition-colors disabled:bg-brand-300
              "
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : "Buscar"}
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Resumen rápido */}
        {searched && !loading && orders.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold text-brand-900">{orders.length}</p>
              <p className="text-xs text-brand-500 mt-0.5">Pedidos</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{pendientes}</p>
              <p className="text-xs text-amber-600 mt-0.5">Pendientes</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{pagados}</p>
              <p className="text-xs text-green-600 mt-0.5">Pagados</p>
            </div>
          </div>
        )}

        {/* Lista de pedidos */}
        {searched && !loading && (
          <section className="space-y-3">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-100 p-8 text-center">
                <p className="text-4xl mb-2">📭</p>
                <p className="text-brand-600 font-medium text-sm">No se encontraron pedidos</p>
                <p className="text-brand-400 text-xs mt-1">Intenta con otro nombre o deja vacío para ver todos</p>
              </div>
            ) : (
              orders.map((order) => {
                const paid = order.pagoStatus === "SÍ";
                return (
                  <div
                    key={order.sheetRow}
                    className={`
                      rounded-2xl shadow-sm border p-4 transition-all duration-300
                      ${paid
                        ? "bg-green-50 border-green-200"
                        : "bg-white border-brand-100"}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Info izquierda */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-brand-900 truncate">{order.client}</p>
                        <p className="text-xs text-brand-400 mt-0.5">{order.fecha}{order.semana ? ` · Semana ${order.semana}` : ""}</p>
                        <p className="text-base font-bold text-brand-700 mt-1.5">
                          {fmtCurrency(order.total)}
                        </p>
                      </div>

                      {/* Estado derecha */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`
                          text-xs font-semibold px-2.5 py-1 rounded-full
                          ${paid
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"}
                        `}>
                          {paid ? "✓ Pagado" : "Pendiente"}
                        </span>
                        {!paid && (
                          <button
                            onClick={() => markAsPaid(order.sheetRow)}
                            disabled={updatingRow === order.sheetRow}
                            className="
                              text-xs font-semibold px-3 py-2 rounded-xl
                              bg-brand-700 hover:bg-brand-800 active:bg-brand-900
                              text-white transition-colors
                              disabled:bg-brand-300 disabled:cursor-not-allowed
                              flex items-center gap-1.5
                            "
                          >
                            {updatingRow === order.sheetRow ? (
                              <>
                                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                                Guardando…
                              </>
                            ) : (
                              <>💳 Marcar pagado</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>
    </div>
  );
}
