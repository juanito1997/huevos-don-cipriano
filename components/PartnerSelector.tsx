"use client";

import Image from "next/image";

const PARTNERS = ["Juancho", "Leo", "Juanpa", "David"] as const;
export type Partner = (typeof PARTNERS)[number];

interface Props {
  onSelect: (name: Partner) => void;
}

export default function PartnerSelector({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/img/logo.png"
          alt="Huevos Don Cipriano"
          width={180}
          height={180}
          className="object-contain drop-shadow-md"
          priority
        />
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-7 border border-brand-100">
          <h1 className="text-2xl font-bold text-brand-800 text-center mb-1">
            Huevos Don Cipriano
          </h1>
          <p className="text-brand-600 text-center text-sm mb-7">
            ¿Quién está tomando pedidos hoy?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {PARTNERS.map((name) => (
              <button
                key={name}
                onClick={() => onSelect(name)}
                className="
                  flex items-center justify-center
                  bg-brand-50 hover:bg-brand-100
                  active:bg-brand-200
                  border-2 border-brand-200 hover:border-brand-400
                  rounded-xl py-5 px-4
                  text-brand-800 font-semibold text-lg
                  transition-all duration-150
                  shadow-sm hover:shadow
                "
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-brand-500 mt-5">
          Tu nombre se guardará automáticamente
        </p>
      </div>
    </div>
  );
}

export { PARTNERS };
