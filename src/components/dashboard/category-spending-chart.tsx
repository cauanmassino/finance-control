import {CategoryIcon} from "@/components/categories/category-icon";

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

function getCategoryColor(color: string | null) {
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return "#fb7185";
  }

  return color;
}

export function CategorySpendingChart({
  data,
  total,
  locale,
}: CategorySpendingChartProps) {
  const isEnglish = locale === "en";

  const visibleCategories = data.slice(0, 5);

  const visibleTotal = visibleCategories.reduce(
    (sum, category) => sum + Number(category.amount),
    0,
  );

  const remainingAmount = Math.max(total - visibleTotal, 0);
  const hasRemainingCategories = remainingAmount > 0.005;

  return (
    <article className="app-surface relative overflow-hidden rounded-[1.7rem] p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/[0.06] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-1/4 h-40 w-56 rounded-full bg-rose-400/[0.045] blur-3xl"
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Current month" : "Mês atual"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Spending by category" : "Gastos por categoria"}
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
              {isEnglish
                ? "See which categories are consuming most of your budget."
                : "Veja quais categorias estão consumindo a maior parte do seu orçamento."}
            </p>
          </div>

          {total > 0 ? (
            <div className="rounded-2xl border border-rose-300/15 bg-rose-400/[0.06] px-3.5 py-2.5 text-right">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-rose-200/60">
                {isEnglish ? "Spent" : "Gasto"}
              </p>

              <p className="mt-1 text-sm font-bold text-rose-200">
                {formatCurrency(total, locale)}
              </p>
            </div>
          ) : null}
        </div>

        {data.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-7 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-xl text-slate-400">
              ◌
            </span>

            <p className="mt-4 text-sm font-semibold text-slate-200">
              {isEnglish ? "No expenses this month" : "Sem despesas neste mês"}
            </p>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
              {isEnglish
                ? "Your categorized expenses will appear here as you add transactions."
                : "Suas despesas categorizadas aparecerão aqui conforme você adicionar lançamentos."}
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            {visibleCategories.map((category, index) => {
              const color = getCategoryColor(category.color);

              const percentage = Math.min(
                Math.max(Number(category.percentage) || 0, 0),
                100,
              );

              const rank = index + 1;

              return (
                <div
                  key={category.id}
                  className="group rounded-2xl border border-transparent px-2 py-1.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.025]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor: `${color}1f`,
                          borderColor: `${color}28`,
                          color,
                          boxShadow: `0 0 18px ${color}16`,
                        }}
                        title={category.name}
                      >
                        <CategoryIcon
                          name={category.icon}
                          size={18}
                          strokeWidth={1.9}
                        />
                      </span>

                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-100">
                            {category.name}
                          </span>

                          {rank === 1 ? (
                            <span className="shrink-0 rounded-full bg-rose-300/10 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.08em] text-rose-200">
                              {isEnglish ? "Top" : "Maior"}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-0.5 text-[0.68rem] font-medium text-slate-500">
                          {percentage.toFixed(0)}%{" "}
                          {isEnglish ? "of total expenses" : "das despesas"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-slate-100">
                        {formatCurrency(Number(category.amount), locale)}
                      </p>

                      <p className="mt-0.5 text-[0.65rem] font-semibold text-slate-500">
                        #{rank}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"
                    aria-label={`${category.name}: ${percentage.toFixed(0)}%`}
                  >
                    <div
                      className="h-full min-w-[4px] rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}b8)`,
                        boxShadow: `0 0 16px ${color}75`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {hasRemainingCategories ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-sm text-slate-400">
                    +
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-300">
                      {isEnglish ? "Other categories" : "Outras categorias"}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {isEnglish
                        ? "Categories outside the top five."
                        : "Categorias fora das cinco maiores."}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-bold text-slate-300">
                  {formatCurrency(remainingAmount, locale)}
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
          <span className="text-xs font-medium text-slate-400">
            {isEnglish
              ? `${data.length} ${data.length === 1 ? "category" : "categories"} with expenses`
              : `${data.length} ${data.length === 1 ? "categoria com gasto" : "categorias com gastos"}`}
          </span>

          <span className="text-sm font-bold tabular-nums text-rose-200">
            {formatCurrency(total, locale)}
          </span>
        </div>
      </div>
    </article>
  );
}