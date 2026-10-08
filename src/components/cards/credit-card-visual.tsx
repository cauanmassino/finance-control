"use client";

import {useState} from "react";

type CreditCardVisualProps = {
  name: string;
  institution: string | null;
  brand: string | null;
  lastFour: string | null;
  color: string;
  isActive: boolean;
  available: string;
  limit: string;
  isEnglish: boolean;
};

function getBrandLabel(brand: string | null) {
  if (!brand) return "CARD";

  const labels: Record<string, string> = {
    visa: "VISA",
    mastercard: "mastercard",
    amex: "AMEX",
    elo: "elo",
    hipercard: "HIPERCARD",
    other: "CARD",
  };

  return labels[brand] ?? brand.toUpperCase();
}

function getContrastColor(color: string) {
  const normalized = color.replace("#", "");

  if (normalized.length !== 6) {
    return "#ffffff";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  const luminance =
    (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#07111f" : "#ffffff";
}

export function CreditCardVisual({
  name,
  institution,
  brand,
  lastFour,
  color,
  isActive,
  available,
  limit,
  isEnglish,
}: CreditCardVisualProps) {
  const [isHovered, setIsHovered] = useState(false);
  const textColor = getContrastColor(color);
  const mutedColor =
    textColor === "#ffffff"
      ? "rgba(255,255,255,0.68)"
      : "rgba(7,17,31,0.64)";

  const background = `
    radial-gradient(circle at 85% 15%, rgba(255,255,255,0.28), transparent 28%),
    radial-gradient(circle at 10% 90%, rgba(255,255,255,0.16), transparent 32%),
    linear-gradient(135deg, ${color}, ${color}bb 48%, #08111f 140%)
  `;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative aspect-[1.586/1] overflow-hidden rounded-[1.45rem] border border-white/20 p-5 shadow-[0_22px_55px_rgba(0,0,0,0.28)] transition duration-500 sm:p-6 ${
          isHovered
            ? "-translate-y-1 shadow-[0_30px_70px_rgba(0,0,0,0.38)]"
            : ""
        }`}
        style={{
          background,
          color: textColor,
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.22'/%3E%3C/svg%3E\")",
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/20 blur-sm transition duration-700 group-hover:scale-125"
        />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{color: mutedColor}}
              >
                {institution || "Finance card"}
              </p>

              <p className="mt-1 max-w-[13rem] truncate text-sm font-semibold">
                {name}
              </p>
            </div>

            <div className="text-right">
              <span
                className="inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{
                  borderColor: mutedColor,
                  color: textColor,
                  backgroundColor:
                    textColor === "#ffffff"
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(7,17,31,0.08)",
                }}
              >
                {isActive
                  ? isEnglish
                    ? "Active"
                    : "Ativo"
                  : isEnglish
                    ? "Paused"
                    : "Pausado"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="h-8 w-11 rounded-lg border border-black/10 shadow-inner"
              style={{
                background:
                  "linear-gradient(135deg, #e7c982 0%, #fff1ad 48%, #bc8c35 100%)",
              }}
            >
              <div className="grid h-full grid-cols-2 opacity-40">
                <span className="border-r border-black/30" />
                <span />
              </div>
            </div>

            <span
              aria-hidden="true"
              className="text-2xl font-light leading-none opacity-80"
            >
              ))) 
            </span>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p
                className="font-mono text-base tracking-[0.2em] sm:text-lg"
                style={{fontVariantNumeric: "tabular-nums"}}
              >
                •••• •••• •••• {lastFour || "0000"}
              </p>

              <p
                className="mt-2 text-[9px] font-semibold uppercase tracking-[0.16em]"
                style={{color: mutedColor}}
              >
                {isEnglish ? "Digital credit card" : "Cartão de crédito digital"}
              </p>
            </div>

            <p className="text-right text-xl font-black lowercase italic">
              {getBrandLabel(brand)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {isEnglish ? "Available" : "Disponível"}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-200">
            {available}
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {isEnglish ? "Limit" : "Limite"}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-100">
            {limit}
          </p>
        </div>
      </div>
    </div>
  );
}