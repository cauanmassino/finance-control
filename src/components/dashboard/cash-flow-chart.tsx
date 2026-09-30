type CashFlowPoint = {
  label: string;
  income: number;
  expense: number;
  result: number;
};

type CashFlowChartProps = {
  data: CashFlowPoint[];
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

export function CashFlowChart({
  data,
  locale,
}: CashFlowChartProps) {
  const isEnglish = locale === "en";

  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [item.income, item.expense]),
  );

  const totalIncome = data.reduce((total, item) => total + item.income, 0);
  const totalExpense = data.reduce(
    (total, item) => total + item.expense,
    0,
  );
  const totalResult = totalIncome - totalExpense;

  return (
    <article className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Six-month view" : "Visão em seis meses"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Cash flow" : "Fluxo financeiro"}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {isEnglish
              ? "Income and expenses across recent months."
              : "Receitas e despesas ao longo dos últimos meses."}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            {isEnglish ? "Income" : "Receitas"}
          </span>

          <span className="inline-flex items-center gap-1.5 text-rose-200">
            <span className="h-2 w-2 rounded-full bg-rose-300" />
            {isEnglish ? "Expenses" : "Despesas"}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 pt-6 sm:px-6 sm:pb-6">
        <div
          aria-label={
            isEnglish
              ? "Cash-flow bar chart for the last six months"
              : "Gráfico de barras do fluxo financeiro dos últimos seis meses"
          }
          className="relative grid h-64 grid-cols-6 items-end gap-2 rounded-2xl border border-white/[0.07] bg-slate-950/25 px-3 pb-8 pt-5 sm:gap-4 sm:px-5"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-white/[0.07]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-white/[0.07]"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-white/[0.07]"
          />

          {data.map((item) => {
            const incomeHeight = Math.max(
              item.income > 0 ? 5 : 0,
              (item.income / maxValue) * 100,
            );

            const expenseHeight = Math.max(
              item.expense > 0 ? 5 : 0,
              (item.expense / maxValue) * 100,
            );

            return (
              <div
                key={item.label}
                className="relative z-10 flex h-full min-w-0 items-end justify-center gap-1 sm:gap-1.5"
              >
                <div className="group relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-5 rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.2)] transition-all duration-500 group-hover:from-emerald-400 group-hover:to-emerald-200"
                    style={{height: `${incomeHeight}%`}}
                  />

                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-[0.65rem] font-semibold text-emerald-100 shadow-xl group-hover:block">
                    {formatCurrency(item.income, locale)}
                  </span>
                </div>

                <div className="group relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-5 rounded-t-md bg-gradient-to-t from-rose-500 to-rose-300 shadow-[0_0_18px_rgba(251,113,133,0.16)] transition-all duration-500 group-hover:from-rose-400 group-hover:to-rose-200"
                    style={{height: `${expenseHeight}%`}}
                  />

                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-[0.65rem] font-semibold text-rose-100 shadow-xl group-hover:block">
                    {formatCurrency(item.expense, locale)}
                  </span>
                </div>

                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3">
            <p className="text-xs text-slate-400">
              {isEnglish ? "Income in 6 months" : "Receitas em 6 meses"}
            </p>

            <p className="mt-1 text-sm font-bold text-emerald-200">
              {formatCompactCurrency(totalIncome, locale)}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3">
            <p className="text-xs text-slate-400">
              {isEnglish ? "Expenses in 6 months" : "Despesas em 6 meses"}
            </p>

            <p className="mt-1 text-sm font-bold text-rose-200">
              {formatCompactCurrency(totalExpense, locale)}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3">
            <p className="text-xs text-slate-400">
              {isEnglish ? "Net result" : "Resultado líquido"}
            </p>

            <p
              className={`mt-1 text-sm font-bold ${
                totalResult >= 0 ? "text-emerald-200" : "text-rose-200"
              }`}
            >
              {totalResult >= 0 ? "+" : ""}
              {formatCompactCurrency(totalResult, locale)}
            </p>
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
          <summary className="cursor-pointer text-xs font-semibold text-slate-300">
            {isEnglish ? "View chart data" : "Ver dados do gráfico"}
          </summary>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-2 pr-4 font-medium">
                    {isEnglish ? "Month" : "Mês"}
                  </th>

                  <th className="pb-2 pr-4 font-medium">
                    {isEnglish ? "Income" : "Receitas"}
                  </th>

                  <th className="pb-2 pr-4 font-medium">
                    {isEnglish ? "Expenses" : "Despesas"}
                  </th>

                  <th className="pb-2 font-medium">
                    {isEnglish ? "Result" : "Resultado"}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06] text-slate-300">
                {data.map((item) => (
                  <tr key={`data-${item.label}`}>
                    <td className="py-2 pr-4 font-medium">{item.label}</td>
                    <td className="py-2 pr-4 text-emerald-200">
                      {formatCurrency(item.income, locale)}
                    </td>
                    <td className="py-2 pr-4 text-rose-200">
                      {formatCurrency(item.expense, locale)}
                    </td>
                    <td
                      className={`py-2 ${
                        item.result >= 0
                          ? "text-emerald-200"
                          : "text-rose-200"
                      }`}
                    >
                      {item.result >= 0 ? "+" : ""}
                      {formatCurrency(item.result, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </article>
  );
}