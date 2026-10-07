"use client"

export type SpendingSource = {
  id: string
  name: string
  kind: "account" | "credit_card" | "other"
  color: string
  amount: number
  percentage: number
}

type SpendingSourceChartProps = {
  data: SpendingSource[]
  total: number
  locale: string
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value)
}

export function SpendingSourceChart({
  data,
  total,
  locale,
}: SpendingSourceChartProps) {
  const isEnglish = locale === "en"

  return (
    <article className="app-surface rounded-[1.7rem] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Spending source" : "Origem dos gastos"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Where your money went" : "De onde saiu o dinheiro"}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Expenses grouped by bank account and credit card."
              : "Despesas agrupadas por conta bancária e cartão de crédito."}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300/10 text-lg text-amber-200">
          ↘
        </span>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.025] p-6 text-center">
          <p className="text-sm text-slate-300">
            {isEnglish
              ? "No expenses found in this period."
              : "Nenhuma despesa encontrada neste período."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((source) => (
            <div key={source.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_12px_currentColor]"
                    style={{
                      backgroundColor: source.color,
                      color: source.color,
                    }}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-200">
                      {source.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {source.kind === "credit_card"
                        ? isEnglish
                          ? "Credit card"
                          : "Cartão de crédito"
                        : source.kind === "account"
                          ? isEnglish
                            ? "Bank account"
                            : "Conta bancária"
                          : isEnglish
                            ? "Other"
                            : "Outro"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-100">
                    {formatCurrency(source.amount, locale)}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {source.percentage.toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(source.percentage, 100)}%`,
                    backgroundColor: source.color,
                  }}
                />
              </div>
            </div>
          ))}

          <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {isEnglish ? "Total expenses" : "Total de despesas"}
            </span>

            <span className="text-sm font-bold text-rose-300">
              {formatCurrency(total, locale)}
            </span>
          </div>
        </div>
      )}
    </article>
  )
}