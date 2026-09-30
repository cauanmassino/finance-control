type CategorySpending = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  amount: number;
  percentage: number;
};

type CategorySpendingChartProps = {
  data: CategorySpending[];
  total: number;
  locale: string;
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function CategorySpendingChart({
  data,
  total,
  locale,
}: CategorySpendingChartProps) {
  const isEnglish = locale === "en";

  return (
    <article className="app-surface rounded-[1.7rem] p-5 sm:p-6">
      <div>
        <p className="app-kicker">
          {isEnglish ? "Current month" : "Mês atual"}
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
          {isEnglish ? "Spending by category" : "Gastos por categoria"}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          {isEnglish
            ? "Your largest expense categories this month."
            : "As categorias que mais consumiram seu orçamento."}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-lg text-slate-400">
            ◌
          </span>

          <p className="mt-3 text-sm font-semibold text-slate-200">
            {isEnglish ? "No expenses this month" : "Sem despesas neste mês"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            {isEnglish
              ? "Expense categories will appear here."
              : "As categorias das suas despesas aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.map((category) => {
            const color = category.color ?? "#fb7185";

            return (
              <div key={category.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
                      style={{
                        backgroundColor: `${color}1f`,
                        color,
                      }}
                    >
                      {category.icon ?? "•"}
                    </span>

                    <span className="truncate text-sm font-semibold text-slate-200">
                      {category.name}
                    </span>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-100">
                      {formatCurrency(category.amount, locale)}
                    </p>

                    <p className="mt-0.5 text-[0.65rem] font-semibold text-slate-500">
                      {category.percentage.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${category.percentage}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 14px ${color}70`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
        <span className="text-xs font-medium text-slate-400">
          {isEnglish ? "Total expenses" : "Total de despesas"}
        </span>

        <span className="text-sm font-bold text-rose-200">
          {formatCurrency(total, locale)}
        </span>
      </div>
    </article>
  );
}