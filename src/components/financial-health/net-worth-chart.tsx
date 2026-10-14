"use client";

import {useId, useState} from "react";
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

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercentage(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function NetWorthChart({data, locale}: NetWorthChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const componentId = useId().replace(/:/g, "");

  const areaGradientId = `account-balance-area-${componentId}`;
  const lineGradientId = `account-balance-line-${componentId}`;

  const isEnglish = locale === "en";

  const chartWidth = 720;
  const chartHeight = 270;
  const paddingX = 28;
  const paddingTop = 26;
  const paddingBottom = 42;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const chartBottom = chartHeight - paddingBottom;

  const lastIndex = data.length - 1;

  const activeIndex =
    data.length === 0
      ? null
      : selectedIndex === null
        ? lastIndex
        : clamp(selectedIndex, 0, lastIndex);

  const values = data.map((item) => item.value);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 0);
  const range = rawMax - rawMin || 1;

  const chartMin = rawMin - range * 0.12;
  const chartMax = rawMax + range * 0.12;
  const chartRange = chartMax - chartMin || 1;

  function getX(index: number) {
    if (data.length <= 1) {
      return chartWidth / 2;
    }

    return paddingX + (index / (data.length - 1)) * innerWidth;
  }

  function getY(value: number) {
    return paddingTop + ((chartMax - value) / chartRange) * innerHeight;
  }

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

  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];

  const areaPath =
    coordinates.length > 1 && firstPoint && lastPoint
      ? `${linePath} L ${lastPoint.x.toFixed(2)} ${chartBottom.toFixed(
          2,
        )} L ${firstPoint.x.toFixed(2)} ${chartBottom.toFixed(2)} Z`
      : "";

  const currentValue = data[lastIndex]?.value ?? 0;

  const previousValue =
    data.length >= 2 ? data[data.length - 2].value : null;

  const change =
    previousValue !== null ? currentValue - previousValue : null;

  const changePercentage =
    change !== null && previousValue !== null && previousValue !== 0
      ? (change / Math.abs(previousValue)) * 100
      : null;

  const activeItem =
    activeIndex !== null ? data[activeIndex] : null;

  const activePoint =
    activeIndex !== null ? coordinates[activeIndex] : null;

  const activePreviousValue =
    activeIndex !== null && activeIndex > 0
      ? data[activeIndex - 1].value
      : null;

  const activeChange =
    activeItem && activePreviousValue !== null
      ? activeItem.value - activePreviousValue
      : null;

  const tooltipWidth = 220;
  const tooltipHeight = 84;

  const preferredTooltipX = activePoint
    ? activePoint.x > chartWidth - tooltipWidth - 16
      ? activePoint.x - tooltipWidth - 12
      : activePoint.x + 12
    : 0;

  const preferredTooltipY = activePoint
    ? activePoint.y < paddingTop + tooltipHeight + 12
      ? activePoint.y + 14
      : activePoint.y - tooltipHeight - 14
    : 0;

  const tooltipX = clamp(
    preferredTooltipX,
    8,
    chartWidth - tooltipWidth - 8,
  );

  const tooltipY = clamp(
    preferredTooltipY,
    8,
    chartBottom - tooltipHeight - 8,
  );

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How account balance history works"
          : "Como funciona o histórico do saldo em contas"
      }
      description={
        isEnglish
          ? "This chart combines the balances of your registered accounts. Previous months show closing balances; the current month shows the balance up to today. Credit card purchases do not reduce account balances. Paying a statement from an account reduces that account's balance."
          : "Este gráfico soma os saldos das contas cadastradas. Meses anteriores mostram o saldo de fechamento; o mês atual mostra o saldo até hoje. Compras no crédito não reduzem os saldos das contas. Pagar uma fatura usando uma conta reduz o saldo dessa conta."
      }
      example={
        isEnglish
          ? "If your accounts hold $3,000 and $2,000, the total is $5,000. A credit card purchase does not change this total until money leaves an account to pay the statement."
          : "Se suas contas têm R$ 3.000 e R$ 2.000, o total é R$ 5.000. Uma compra no crédito não altera esse total até que dinheiro saia de uma conta para pagar a fatura."
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
          <h2 className="font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish
              ? "Account balance history"
              : "Histórico do saldo em contas"}
          </h2>

          {helpTooltip}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-white/12 bg-white/2.5 p-8 text-center">
          <p className="text-sm font-medium text-slate-200">
            {isEnglish
              ? "There is no account balance history available yet."
              : "Ainda não há histórico de saldo em contas disponível."}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {isEnglish
              ? "Register your accounts and transactions to follow your balances over time."
              : "Cadastre suas contas e lançamentos para acompanhar os saldos ao longo do tempo."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="app-kicker">
            {isEnglish ? "Long-term view" : "Visão de longo prazo"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish
                ? "Account balance history"
                : "Histórico do saldo em contas"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {isEnglish
              ? "Hover over or tap a month to inspect the combined balance of your accounts."
              : "Passe o mouse ou toque em um mês para ver a soma dos saldos das suas contas."}
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">
            {isEnglish ? "Total account balance" : "Saldo total em contas"}
          </p>

          <p className="mt-1 font-(family-name:--font-display) text-xl font-semibold tabular-nums tracking-[-0.04em] text-slate-100">
            {formatCurrency(currentValue, locale)}
          </p>

          {change !== null ? (
            <>
              <p
                className={`mt-1 text-xs font-semibold tabular-nums ${
                  change >= 0 ? "text-emerald-200" : "text-rose-200"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {formatCurrency(change, locale)}
                {changePercentage !== null
                  ? ` (${change >= 0 ? "+" : ""}${formatPercentage(
                      changePercentage,
                      locale,
                    )}%)`
                  : ""}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isEnglish ? "vs. prior month" : "vs. mês anterior"}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              {isEnglish
                ? "No prior month available in this chart."
                : "Sem mês anterior disponível neste gráfico."}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[620px]"
            role="group"
            aria-label={
              isEnglish
                ? "Interactive account balance history chart"
                : "Gráfico interativo do histórico do saldo em contas"
            }
            onMouseLeave={() => setSelectedIndex(null)}
          >
            <defs>
              <linearGradient
                id={areaGradientId}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>

              <linearGradient
                id={lineGradientId}
                x1="0"
                x2="1"
                y1="0"
                y2="0"
              >
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

            {areaPath ? (
              <path d={areaPath} fill={`url(#${areaGradientId})`} />
            ) : null}

            <path
              d={linePath}
              fill="none"
              stroke={`url(#${lineGradientId})`}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {activePoint ? (
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={paddingTop}
                y2={chartBottom}
                stroke="rgba(203,213,225,0.34)"
                strokeDasharray="4 5"
              />
            ) : null}

            {coordinates.map((point, index) => {
              const item = data[index];
              const isCurrent = Boolean(item.isCurrent);
              const isActive = index === activeIndex;

              return (
                <g
                  key={`${item.label}-${index}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.label}: ${formatCurrency(
                    item.value,
                    locale,
                  )}`}
                  aria-pressed={isActive}
                  onFocus={() => setSelectedIndex(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedIndex(index);
                    }

                    if (event.key === "Escape") {
                      setSelectedIndex(null);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="transparent"
                    r="18"
                  />

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
                    r={isActive ? 5 : isCurrent ? 4.5 : 3.5}
                    stroke={isCurrent ? "#d1fae5" : "#67e8f9"}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  <text
                    x={point.x}
                    y={chartHeight - 12}
                    fill={
                      isActive
                        ? "#f8fafc"
                        : "rgba(203,213,225,0.8)"
                    }
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
              <g pointerEvents="none" aria-hidden="true">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="10"
                  fill="rgba(15,23,42,0.96)"
                  stroke="rgba(255,255,255,0.14)"
                />

                <text
                  x={tooltipX + 12}
                  y={tooltipY + 20}
                  fill="#cbd5e1"
                  fontSize="11"
                >
                  {activeItem.isCurrent
                    ? isEnglish
                      ? `${activeItem.label} · current`
                      : `${activeItem.label} · atual`
                    : activeItem.label}
                </text>

                <text
                  x={tooltipX + 12}
                  y={tooltipY + 43}
                  fill="#f8fafc"
                  fontSize="14"
                  fontWeight="700"
                >
                  {formatCurrency(activeItem.value, locale)}
                </text>

                <text
                  x={tooltipX + 12}
                  y={tooltipY + 66}
                  fill={
                    activeChange === null
                      ? "#94a3b8"
                      : activeChange >= 0
                        ? "#6ee7b7"
                        : "#fda4af"
                  }
                  fontSize="10"
                  fontWeight="700"
                >
                  {activeChange !== null
                    ? `${activeChange >= 0 ? "+" : ""}${formatCurrency(
                        activeChange,
                        locale,
                      )}${isEnglish ? " vs. prior month" : " vs. mês anterior"}`
                    : isEnglish
                      ? "First month available"
                      : "Primeiro mês disponível"}
                </text>
              </g>
            ) : null}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-5 rounded-full bg-linear-to-r from-cyan-400 to-emerald-400" />
            {isEnglish
              ? "Combined account balance"
              : "Saldo consolidado das contas"}
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