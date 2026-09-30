"use client";

import {useState} from "react";
import {ChartHelpTooltip} from "@/components/financial-health/chart-help-tooltip";

type ExpenseTrendPoint = {
  label: string;
  value: number;
  isCurrent?: boolean;
};

type ExpenseTrendChartProps = {
  data: ExpenseTrendPoint[];
  average: number;
  locale: string;
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function ExpenseTrendChart({
  data,
  average,
  locale,
}: ExpenseTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null,
  );

  const isEnglish = locale === "en";
  const chartWidth = 720;
  const chartHeight = 270;
  const paddingX = 28;
  const paddingTop = 24;
  const paddingBottom = 42;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const maxValue = Math.max(...data.map((item) => item.value), average, 1);
  const chartMax = maxValue * 1.2;
  const barSpace = (chartWidth - paddingX * 2) / Math.max(data.length, 1);
  const barWidth = Math.min(barSpace * 0.58, 54);

  const averageY =
    paddingTop + ((chartMax - average) / chartMax) * innerHeight;

  const currentValue = data[data.length - 1]?.value ?? 0;
  const difference = currentValue - average;
  const differencePercentage =
    average > 0 ? (difference / average) * 100 : 0;

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How the expense trend works"
          : "Como funciona a evolução das despesas"
      }
      description={
        isEnglish
          ? "Each bar represents all expenses recorded in one month. The dashed line is your recent average, helping you identify unusually expensive months."
          : "Cada barra representa todas as despesas registradas em um mês. A linha tracejada é sua média recente e ajuda a identificar meses com gastos acima do normal."
      }
      example={
        isEnglish
          ? "A bar above the average line means you spent more than your typical month."
          : "Uma barra acima da linha de média indica que você gastou mais do que o normal naquele mês."
      }
    />
  );

  if (data.length === 0) {
    return (
      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <p className="app-kicker">
          {isEnglish ? "Spending behavior" : "Comportamento de gastos"}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Expense trend" : "Evolução das despesas"}
          </h2>

          {helpTooltip}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-8 text-center">
          <p className="text-sm text-slate-300">
            {isEnglish
              ? "No expense history is available yet."
              : "Ainda não existe histórico de despesas disponível."}
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
            {isEnglish ? "Spending behavior" : "Comportamento de gastos"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Expense trend" : "Evolução das despesas"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {isEnglish
              ? "Hover over a month to compare it with your average."
              : "Passe o mouse sobre um mês para compará-lo com sua média."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-medium text-slate-500">
            {isEnglish ? "Six-month average" : "Média de 6 meses"}
          </p>

          <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-100">
            {formatCurrency(average, locale)}
          </p>

          <p
            className={`mt-1 text-xs font-semibold ${
              difference <= 0 ? "text-emerald-200" : "text-rose-200"
            }`}
          >
            {difference > 0
              ? isEnglish
                ? `${differencePercentage.toFixed(0)}% above average`
                : `${differencePercentage.toFixed(0)}% acima da média`
              : isEnglish
                ? `${Math.abs(differencePercentage).toFixed(0)}% below average`
                : `${Math.abs(differencePercentage).toFixed(0)}% abaixo da média`}
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
                ? "Interactive expense trend chart"
                : "Gráfico interativo de evolução de despesas"
            }
            onMouseLeave={() => setActiveIndex(data.length - 1)}
          >
            <defs>
              <linearGradient
                id="expense-normal"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.55" />
              </linearGradient>

              <linearGradient
                id="expense-danger"
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75].map((step) => {
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

            <line
              x1={paddingX}
              x2={chartWidth - paddingX}
              y1={averageY}
              y2={averageY}
              stroke="#fbbf24"
              strokeDasharray="7 6"
              strokeWidth="2"
            />

            {data.map((item, index) => {
              const height = (item.value / chartMax) * innerHeight;
              const x =
                paddingX + index * barSpace + (barSpace - barWidth) / 2;
              const y = paddingTop + innerHeight - height;
              const isAboveAverage = item.value > average;
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
                  <rect
                    x={x - 8}
                    y={paddingTop}
                    width={barWidth + 16}
                    height={innerHeight}
                    fill="transparent"
                  />

                  {isActive ? (
                    <rect
                      x={x - 5}
                      y={paddingTop}
                      width={barWidth + 10}
                      height={innerHeight}
                      rx="12"
                      fill="rgba(255,255,255,0.04)"
                    />
                  ) : null}

                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    rx="8"
                    fill={
                      isAboveAverage
                        ? "url(#expense-danger)"
                        : "url(#expense-normal)"
                    }
                    opacity={isActive ? "1" : isCurrent ? "0.9" : "0.72"}
                  />

                  <text
                    x={x + barWidth / 2}
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

            {activeItem && activeIndex !== null
              ? (() => {
                  const height = (activeItem.value / chartMax) * innerHeight;
                  const x =
                    paddingX +
                    activeIndex * barSpace +
                    (barSpace - barWidth) / 2;
                  const y = paddingTop + innerHeight - height;
                  const tooltipWidth = 174;
                  const tooltipX =
                    x + barWidth / 2 > chartWidth - tooltipWidth - 16
                      ? x - tooltipWidth + barWidth / 2 - 12
                      : x + barWidth / 2 + 12;
                  const tooltipY = y < 94 ? y + 14 : y - 78;
                  const monthDifference = activeItem.value - average;

                  return (
                    <g pointerEvents="none">
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipWidth}
                        height="66"
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
                        y={tooltipY + 42}
                        fill="#f8fafc"
                        fontSize="14"
                        fontWeight="700"
                      >
                        {formatCurrency(activeItem.value, locale)}
                      </text>

                      <text
                        x={tooltipX + 12}
                        y={tooltipY + 57}
                        fill={monthDifference <= 0 ? "#6ee7b7" : "#fda4af"}
                        fontSize="10"
                        fontWeight="700"
                      >
                        {monthDifference >= 0 ? "+" : ""}
                        {formatCurrency(monthDifference, locale)}
                        {isEnglish ? " vs. average" : " vs. média"}
                      </text>
                    </g>
                  );
                })()
              : null}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400" />
            {isEnglish ? "At or below average" : "Na média ou abaixo"}
          </span>

          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-5 rounded-full bg-gradient-to-r from-rose-400 to-orange-400" />
            {isEnglish ? "Above average" : "Acima da média"}
          </span>

          <span className="inline-flex items-center gap-2">
            <span className="h-px w-5 border-t-2 border-dashed border-amber-300" />
            {isEnglish ? "Recent average" : "Média recente"}
          </span>
        </div>
      </div>
    </section>
  );
}
