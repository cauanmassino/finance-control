"use client"

import { useMemo, useState } from "react"

type CashFlowPoint = {
  label: string
  income: number
  expense: number
  result: number
}

type CashFlowChartProps = {
  data: CashFlowPoint[]
  locale: string
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompactCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function getNiceMaxValue(values: number[]) {
  const maxValue = Math.max(...values, 0)

  if (maxValue <= 0) {
    return 100
  }

  const magnitude = 10 ** Math.floor(Math.log10(maxValue))
  const normalized = maxValue / magnitude

  const niceNormalized =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 5
          ? 5
          : 10

  return niceNormalized * magnitude
}

export function CashFlowChart({
  data,
  locale,
}: CashFlowChartProps) {
  const isEnglish = locale === "en"
  const [showDetails, setShowDetails] = useState(false)

  const chart = useMemo(() => {
    const width = 900
    const height = 300
    const padding = {
      top: 28,
      right: 24,
      bottom: 42,
      left: 64,
    }

    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom

    const safeData = data.length > 0
      ? data
      : [
          {
            label: "—",
            income: 0,
            expense: 0,
            result: 0,
          },
        ]

    const maxValue = getNiceMaxValue(
      safeData.flatMap((point) => [point.income, point.expense]),
    )

    const x = (index: number) => {
      if (safeData.length === 1) {
        return padding.left + innerWidth / 2
      }

      return (
        padding.left +
        (index / (safeData.length - 1)) * innerWidth
      )
    }

    const y = (value: number) =>
      padding.top + innerHeight - (value / maxValue) * innerHeight

    const buildPath = (key: "income" | "expense") =>
      safeData
        .map((point, index) => {
          const command = index === 0 ? "M" : "L"

          return `${command} ${x(index).toFixed(2)} ${y(
            point[key],
          ).toFixed(2)}`
        })
        .join(" ")

    const buildAreaPath = (key: "income" | "expense") => {
      const linePath = safeData
        .map((point, index) => {
          const command = index === 0 ? "M" : "L"

          return `${command} ${x(index).toFixed(2)} ${y(
            point[key],
          ).toFixed(2)}`
        })
        .join(" ")

      const lastX = x(safeData.length - 1)
      const firstX = x(0)
      const baseline = padding.top + innerHeight

      return `${linePath} L ${lastX.toFixed(
        2,
      )} ${baseline.toFixed(2)} L ${firstX.toFixed(
        2,
      )} ${baseline.toFixed(2)} Z`
    }

    const gridLines = Array.from({ length: 5 }, (_, index) => {
      const value = (maxValue / 4) * index

      return {
        value,
        y: y(value),
      }
    })

    return {
      width,
      height,
      padding,
      safeData,
      maxValue,
      x,
      y,
      buildPath,
      buildAreaPath,
      gridLines,
    }
  }, [data])

  const totalIncome = data.reduce(
    (total, point) => total + point.income,
    0,
  )

  const totalExpense = data.reduce(
    (total, point) => total + point.expense,
    0,
  )

  const netResult = totalIncome - totalExpense

  const periodLabel =
    data.length === 1
      ? isEnglish
        ? "Selected period"
        : "Período selecionado"
      : isEnglish
        ? `${data.length} months in the selected period`
        : `${data.length} meses no período selecionado`

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Selected period" : "Período selecionado"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Cash flow" : "Fluxo financeiro"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Income and expenses throughout the selected period."
              : "Receitas e despesas ao longo do período selecionado."}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-500">
            {periodLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          <span className="inline-flex items-center gap-2 text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.85)]" />
            {isEnglish ? "Income" : "Receitas"}
          </span>

          <span className="inline-flex items-center gap-2 text-rose-200">
            <span className="h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.85)]" />
            {isEnglish ? "Expenses" : "Despesas"}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="rounded-[1.4rem] border border-white/[0.08] bg-slate-950/35 p-3 sm:p-5">
          <div className="overflow-x-auto">
            <svg
              aria-label={
                isEnglish
                  ? "Line chart comparing income and expenses"
                  : "Gráfico de linhas comparando receitas e despesas"
              }
              className="min-w-[620px] w-full"
              role="img"
              viewBox={`0 0 ${chart.width} ${chart.height}`}
            >
              <defs>
                <linearGradient
                  id="income-area-gradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#6ee7b7"
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor="#6ee7b7"
                    stopOpacity="0"
                  />
                </linearGradient>

                <linearGradient
                  id="expense-area-gradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#fda4af"
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor="#fda4af"
                    stopOpacity="0"
                  />
                </linearGradient>

                <filter id="line-glow">
                  <feGaussianBlur
                    result="coloredBlur"
                    stdDeviation="3"
                  />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {chart.gridLines.map((line) => (
                <g key={line.value}>
                  <line
                    stroke="rgba(148,163,184,0.14)"
                    strokeDasharray="3 5"
                    strokeWidth="1"
                    x1={chart.padding.left}
                    x2={chart.width - chart.padding.right}
                    y1={line.y}
                    y2={line.y}
                  />

                  <text
                    fill="rgba(148,163,184,0.65)"
                    fontSize="11"
                    textAnchor="end"
                    x={chart.padding.left - 10}
                    y={line.y + 4}
                  >
                    {formatCompactCurrency(line.value, locale)}
                  </text>
                </g>
              ))}

              <path
                d={chart.buildAreaPath("income")}
                fill="url(#income-area-gradient)"
              />

              <path
                d={chart.buildAreaPath("expense")}
                fill="url(#expense-area-gradient)"
              />

              <path
                d={chart.buildPath("income")}
                fill="none"
                filter="url(#line-glow)"
                stroke="#6ee7b7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />

              <path
                d={chart.buildPath("expense")}
                fill="none"
                filter="url(#line-glow)"
                stroke="#fda4af"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />

              {chart.safeData.map((point, index) => (
                <g key={`${point.label}-${index}`}>
                  <circle
                    cx={chart.x(index)}
                    cy={chart.y(point.income)}
                    fill="#07111f"
                    r="5"
                    stroke="#6ee7b7"
                    strokeWidth="2.5"
                  />

                  <circle
                    cx={chart.x(index)}
                    cy={chart.y(point.expense)}
                    fill="#07111f"
                    r="5"
                    stroke="#fda4af"
                    strokeWidth="2.5"
                  />

                  <text
                    fill="rgba(203,213,225,0.75)"
                    fontSize="11"
                    textAnchor="middle"
                    x={chart.x(index)}
                    y={chart.height - 13}
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-xs font-medium text-slate-500">
              {isEnglish ? "Income in period" : "Receitas no período"}
            </p>

            <p className="mt-1.5 text-lg font-bold text-emerald-300">
              {formatCurrency(totalIncome, locale)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-xs font-medium text-slate-500">
              {isEnglish ? "Expenses in period" : "Despesas no período"}
            </p>

            <p className="mt-1.5 text-lg font-bold text-rose-300">
              {formatCurrency(totalExpense, locale)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-xs font-medium text-slate-500">
              {isEnglish ? "Net result" : "Resultado líquido"}
            </p>

            <p
              className={`mt-1.5 text-lg font-bold ${
                netResult >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {netResult >= 0 ? "+" : ""}
              {formatCurrency(netResult, locale)}
            </p>
          </div>
        </div>

        <button
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-200"
          onClick={() => setShowDetails((current) => !current)}
          type="button"
        >
          {showDetails
            ? isEnglish
              ? "Hide chart data"
              : "Ocultar dados do gráfico"
            : isEnglish
              ? "View chart data"
              : "Ver dados do gráfico"}
        </button>

        {showDetails ? (
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-slate-950/30">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="border-b border-white/[0.08] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    {isEnglish ? "Period" : "Período"}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {isEnglish ? "Income" : "Receitas"}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {isEnglish ? "Expenses" : "Despesas"}
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    {isEnglish ? "Result" : "Resultado"}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                {data.map((point, index) => (
                  <tr key={`${point.label}-row-${index}`}>
                    <td className="px-4 py-3">{point.label}</td>
                    <td className="px-4 py-3 text-right text-emerald-300">
                      {formatCurrency(point.income, locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-300">
                      {formatCurrency(point.expense, locale)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        point.result >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {point.result >= 0 ? "+" : ""}
                      {formatCurrency(point.result, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}