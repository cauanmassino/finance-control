"use client";

import Link from "next/link";
import {useState} from "react";
import {ChartHelpTooltip} from "@/components/financial-health/chart-help-tooltip";

type RecurringCost = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  frequency: "weekly" | "monthly" | "yearly";
  nextOccurrence: string | null;
};

type RecurringCostsInsightProps = {
  data: RecurringCost[];
  locale: string;
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function getMonthlyEquivalent(
  amount: number,
  frequency: RecurringCost["frequency"],
) {
  if (frequency === "weekly") {
    return amount * (52 / 12);
  }

  if (frequency === "yearly") {
    return amount / 12;
  }

  return amount;
}

function getFrequencyLabel(
  frequency: RecurringCost["frequency"],
  isEnglish: boolean,
) {
  if (frequency === "weekly") {
    return isEnglish ? "weekly" : "semanal";
  }

  if (frequency === "yearly") {
    return isEnglish ? "yearly" : "anual";
  }

  return isEnglish ? "monthly" : "mensal";
}

export function RecurringCostsInsight({
  data,
  locale,
}: RecurringCostsInsightProps) {
  const [expanded, setExpanded] = useState(false);
  const isEnglish = locale === "en";

  const expenseItems = data
    .filter((item) => item.type === "expense")
    .map((item) => ({
      ...item,
      monthlyEquivalent: getMonthlyEquivalent(item.amount, item.frequency),
    }))
    .sort(
      (first, second) => second.monthlyEquivalent - first.monthlyEquivalent,
    );

  const totalMonthly = expenseItems.reduce(
    (total, item) => total + item.monthlyEquivalent,
    0,
  );

  const annualImpact = totalMonthly * 12;
  const visibleItems = expanded ? expenseItems : expenseItems.slice(0, 4);
  const hiddenCount = Math.max(expenseItems.length - visibleItems.length, 0);

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How invisible expenses work"
          : "Como funcionam os gastos invisíveis"
      }
      description={
        isEnglish
          ? "This section converts active recurring expenses into a monthly cost and annual impact. Weekly and yearly items are normalized to a monthly equivalent so every commitment can be compared."
          : "Esta seção converte despesas recorrentes ativas em custo mensal e impacto anual. Itens semanais e anuais são convertidos para um equivalente mensal para que todos os compromissos possam ser comparados."
      }
      example={
        isEnglish
          ? "A $30 monthly subscription represents $360 over one year."
          : "Uma assinatura de R$ 30 por mês representa R$ 360 ao longo de um ano."
      }
    />
  );

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Recurring commitments" : "Compromissos recorrentes"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Invisible expenses" : "Gastos invisíveis"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 max-w-xl text-sm text-slate-400">
            {isEnglish
              ? "The recurring expenses that are already consuming part of your income every month."
              : "As despesas recorrentes que já consomem parte da sua renda todos os meses."}
          </p>
        </div>

        <Link
          href={`/${locale}/recurring`}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-xs font-bold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
        >
          {isEnglish ? "Manage recurring items" : "Gerenciar recorrências"} →
        </Link>
      </div>

      {expenseItems.length === 0 ? (
        <div className="p-8 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.08] text-xl text-cyan-100">
            ◌
          </span>

          <p className="mt-4 text-sm font-semibold text-slate-200">
            {isEnglish
              ? "No recurring expenses found."
              : "Nenhuma despesa recorrente encontrada."}
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Add subscriptions, bills, and fixed commitments to understand their long-term impact."
              : "Adicione assinaturas, contas e compromissos fixos para entender o impacto deles no longo prazo."}
          </p>

          <Link
            href={`/${locale}/recurring`}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-cyan-300 px-4 text-xs font-bold text-cyan-950 transition hover:bg-cyan-200"
          >
            {isEnglish ? "Add recurring item" : "Adicionar recorrência"}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-3 border-b border-white/[0.08] p-5 sm:grid-cols-2 sm:p-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {isEnglish ? "Monthly commitment" : "Comprometimento mensal"}
              </p>

              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-amber-200">
                {formatCurrency(totalMonthly, locale)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {isEnglish
                  ? "Estimated monthly cost of active recurring expenses."
                  : "Custo mensal estimado das despesas recorrentes ativas."}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-200/75">
                {isEnglish ? "Annual impact" : "Impacto anual"}
              </p>

              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-rose-200">
                {formatCurrency(annualImpact, locale)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {isEnglish
                  ? "What these commitments represent over 12 months."
                  : "O que esses compromissos representam em 12 meses."}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-4">
              <p className="text-sm font-semibold text-amber-100">
                {isEnglish
                  ? `Your fixed recurring expenses total ${formatCurrency(
                      totalMonthly,
                      locale,
                    )} per month.`
                  : `Suas despesas fixas recorrentes somam ${formatCurrency(
                      totalMonthly,
                      locale,
                    )} por mês.`}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                {isEnglish
                  ? `Over one year, this is equivalent to ${formatCurrency(
                      annualImpact,
                      locale,
                    )}. Review items you no longer use or that can be renegotiated.`
                  : `Em um ano, isso equivale a ${formatCurrency(
                      annualImpact,
                      locale,
                    )}. Revise itens que você não utiliza mais ou que podem ser renegociados.`}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5 transition hover:border-white/[0.15] hover:bg-white/[0.055]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {item.description}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {getFrequencyLabel(item.frequency, isEnglish)} · {formatCurrency(
                        item.amount,
                        locale,
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-amber-100">
                      {formatCurrency(item.monthlyEquivalent, locale)}
                      <span className="ml-1 text-xs font-medium text-slate-500">
                        / {isEnglish ? "mo" : "mês"}
                      </span>
                    </p>

                    {item.frequency !== "monthly" ? (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        {isEnglish ? "Monthly estimate" : "Estimativa mensal"}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-4 inline-flex items-center text-xs font-bold text-amber-200 transition hover:text-amber-100"
              >
                {expanded
                  ? isEnglish
                    ? "Show less"
                    : "Mostrar menos"
                  : isEnglish
                    ? `Show ${hiddenCount} more item(s)`
                    : `Mostrar mais ${hiddenCount} item(ns)`}
                <span className="ml-1">{expanded ? "↑" : "↓"}</span>
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
