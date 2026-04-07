"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import { type Partner } from "./PartnerSelector";

/* ─── Price constants ─────────────────────────────────────── */
const PRICE_A_SINGLE = 18_000;
const PRICE_A_BULK   = 15_000; // 2+ bandejas
const PRICE_AA       = 21_000;
const PRICE_AAA      = 24_000;
const EGGS_PER_TRAY  = 30;

/* ─── Partner phone numbers ───────────────────────────────── */
const PARTNER_PHONES: Record<Partner, string> = {
  Juancho: "573108528165",
  Leo:     "573164984947",
  Juanpa:  "573142977068",
  David:   "573153008044",
};

/* ─── Frequency options ───────────────────────────────────── */
const FREQUENCIES = ["Cada semana", "Cada 15 días", "Cada mes"] as const;
type Frequency = (typeof FREQUENCIES)[number];

/* ─── Helpers ─────────────────────────────────────────────── */
function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function calcTotal(a: number, aa: number, aaa: number) {
  const priceA = a >= 2 ? PRICE_A_BULK : PRICE_A_SINGLE;
  return a * priceA + aa * PRICE_AA + aaa * PRICE_AAA;
}

function buildWhatsAppMsg(
  partner: string,
  client: string,
  address: string,
  addressExtra: string,
  phone: string,
  canLeaveAtDoor: boolean,
  deliveryInstructions: string,
  a: number, aa: number, aaa: number,
  total: number,
  comments: string,
  isRegularClient: boolean,
  deliveryFrequency: string
) {
  const priceA     = a >= 2 ? PRICE_A_BULK : PRICE_A_SINGLE;
  const totalTrays = a + aa + aaa;
  const totalEggs  = totalTrays * EGGS_PER_TRAY;

  const fullAddress = addressExtra.trim()
    ? `${address.trim()}, ${addressExtra.trim()}`
    : address.trim();

  const lines: string[] = [
    `🥚 *Pedido – Huevos Don Cipriano*`,
    `👤 *Socio:* ${partner}`,
    `📋 *Cliente:* ${client}`,
    `📍 *Dirección:* ${fullAddress}`,
    `📱 *WhatsApp:* ${phone}`,
    `🏠 *Portería:* ${canLeaveAtDoor ? "SÍ, se puede dejar" : "NO"}`,
  ];

  if (!canLeaveAtDoor && deliveryInstructions.trim()) {
    lines.push(`📝 *Instrucciones:* ${deliveryInstructions.trim()}`);
  }

  lines.push(`🔄 *Cliente regular:* ${isRegularClient ? `Sí — ${deliveryFrequency}` : "No"}`);


  lines.push(``);
  lines.push(`📦 *Detalle del pedido:*`);
  if (a > 0)   lines.push(`  • Huevo A (${fmt(priceA)}/bdja): ${a} bdja${a > 1 ? "s" : ""}`);
  if (aa > 0)  lines.push(`  • Huevo AA (${fmt(PRICE_AA)}/bdja): ${aa} bdja${aa > 1 ? "s" : ""}`);
  if (aaa > 0) lines.push(`  • Huevo AAA (${fmt(PRICE_AAA)}/bdja): ${aaa} bdja${aaa > 1 ? "s" : ""}`);
  lines.push(`  ─────────────────`);
  lines.push(`  Total: ${totalTrays} bandeja${totalTrays !== 1 ? "s" : ""} · ${totalEggs} huevos`);
  lines.push(``);
  lines.push(`💰 *Total a pagar: ${fmt(total)}*`);

  if (comments.trim()) {
    lines.push(``);
    lines.push(`💬 *Comentarios:* ${comments.trim()}`);
  }

  return lines.join("\n");
}

/* ─── Toggle component ────────────────────────────────────── */
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}
function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full flex-shrink-0
        transition-colors duration-200 focus:outline-none
        ${checked ? "bg-brand-700" : "bg-brand-200"}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow
          transition-transform duration-200
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}

