"use client";

import {useId, useState} from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {Card, CardContent} from "@/components/ui/card";
import {CategoryIcon} from "@/components/categories/category-icon";

type CategorySpending = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  amount: number;
  percentage: number;
};

type Props = {
  data: CategorySpending[];
  total: number;
  locale: string;
};

type ChartRow = CategorySpending & {
  fill: string;
  share: number;
};

const palette = [
  "#34d399",
  "#22d3ee",
  "#818cf8",
  "#fb7185",
  "#fbbf24",
  "#38bdf8",
  "#c084fc",
  "#fb923c",
  "#a3e635",
  "#f472b6",
];

function mixColor(hex: string, amount: number) {
  const channels = [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];

  const result = channels.map((channel) => {
    const mixed =
      amount >= 0
        ? channel + (255 - channel) * amount
        : channel * (1 + amount);

    return Math.max(0, Math.min(255, Math.round(mixed)))
      .toString(16)
      .padStart(2, "0");
  });

  return `#${result.join("")}`;
}

export function CategorySpendingChart({
  data,
  total,
  locale,
}: Props) {
  const en = locale === "en";

  const reactId = useId();
  const chartId = `finco-category-${reactId.replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  )}`;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = hoveredId ?? focusedId ?? selectedId;

  const currency = (amount: number) =>
    new Intl.NumberFormat(en ? "en-US" : "pt-BR", {
      style: "currency",
      currency: en ? "USD" : "BRL",
    }).format(amount);

  const percentage = (value: number) =>
    `${new Intl.NumberFormat(en ? "en-US" : "pt-BR", {
      maximumFractionDigits: 1,
    }).format(value)}%`;

  const positive = data
    .filter(
      (category) =>
        Number.isFinite(Number(category.amount)) &&
        Number(category.amount) > 0,
    )
    .map((category) => ({
      ...category,
      amount: Number(category.amount),
    }))
    .sort((first, second) => second.amount - first.amount);

  const sum = positive.reduce(
    (accumulator, category) => accumulator + category.amount,
    0,
  );

  const rows: ChartRow[] = positive.map((category, index) => ({
    ...category,
    fill:
      category.color &&
      /^#[0-9a-fA-F]{6}$/.test(category.color)
        ? category.color
        : palette[index % palette.length],
    share: sum > 0 ? (category.amount / sum) * 100 : 0,
  }));

  const activeCategory = rows.find(
    (category) => category.id === activeId,
  );

  const reportedTotal = Number.isFinite(total) ? total : sum;
  const mismatch = Math.abs(reportedTotal - sum) > 0.02;

  function toggleSelection(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  return (
    <Card className="relative isolate gap-0 overflow-hidden rounded-[1.7rem] border border-white/7 bg-gradient-to-br from-slate-900/95 via-slate-900/75 to-slate-950/75 py-0 text-slate-100 shadow-[0_18px_60px_rgba(0,0,0,0.12)] ring-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-emerald-300/6 blur-3xl"
      />

      <CardContent className="p-5 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="app-kicker">
              {en ? "Selected period" : "Período selecionado"}
            </p>

            <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
              {en
                ? "Spending by category"
                : "Gastos por categoria"}
            </h2>

            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
              {en
                ? "All expense categories. One clear view."
                : "Todas as categorias de gastos. Uma visão clara."}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-300/15 bg-rose-300/5 px-3.5 py-2.5 text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-rose-200/60">
              {en ? "Spent" : "Gasto"}
            </p>

            <p className="mt-1 text-sm font-semibold tabular-nums text-rose-200">
              {currency(reportedTotal)}
            </p>
          </div>
        </header>

        {sum > 0 ? (
          <div className="mt-6 grid min-w-0 items-start gap-6 min-[700px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="min-w-0">
              <div
                className="relative mx-auto h-[300px] w-full max-w-[340px]"
                aria-label={
                  en
                    ? "Expense distribution pie chart"
                    : "Gráfico de pizza da distribuição das despesas"
                }
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-4 left-1/2 h-7 w-3/5 -translate-x-1/2 rounded-full bg-black/30 blur-xl"
                />

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                >
                  <PieChart
                    accessibilityLayer
                    margin={{
                      top: 18,
                      right: 18,
                      bottom: 28,
                      left: 18,
                    }}
                  >
                    <defs>
{rows.map((category, index) => (
  <linearGradient
    key={category.id}
    id={`${chartId}-gradient-${index}`}
    gradientUnits="userSpaceOnUse"
    x1="0"
    y1="0"
    x2="0"
    y2="300"
  >
    <stop
      offset="0%"
      stopColor={mixColor(category.fill, 0.12)}
    />

    <stop
      offset="50%"
      stopColor={category.fill}
    />

    <stop
      offset="100%"
      stopColor={mixColor(category.fill, -0.14)}
    />
  </linearGradient>
))}


                    </defs>

                    <Pie
                      data={rows}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius="90%"
                      innerRadius={0}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      stroke="none"
                      strokeWidth={0}
                      
                      isAnimationActive={false}
                      onMouseEnter={(_entry, index) => {
                        setHoveredId(rows[index]?.id ?? null);
                      }}
                      onMouseLeave={() => {
                        setHoveredId(null);
                      }}
                      onClick={(_entry, index) => {
                        const category = rows[index];

                        if (category) {
                          toggleSelection(category.id);
                        }
                      }}
                    >
                      {rows.map((category, index) => (
                        <Cell
                          key={category.id}
                          fill={`url(#${chartId}-gradient-${index})`}
                          stroke="none"
                          strokeWidth={0}
                          fillOpacity={
                            activeCategory &&
                            activeCategory.id !== category.id
                              ? 0.65
                              : 1
                          }
                          className="transition-[fill-opacity] duration-150 motion-reduce:transition-none"
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      cursor={false}
                      content={({active, payload}) => {
                        if (!active || !payload?.length) {
                          return null;
                        }

                        const category = payload[0]
                          .payload as ChartRow | undefined;

                        if (
                          !category ||
                          !Number.isFinite(category.amount)
                        ) {
                          return null;
                        }

                        return (
                          <div className="max-w-64 rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-xs shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
                            <p className="flex items-center gap-2 font-medium text-slate-200">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    category.fill,
                                }}
                              />

                              {category.name}
                            </p>

                            <p className="mt-2 font-semibold tabular-nums text-white">
                              {currency(category.amount)}

                              <span className="ml-3 font-normal text-slate-400">
                                {percentage(category.share)}
                              </span>
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                className="mt-1 rounded-2xl border border-white/5 bg-white/2 px-4 py-3 text-center"
                aria-live="polite"
                aria-atomic="true"
              >
                <p className="truncate text-[11px] text-slate-400">
                  {activeCategory?.name ??
                    (en
                      ? "Total by category"
                      : "Total por categoria")}
                </p>

                <p className="mt-1 font-(family-name:--font-display) text-xl font-semibold tracking-tight tabular-nums text-slate-100">
                  {currency(activeCategory?.amount ?? sum)}
                </p>

                <p className="mt-1 text-[10px] text-slate-500">
                  {activeCategory
                    ? percentage(activeCategory.share)
                    : en
                      ? `${rows.length} categories with expenses`
                      : `${rows.length} categorias com gastos`}
                </p>
              </div>
            </div>

            <ul
              className="min-w-0 divide-y divide-white/5"
              aria-label={
                en
                  ? "All expense categories"
                  : "Todas as categorias de gastos"
              }
            >
              {rows.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    aria-pressed={
                      selectedId === category.id
                    }
                    onFocus={() => {
                      setFocusedId(category.id);
                    }}
                    onBlur={() => {
                      setFocusedId(null);
                    }}
                    onMouseEnter={() => {
                      setHoveredId(category.id);
                    }}
                    onMouseLeave={() => {
                      setHoveredId(null);
                    }}
                    onClick={() => {
                      toggleSelection(category.id);
                    }}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-300/50 ${
                      activeId === category.id
                        ? "bg-white/5"
                        : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          color: category.fill,
                          backgroundColor: `${category.fill}18`,
                        }}
                      >
                        <CategoryIcon
                          name={category.icon}
                          size={16}
                          strokeWidth={1.8}
                        />
                      </span>

                      <span className="min-w-0">
                        <span className="block wrap-break-word text-xs font-medium text-slate-200">
                          {category.name}
                        </span>

                        <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                category.fill,
                            }}
                          />

                          {percentage(category.share)}
                        </span>
                      </span>
                    </span>

                    <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-200">
                      {currency(category.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-10 text-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="mx-auto h-24 w-24 text-white/5"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="currentColor"
              />
            </svg>

            <p className="mt-4 text-sm font-medium text-slate-300">
              {en
                ? "No expenses in this period"
                : "Sem despesas neste período"}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {en
                ? "Expenses will appear here as transactions are recorded."
                : "As despesas aparecem aqui conforme os lançamentos são registrados."}
            </p>
          </div>
        )}

        {mismatch ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-5 text-amber-200"
          >
            {en
              ? "The category sum differs from total expenses. Check the dashboard data limits. Percentages refer to received categories."
              : "A soma das categorias difere do total de despesas. Confira os limites dos dados no dashboard. Os percentuais se referem às categorias recebidas."}
          </p>
        ) : null}

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-4">
          <span className="text-[11px] text-slate-500">
            {en
              ? "All categories · no grouping"
              : "Todas as categorias · sem agrupamento"}
          </span>

          <span className="text-xs font-medium tabular-nums text-slate-300">
            {currency(sum)}
          </span>
        </footer>
      </CardContent>
    </Card>
  );
}