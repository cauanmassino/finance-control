"use client";

import {useState} from "react";
import {ChartHelpTooltip} from "@/components/financial-health/chart-help-tooltip";

type NetWorthPoint = {
  label: string;
  value: number;
  isCurrent?: boolean;
};

type NetWorthChartProps = {
  data: NetWorthPoint[];
  locale: string;
};

function formatCompactCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function NetWorthChart({data, locale}: NetWorthChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null,
  );

  const isEnglish = locale === "en";
  const chartWidth = 720;
  const chartHeight = 270;
  const paddingX = 28;
  const paddingTop = 26;
  const paddingBottom = 42;

  const values = data.map((item) => item.value);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 0);
  const range = rawMax - rawMin || 1;
  const chartMin = rawMin - range * 0.12;
  const chartMax = rawMax + range * 0.12;
  const chartRange = chartMax - chartMin || 1;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (data.length <= 1) {
      return chartWidth / 2;
    }

    return paddingX + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (value: number) => {
    return paddingTop + ((chartMax - value) / chartRange) * innerHeight;
  };

  const coordinates = data.map((item, index) => ({
    x: getX(index),
    y: getY(item.value),
  }));

  const linePath = coordinates
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");

  const areaPath =
    coordinates.length > 0
      ? `${linePath} L ${coordinates[coordinates.length - 1].x.toFixed(
          2,
        )} ${(chartHeight - paddingBottom).toFixed(2)} L ${coordinates[0].x.toFixed(
          2,
        )} ${(chartHeight - paddingBottom).toFixed(2)} Z`
      : "";

  const firstValue = data[0]?.value ?? 0;
  const currentValue = data[data.length - 1]?.value ?? 0;
  const change = currentValue - firstValue;
  const changePercentage =
    firstValue !== 0 ? (change / Math.abs(firstValue)) * 100 : 0;

  const activeItem = activeIndex !== null ? data[activeIndex] : null;
  const activePoint = activeIndex !== null ? coordinates[activeIndex] : null;

  const activePreviousValue =
    activeIndex !== null && activeIndex > 0
      ? data[activeIndex - 1].value
      : null;

  const activeChange =
    activeItem && activePreviousValue !== null
      ? activeItem.value - activePreviousValue
      : null;

  const tooltipWidth = 175;

  const tooltipX =
    activePoint && activePoint.x > chartWidth - tooltipWidth - 16
      ? activePoint.x - tooltipWidth - 12
      : activePoint
        ? activePoint.x + 12
        : 0;

  const tooltipY =
    activePoint && activePoint.y < 98
      ? activePoint.y + 14
      : activePoint
        ? activePoint.y - 82
        : 0;

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How net worth history works"
          : "Como funciona o histórico patrimonial"
      }
      description={
        isEnglish
          ? "This chart shows the combined balance of all your accounts at the end of each month. Income increases it, expenses reduce it, and transfers only move money between accounts."
          : "Este gráfico mostra a soma dos saldos de todas as suas contas ao fim de cada mês. Receitas aumentam o patrimônio, despesas reduzem e transferências apenas movem dinheiro entre contas."
      }
      example={
        isEnglish
          ? "If you end March with $5,000 and April with $5,600, your net worth increased by $600."
          : "Se você termina março com R$ 5.000 e abril com R$ 5.600, seu patrimônio cresceu R$ 600."
      }
    />
  );

  if (data.length === 0) {
    return (
      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <p className="app-kicker">
          {isEnglish ? "Long-term view" : "Visão de longo prazo"}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Net worth history" : "Histórico do patrimônio"}
          </h2>

          {helpTooltip}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-8 text-center">
          <p className="text-sm font-medium text-slate-200">
            {isEnglish
              ? "There is not enough data to show your history yet."
              : "Ainda não há dados suficientes para mostrar seu histórico."}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {isEnglish
              ? "Record transactions over time to track your net worth."
              : "Registre lançamentos ao longo do tempo para acompanhar seu patrimônio."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Long-term view" : "Visão de longo prazo"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Net worth history" : "Histórico do patrimônio"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {isEnglish
              ? "Hover over a month to inspect your balance."
              : "Passe o mouse sobre um mês para ver seu saldo."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-medium text-slate-500">
            {isEnglish ? "Current net worth" : "Patrimônio atual"}
          </p>

          <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-100">
            {formatCurrency(currentValue, locale)}
          </p>

          <p
            className={`mt-1 text-xs font-semibold ${
              change >= 0 ? "text-emerald-200" : "text-rose-200"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {formatCompactCurrency(change, locale)}
            {firstValue !== 0
              ? ` (${change >= 0 ? "+" : ""}${changePercentage.toFixed(1)}%)`
              : ""}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="min-w-[620px] w-full touch-none"
            role="img"
            aria-label={
              isEnglish
                ? "Interactive net worth history chart"
                : "Gráfico interativo do histórico patrimonial"
            }
            onMouseLeave={() => setActiveIndex(data.length - 1)}
          >
            <defs>
              <linearGradient id="net-worth-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="net-worth-line" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>

            {[0.2, 0.4, 0.6, 0.8].map((step) => {
              const y = paddingTop + innerHeight * step;

              return (
                <line
                  key={step}
                  x1={paddingX}
                  x2={chartWidth - paddingX}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="4 6"
                />
              );
            })}

            <path d={areaPath} fill="url(#net-worth-area)" />

            <path
              d={linePath}
              fill="none"
              stroke="url(#net-worth-line)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {activePoint ? (
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={paddingTop}
                y2={chartHeight - paddingBottom}
                stroke="rgba(203,213,225,0.34)"
                strokeDasharray="4 5"
              />
            ) : null}

            {coordinates.map((point, index) => {
              const item = data[index];
              const isCurrent = item.isCurrent || index === data.length - 1;
              const isActive = index === activeIndex;

              return (
                <g
                  key={`${item.label}-${index}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.label}: ${formatCurrency(item.value, locale)}`}
                  onFocus={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onTouchStart={() => setActiveIndex(index)}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={point.x} cy={point.y} fill="transparent" r="18" />

                  {isActive ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      fill={isCurrent ? "#34d399" : "#67e8f9"}
                      opacity="0.18"
                      r="12"
                    />
                  ) : null}

                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill={isCurrent ? "#34d399" : "#0f172a"}
                    r={isActive ? "5" : isCurrent ? "4.5" : "3.5"}
                    stroke={isCurrent ? "#d1fae5" : "#67e8f9"}
                    strokeWidth={isActive ? "2.5" : "2"}
                  />

                  <text
                    x={point.x}
                    y={chartHeight - 12}
                    fill={isActive ? "#f8fafc" : "rgba(203,213,225,0.8)"}
                    fontSize="11"
                    fontWeight={isActive ? "700" : "400"}
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}

            {activeItem && activePoint ? (
              <g pointerEvents="none">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height="68"
                  rx="10"
                  fill="rgba(15,23,42,0.96)"
                  stroke="rgba(255,255,255,0.14)"
                />

                <text x={tooltipX + 12} y={tooltipY + 20} fill="#cbd5e1" fontSize="11">
                  {activeItem.isCurrent
                    ? isEnglish
                      ? `${activeItem.label} · current`
                      : `${activeItem.label} · atual`
                    : activeItem.label}
                </text>

                <text
                  x={tooltipX + 12}
                  y={tooltipY + 42}
                  fill="#f8fafc"
                  fontSize="14"
                  fontWeight="700"
                >
                  {formatCurrency(activeItem.value, locale)}
                </text>

                {activeChange !== null ? (
                  <text
                    x={tooltipX + 12}
                    y={tooltipY + 58}
                    fill={activeChange >= 0 ? "#6ee7b7" : "#fda4af"}
                    fontSize="10"
                    fontWeight="700"
                  >
                    {activeChange >= 0 ? "+" : ""}
                    {formatCurrency(activeChange, locale)}
                    {isEnglish ? " vs. prior month" : " vs. mês anterior"}
                  </text>
                ) : null}
              </g>
            ) : null}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            {isEnglish ? "Monthly balance" : "Saldo mensal"}
          </span>

          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
            {isEnglish ? "Current month" : "Mês atual"}
          </span>
        </div>
      </div>
    </section>
  );
}