/* ─── Counter component ───────────────────────────────────── */
interface CounterProps {
  label: string;
  price: string;
  discount?: string;
  discountActive?: boolean;
  value: number;
  onChange: (v: number) => void;
}
function Counter({ label, price, discount, discountActive, value, onChange }: CounterProps) {
  return (
    <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-3 border border-brand-200 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brand-900 text-sm">{label}</p>
        <p className="text-xs text-brand-400 leading-tight">{price}</p>
        {discount && (
          <p className={`text-xs font-medium leading-tight ${discountActive ? "text-brand-700" : "text-brand-400"}`}>
            {discount}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="
            w-9 h-9 rounded-full bg-brand-100 hover:bg-brand-200
            active:bg-brand-300 flex items-center justify-center
            text-brand-700 font-bold text-lg transition-colors
            border border-brand-200
          "
          aria-label={`Quitar una bandeja de ${label}`}
        >
          −
        </button>
        <span className="w-8 text-center font-bold text-brand-900 text-lg tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="
            w-9 h-9 rounded-full bg-brand-700 hover:bg-brand-800
            active:bg-brand-900 flex items-center justify-center
            text-brand-100 font-bold text-lg transition-colors shadow-sm
          "
          aria-label={`Agregar una bandeja de ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ─── Input / Textarea styles ─────────────────────────────── */
const inputCls = `
  w-full rounded-xl border border-brand-200 bg-white
  px-4 py-3
  focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
  text-base
`;

/* ─── Main component ──────────────────────────────────────── */
interface Props {
  partner: Partner;
  onChangePartner: () => void;
}

export default function OrderForm({ partner, onChangePartner }: Props) {
  const [client, setClient]                 = useState("");
  const [address, setAddress]               = useState("");
  const [addressExtra, setAddressExtra]     = useState("");
  const [phone, setPhone]                   = useState("+57 ");
  const [canLeaveAtDoor, setCanLeaveAtDoor] = useState(true);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [isRegularClient, setIsRegularClient] = useState(false);
  const [deliveryFrequency, setDeliveryFrequency] = useState<Frequency>("Cada semana");
  const [qtyA, setQtyA]     = useState(0);
  const [qtyAA, setQtyAA]   = useState(0);
  const [qtyAAA, setQtyAAA] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalTrays = qtyA + qtyAA + qtyAAA;
  const totalEggs  = totalTrays * EGGS_PER_TRAY;
  const total      = calcTotal(qtyA, qtyAA, qtyAAA);

  const handlePhoneChange = useCallback((v: string) => {
    if (!v.startsWith("+57")) {
      setPhone("+57 ");
      return;
    }
    setPhone(v);
  }, []);

  const isValid =
    client.trim() !== "" &&
    address.trim() !== "" &&
    phone.replace(/\D/g, "").length >= 12 &&
    totalTrays > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);

    // Build WhatsApp URL first — always sent regardless of Sheets result
    const msg = buildWhatsAppMsg(
      partner,
      client.trim(),
      address.trim(),
      addressExtra.trim(),
      phone.trim(),
      canLeaveAtDoor,
      deliveryInstructions,
      qtyA, qtyAA, qtyAAA,
      total,
      comments,
      isRegularClient,
      deliveryFrequency
    );
    const waUrl = `https://wa.me/${PARTNER_PHONES[partner]}?text=${encodeURIComponent(msg)}`;

    // Save to Sheets (best-effort — failure doesn't block WhatsApp)
    try {
      const payload = {
        partner,
        client:               client.trim(),
        address:              address.trim(),
        addressExtra:         addressExtra.trim(),
        phone:                phone.trim(),
        canLeaveAtDoor,
        deliveryInstructions: deliveryInstructions.trim(),
        isRegularClient,
        deliveryFrequency:    isRegularClient ? deliveryFrequency : "",
        qtyA,
        qtyAA,
        qtyAAA,
        total,
        comments: comments.trim(),
      };

      const res = await fetch("/api/save-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({ error: "Error desconocido" }));
        // Show warning but keep going
        setError(`⚠️ No se pudo guardar en Sheets: ${msg ?? "error desconocido"}. El pedido se enviará igual por WhatsApp.`);
      }
    } catch {
      setError("⚠️ Sin conexión con Sheets. El pedido se enviará igual por WhatsApp.");
    }

    // Reset form
    setClient("");
    setAddress("");
    setAddressExtra("");
    setPhone("+57 ");
    setCanLeaveAtDoor(true);
    setDeliveryInstructions("");
    setIsRegularClient(false);
    setDeliveryFrequency("Cada semana");
    setQtyA(0);
    setQtyAA(0);
    setQtyAAA(0);
    setComments("");

    // Navigate to WhatsApp — works on mobile without popup blocker
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setSubmitting(false);
  }


  return (
    <div className="min-h-screen bg-brand-50 pb-10">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="bg-brand-700 text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Image
            src="/img/logo.png"
            alt="Huevos Don Cipriano"
            width={44}
            height={44}
            className="rounded-full object-contain bg-white/10 p-0.5 flex-shrink-0"
            priority
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight truncate">Huevos Don Cipriano</h1>
            <p className="text-brand-300 text-xs">Socio: {partner}</p>
          </div>
          {/* Settings icon — changes partner */}
          <button
            onClick={onChangePartner}
            title="Cambiar socio"
            className="
              flex-shrink-0 p-2 rounded-full
              bg-brand-600 hover:bg-brand-500 active:bg-brand-800
              transition-colors
            "
            aria-label="Cambiar socio"
          >
            <svg className="w-5 h-5 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Form ────────────────────────────────────────────── */}
      <main className="max-w-lg mx-auto px-4 pt-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* ── Datos del cliente ─────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 space-y-4">
            <h2 className="text-brand-700 font-semibold text-base flex items-center gap-2">
              <span>📋</span> Datos del cliente
            </h2>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">
                Nombre del cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ej. María García"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">
                Dirección principal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Cra 45 #12-30, Bogotá"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">
                Apto / Torre / Casa / Referencias
              </label>
              <input
                type="text"
                value={addressExtra}
                onChange={(e) => setAddressExtra(e.target.value)}
                placeholder="Ej. Apto 301, Torre B, portón café"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+57 300 123 4567"
                className={inputCls}
                required
              />
            </div>
          </section>

          {/* ── Entrega ───────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 space-y-4">
            <h2 className="text-brand-700 font-semibold text-base flex items-center gap-2">
              <span>🏠</span> Entrega
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-800">¿Se puede dejar en portería?</p>
                <p className="text-xs text-brand-400">
                  {canLeaveAtDoor ? "Sí, autoriza dejarlo en portería" : "No, requiere entrega directa"}
                </p>
              </div>
              <Toggle
                checked={canLeaveAtDoor}
                onChange={(v) => {
                  setCanLeaveAtDoor(v);
                  if (v) setDeliveryInstructions("");
                }}
              />
            </div>

            {!canLeaveAtDoor && (
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1.5">
                  Instrucciones de entrega
                </label>
                <textarea
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Ej. Llamar al llegar, timbre roto, piso 3 apto 301..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            )}
          </section>

          {/* ── Cliente regular ───────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 space-y-4">
            <h2 className="text-brand-700 font-semibold text-base flex items-center gap-2">
              <span>🔄</span> Frecuencia
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-800">¿Es cliente regular?</p>
                <p className="text-xs text-brand-400">
                  {isRegularClient ? "Sí, tiene entrega programada" : "No, pedido único"}
                </p>
              </div>
              <Toggle
                checked={isRegularClient}
                onChange={(v) => {
                  setIsRegularClient(v);
                  if (!v) setDeliveryFrequency("Cada semana");
                }}
              />
            </div>

            {isRegularClient && (
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-2">
                  Frecuencia de entrega
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setDeliveryFrequency(f)}
                      className={`
                        py-2.5 px-2 rounded-xl text-xs font-semibold text-center
                        border-2 transition-all duration-150
                        ${deliveryFrequency === f
                          ? "bg-brand-700 border-brand-700 text-brand-100"
                          : "bg-brand-50 border-brand-200 text-brand-600 hover:border-brand-400"}
                      `}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Pedido ────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5 space-y-3">
            <h2 className="text-brand-700 font-semibold text-base flex items-center gap-2">
              <span>📦</span> Pedido
              <span className="text-xs text-brand-400 font-normal ml-1">(1 bandeja = 30 huevos)</span>
            </h2>

            <Counter
              label="Huevo A"
              price={`${fmt(PRICE_A_SINGLE)} / bandeja`}
              discount={qtyA >= 2 ? `✓ Descuento: ${fmt(PRICE_A_BULK)} c/u` : `2+ bandejas: ${fmt(PRICE_A_BULK)} c/u`}
              discountActive={qtyA >= 2}
              value={qtyA}
              onChange={setQtyA}
            />
            <Counter
              label="Huevo AA"
              price={`${fmt(PRICE_AA)} / bandeja`}
              value={qtyAA}
              onChange={setQtyAA}
            />
            <Counter
              label="Huevo AAA"
              price={`${fmt(PRICE_AAA)} / bandeja`}
              value={qtyAAA}
              onChange={setQtyAAA}
            />
          </section>

          {/* ── Resumen ───────────────────────────────────── */}
          {totalTrays > 0 && (
            <section className="bg-brand-700 rounded-2xl shadow-md p-5 text-white">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <span>💰</span> Resumen del pedido
              </h2>
              <div className="space-y-1.5 text-sm">
                {qtyA > 0 && (
                  <div className="flex justify-between">
                    <span className="text-brand-300">
                      Huevo A × {qtyA} bdja{qtyA > 1 ? "s" : ""}
                      {qtyA >= 2 && <span className="text-brand-100 ml-1">(desc.)</span>}
                    </span>
                    <span className="font-medium tabular-nums">
                      {fmt(qtyA * (qtyA >= 2 ? PRICE_A_BULK : PRICE_A_SINGLE))}
                    </span>
                  </div>
                )}
                {qtyAA > 0 && (
                  <div className="flex justify-between">
                    <span className="text-brand-300">Huevo AA × {qtyAA} bdja{qtyAA > 1 ? "s" : ""}</span>
                    <span className="font-medium tabular-nums">{fmt(qtyAA * PRICE_AA)}</span>
                  </div>
                )}
                {qtyAAA > 0 && (
                  <div className="flex justify-between">
                    <span className="text-brand-300">Huevo AAA × {qtyAAA} bdja{qtyAAA > 1 ? "s" : ""}</span>
                    <span className="font-medium tabular-nums">{fmt(qtyAAA * PRICE_AAA)}</span>
                  </div>
                )}
                <div className="border-t border-brand-600 pt-2 mt-2 flex justify-between text-brand-300 text-xs">
                  <span>{totalTrays} bandeja{totalTrays !== 1 ? "s" : ""}</span>
                  <span>{totalEggs.toLocaleString("es-CO")} huevos</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-1">
                  <span>Total</span>
                  <span className="tabular-nums">{fmt(total)}</span>
                </div>
              </div>
            </section>
          )}

          {/* ── Comentarios ───────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-5">
            <label className="block text-sm font-medium text-brand-700 mb-1.5">
              💬 Comentarios adicionales
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Observaciones, preferencias, próxima compra..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </section>

          {/* ── Error ─────────────────────────────────────── */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* ── Submit ────────────────────────────────────── */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="
              w-full py-4 rounded-2xl font-bold text-lg
              bg-brand-700 hover:bg-brand-800 active:bg-brand-900
              disabled:bg-brand-200 disabled:text-brand-400 disabled:cursor-not-allowed
              text-brand-100 shadow-md hover:shadow-lg
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando…
              </>
            ) : (
              <>
                <span>📲</span>
                <span>Registrar y enviar por WhatsApp</span>
              </>
            )}
          </button>

          {!isValid && (
            <p className="text-center text-xs text-brand-400">
              Completa nombre, dirección, WhatsApp y al menos 1 bandeja
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
