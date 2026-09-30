"use client";

import {useState} from "react";
import {ChartHelpTooltip} from "@/components/financial-health/chart-help-tooltip";

type ForecastItem = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  projectedBalance: number;
};

type CashFlowForecastProps = {
  currentBalance: number;
  items: ForecastItem[];
  locale: string;
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

export function CashFlowForecast({
  currentBalance,
  items,
  locale,
}: CashFlowForecastProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  const isEnglish = locale === "en";
  const lowestProjectedBalance = items.reduce(
    (lowest, item) => Math.min(lowest, item.projectedBalance),
    currentBalance,
  );

  const hasNegativeProjection = lowestProjectedBalance < 0;
  const visibleItems = items.slice(0, 8);

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How the cash flow forecast works"
          : "Como funciona a previsão de fluxo de caixa"
      }
      description={
        isEnglish
          ? "Starting from your current balance, the app applies upcoming active recurring income and expenses in date order. It does not estimate variable expenses such as groceries, delivery, or leisure."
          : "Partindo do saldo atual, o app aplica receitas e despesas recorrentes futuras em ordem de data. Ele não estima despesas variáveis, como mercado, delivery ou lazer."
      }
      example={
        isEnglish
          ? "A current $1,000 balance minus a $200 bill becomes a projected $800 balance."
          : "Um saldo atual de R$ 1.000 menos uma conta de R$ 200 resulta em saldo projetado de R$ 800."
      }
    />
  );

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Future planning" : "Planejamento futuro"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Cash flow forecast" : "Previsão de fluxo de caixa"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 max-w-xl text-sm text-slate-400">
            {isEnglish
              ? "Your expected balance based on the recurring items already scheduled."
              : "Seu saldo esperado com base nas recorrências já programadas."}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${
            hasNegativeProjection
              ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
              : "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          }`}
        >
          <span>{hasNegativeProjection ? "!" : "✓"}</span>
          {hasNegativeProjection
            ? isEnglish
              ? "Negative balance projected"
              : "Saldo negativo projetado"
            : isEnglish
              ? "Balance projected to remain positive"
              : "Saldo projetado permanece positivo"}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Current consolidated balance" : "Saldo consolidado atual"}
          </p>

          <p
            className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] ${
              currentBalance >= 0 ? "text-slate-100" : "text-rose-300"
            }`}
          >
            {formatCurrency(currentBalance, locale)}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {isEnglish
              ? "The forecast only includes active recurring items with a scheduled date."
              : "A previsão considera somente recorrências ativas com data programada."}
          </p>
        </div>

        {visibleItems.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-center">
            <p className="text-sm font-semibold text-slate-200">
              {isEnglish
                ? "No upcoming recurring items found."
                : "Nenhuma recorrência futura encontrada."}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {isEnglish
                ? "Add recurring income and expenses to create your balance forecast."
                : "Adicione receitas e despesas recorrentes para criar sua previsão de saldo."}
            </p>
          </div>
        ) : (
          <div className="relative mt-5">
            <div
              aria-hidden="true"
              className="absolute bottom-5 left-[1.05rem] top-5 w-px bg-white/[0.09]"
            />

            <div className="space-y-3">
              {visibleItems.map((item) => {
                const isIncome = item.type === "income";
                const isActive = activeItemId === item.id;
                const isNegative = item.projectedBalance < 0;

                return (
                  <div
                    key={item.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${item.description}: ${
                      isIncome ? "+" : "-"
                    }${formatCurrency(item.amount, locale)}`}
                    onBlur={() => setActiveItemId(null)}
                    onFocus={() => setActiveItemId(item.id)}
                    onMouseEnter={() => setActiveItemId(item.id)}
                    onMouseLeave={() => setActiveItemId(null)}
                    onTouchStart={() => setActiveItemId(item.id)}
                    className={`relative cursor-default rounded-2xl border p-3.5 pl-12 outline-none transition ${
                      isActive
                        ? "border-white/[0.16] bg-white/[0.07]"
                        : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.045]"
                    }`}
                  >
                    <span
                      className={`absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-bold ${
                        isIncome
                          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                          : "border-rose-300/25 bg-rose-300/10 text-rose-200"
                      }`}
                    >
                      {isIncome ? "+" : "−"}
                    </span>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {item.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(item.date, locale)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                        <p
                          className={`text-sm font-bold ${
                            isIncome ? "text-emerald-200" : "text-rose-200"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(item.amount, locale)}
                        </p>

                        <p
                          className={`mt-1 text-xs font-semibold ${
                            isNegative ? "text-rose-200" : "text-slate-400"
                          }`}
                        >
                          {isEnglish ? "Projected:" : "Projetado:"}{" "}
                          {formatCurrency(item.projectedBalance, locale)}
                        </p>
                      </div>
                    </div>

                    {isActive ? (
                      <p className="mt-3 border-t border-white/[0.08] pt-3 text-xs leading-5 text-slate-400">
                        {isIncome
                          ? isEnglish
                            ? `This income increases your projected balance to ${formatCurrency(
                                item.projectedBalance,
                                locale,
                              )}.`
                            : `Esta receita aumenta seu saldo projetado para ${formatCurrency(
                                item.projectedBalance,
                                locale,
                              )}.`
                          : isEnglish
                            ? `After this expense, your projected balance will be ${formatCurrency(
                                item.projectedBalance,
                                locale,
                              )}.`
                            : `Após esta despesa, seu saldo projetado será ${formatCurrency(
                                item.projectedBalance,
                                locale,
                              )}.`}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {items.length > visibleItems.length ? (
          <p className="mt-4 text-xs text-slate-500">
            {isEnglish
              ? `Showing the next ${visibleItems.length} of ${items.length} scheduled items.`
              : `Mostrando os próximos ${visibleItems.length} de ${items.length} itens programados.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}
