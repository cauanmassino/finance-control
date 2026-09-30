"use client";

import {useState} from "react";
import {CategoryIcon} from "@/components/categories/category-icon";
import {ChartHelpTooltip} from "@/components/financial-health/chart-help-tooltip";

type CategoryExpense = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  amount: number;
  percentage: number;
};

type CategoryExpensesChartProps = {
  data: CategoryExpense[];
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

export function CategoryExpensesChart({
  data,
  total,
  locale,
}: CategoryExpensesChartProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    null,
  );

  const isEnglish = locale === "en";
  const visibleCategories = data.slice(0, 5);

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How category spending works"
          : "Como funcionam os gastos por categoria"
      }
      description={
        isEnglish
          ? "This ranking groups your current month's expenses by category. It shows which areas are consuming the largest share of your money."
          : "Este ranking agrupa as despesas do mês atual por categoria. Ele mostra quais áreas estão consumindo a maior parte do seu dinheiro."
      }
      example={
        isEnglish
          ? "If Food represents 35%, then 35 cents of every dollar spent this month went to Food."
          : "Se Alimentação representa 35%, então R$ 35 de cada R$ 100 gastos no mês foram para Alimentação."
      }
    />
  );

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish
              ? "Where your money went"
              : "Para onde seu dinheiro foi"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Expenses by category" : "Gastos por categoria"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {isEnglish
              ? "Hover over a category to inspect its impact."
              : "Passe o mouse sobre uma categoria para ver seu impacto."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-medium text-slate-500">
            {isEnglish ? "Total expenses" : "Total de despesas"}
          </p>

          <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-rose-200">
            {formatCurrency(total, locale)}
          </p>
        </div>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="p-8 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-xl text-slate-400">
            ◌
          </span>

          <p className="mt-4 text-sm font-semibold text-slate-200">
            {isEnglish
              ? "No categorized expenses this month."
              : "Não há despesas categorizadas neste mês."}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {isEnglish
              ? "Categorize your transactions to reveal spending patterns."
              : "Categorize seus lançamentos para revelar padrões de gasto."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 p-3 sm:p-4">
          {visibleCategories.map((category) => {
            const color = category.color ?? "#38bdf8";
            const visiblePercentage = Math.min(category.percentage, 100);
            const isActive = activeCategoryId === category.id;

            return (
              <div
                key={category.id}
                tabIndex={0}
                role="button"
                aria-label={`${category.name}: ${formatCurrency(
                  category.amount,
                  locale,
                )}, ${category.percentage.toFixed(1)}%`}
                onBlur={() => setActiveCategoryId(null)}
                onFocus={() => setActiveCategoryId(category.id)}
                onMouseEnter={() => setActiveCategoryId(category.id)}
                onMouseLeave={() => setActiveCategoryId(null)}
                onTouchStart={() => setActiveCategoryId(category.id)}
                className={`cursor-default rounded-2xl border p-3.5 outline-none transition duration-200 ${
                  isActive
                    ? "border-white/[0.15] bg-white/[0.07]"
                    : "border-transparent bg-transparent hover:bg-white/[0.035]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200"
                      style={{
                        backgroundColor: `${color}20`,
                        color,
                        transform: isActive ? "scale(1.08)" : "scale(1)",
                        boxShadow: isActive
                          ? `0 0 18px ${color}35`
                          : "none",
                      }}
                    >
                      <CategoryIcon
                        name={category.icon}
                        size={20}
                        strokeWidth={1.9}
                      />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {category.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {category.percentage.toFixed(1)}%
                        {isActive
                          ? isEnglish
                            ? " of monthly expenses"
                            : " das despesas mensais"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-bold transition ${
                      isActive ? "text-white" : "text-slate-100"
                    }`}
                  >
                    {formatCurrency(category.amount, locale)}
                  </p>
                </div>

                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${visiblePercentage}%`,
                      backgroundColor: color,
                      boxShadow: isActive
                        ? `0 0 16px ${color}88`
                        : `0 0 10px ${color}45`,
                      opacity: isActive ? 1 : 0.82,
                    }}
                  />
                </div>

                {isActive ? (
                  <p className="mt-2 text-xs text-slate-400">
                    {isEnglish
                      ? `${formatCurrency(
                          category.amount,
                          locale,
                        )} of ${formatCurrency(
                          total,
                          locale,
                        )} spent this month.`
                      : `${formatCurrency(
                          category.amount,
                          locale,
                        )} de ${formatCurrency(
                          total,
                          locale,
                        )} gastos neste mês.`}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
