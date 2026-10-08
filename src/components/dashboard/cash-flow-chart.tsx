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

function getLabelInterval(totalPoints: number) {
  if (totalPoints > 24) {
    return 5
  }

  if (totalPoints > 14) {
    return 3
  }

  if (totalPoints > 8) {
    return 2
  }

  return 1
}

export function CashFlowChart({
  data,
  locale,
}: CashFlowChartProps) {
  const isEnglish = locale === "en"
  const [showDetails, setShowDetails] = useState(false)

  const chart = useMemo(() => {
    const safeData =
      data.length > 0
        ? data
        : [
            {
              label: "—",
              income: 0,
              expense: 0,
              result: 0,
            },
          ]

    /*
     * No mês, use pontos diários. Em intervalos longos, pontos mensais.
     * Em ambos os casos, a largura cresce conforme os grupos aumentam.
     */
    const isDailyView = false
    const groupSpacing = isDailyView ? 34 : 84
    const minimumWidth = isDailyView ? 720 : 620

    const width = Math.max(
      minimumWidth,
      116 + safeData.length * groupSpacing,
    )

    const height = 308

    const padding = {
      top: 26,
      right: 24,
      bottom: 46,
      left: 64,
    }

    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom

    const maxValue = getNiceMaxValue(
      safeData.flatMap((point) => [point.income, point.expense]),
    )

    const groupWidth = innerWidth / safeData.length
    const barGap = isDailyView ? 3 : 6
    const barWidth = Math.min(
      isDailyView ? 9 : 20,
      Math.max(4, (groupWidth - barGap * 3) / 2),
    )

    const y = (value: number) =>
      padding.top + innerHeight - (value / maxValue) * innerHeight

    const gridLines = Array.from({ length: 5 }, (_, index) => {
      const value = (maxValue / 4) * index

      return {
        value,
        y: y(value),
      }
    })

    const labelInterval = getLabelInterval(safeData.length)

    const shouldShowLabel = (index: number) =>
      index === 0 ||
      index === safeData.length - 1 ||
      index % labelInterval === 0

    const groupCenter = (index: number) =>
      padding.left + index * groupWidth + groupWidth / 2

    const needsHorizontalScroll =
      (isDailyView && safeData.length > 10) ||
      (!isDailyView && safeData.length > 5)

    return {
      width,
      height,
      padding,
      safeData,
      maxValue,
      groupWidth,
      barGap,
      barWidth,
      y,
      gridLines,
      labelInterval,
      shouldShowLabel,
      groupCenter,
      needsHorizontalScroll,
      isDailyView,
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
    chart.isDailyView
      ? isEnglish
        ? `${data.length} days in the selected period`
        : `${data.length} dias no período selecionado`
      : data.length === 1
        ? isEnglish
          ? "Selected period"
          : "Período selecionado"
        : isEnglish
          ? `${data.length} months in the selected period`
          : `${data.length} meses no período selecionado`

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Selected period" : "Período selecionado"}
          </p>

          <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Cash flow" : "Fluxo financeiro"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {chart.isDailyView
              ? isEnglish
                ? "Daily income and expenses in the selected period."
                : "Receitas e despesas diárias no período selecionado."
              : isEnglish
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

      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-slate-950/35">
          {chart.needsHorizontalScroll ? (
            <div className="flex items-center justify-between border-b border-white/6 px-4 py-2.5 sm:hidden">
              <p className="text-[11px] font-medium text-slate-500">
                {isEnglish
                  ? "Swipe sideways to explore the period"
                  : "Deslize para ver todo o período"}
              </p>

              <span
                aria-hidden="true"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300"
              >
                ← →
              </span>
            </div>
          ) : null}

          <div className="overflow-x-auto overscroll-x-contain scrollbar-thin [scrollbar-color:rgba(148,163,184,0.35)_transparent]">
            <div
              className="min-w-155 px-3 py-3 sm:px-5 sm:py-5"
              style={{ width: `${chart.width}px` }}
            >
              <svg
                aria-label={
                  isEnglish
                    ? "Bar chart comparing income and expenses"
                    : "Gráfico de barras comparando receitas e despesas"
                }
                className="block h-auto w-full"
                role="img"
                viewBox={`0 0 ${chart.width} ${chart.height}`}
              >
                <defs>
                  <linearGradient
                    id="income-bar-gradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>

                  <linearGradient
                    id="expense-bar-gradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#fecdd3" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                </defs>

                {chart.gridLines.map((line) => (
                  <g key={line.value}>
                    <line
                      stroke="rgba(148,163,184,0.13)"
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

                {chart.safeData.map((point, index) => {
                  const center = chart.groupCenter(index)
                  const baseline = chart.y(0)

                  const incomeHeight = Math.max(
                    0,
                    baseline - chart.y(point.income),
                  )

                  const expenseHeight = Math.max(
                    0,
                    baseline - chart.y(point.expense),
                  )

                  const incomeX =
                    center - chart.barGap / 2 - chart.barWidth

                  const expenseX = center + chart.barGap / 2

                  return (
                    <g key={`${point.label}-${index}`}>
                      {point.income > 0 ? (
                        <rect
                          fill="url(#income-bar-gradient)"
                          height={incomeHeight}
                          opacity="0.96"
                          rx={chart.barWidth / 2}
                          width={chart.barWidth}
                          x={incomeX}
                          y={baseline - incomeHeight}
                        />
                      ) : null}

                      {point.expense > 0 ? (
                        <rect
                          fill="url(#expense-bar-gradient)"
                          height={expenseHeight}
                          opacity="0.92"
                          rx={chart.barWidth / 2}
                          width={chart.barWidth}
                          x={expenseX}
                          y={baseline - expenseHeight}
                        />
                      ) : null}

                      {chart.shouldShowLabel(index) ? (
                        <text
                          fill="rgba(203,213,225,0.75)"
                          fontSize="11"
                          textAnchor="middle"
                          x={center}
                          y={chart.height - 13}
                        >
                          {point.label}
                        </text>
                      ) : null}
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/3.5 p-4">
            <p className="text-xs font-medium text-slate-500">
              {isEnglish ? "Income in period" : "Receitas no período"}
            </p>

            <p className="mt-1.5 text-lg font-bold text-emerald-300">
              {formatCurrency(totalIncome, locale)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/3.5 p-4">
            <p className="text-xs font-medium text-slate-500">
              {isEnglish ? "Expenses in period" : "Despesas no período"}
            </p>

            <p className="mt-1.5 text-lg font-bold text-rose-300">
              {formatCurrency(totalExpense, locale)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/3.5 p-4">
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
          className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/8 bg-white/2.5 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/6 hover:text-slate-200"
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
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/8 bg-slate-950/30">
            <table className="w-full min-w-130 text-left text-xs">
              <thead className="border-b border-white/8 text-slate-500">
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

              <tbody className="divide-y divide-white/6 text-slate-300">
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