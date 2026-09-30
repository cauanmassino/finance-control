"use client";

import {ChartHelpTooltip} from "@/components/financial-health/chart-help-tooltip";

type SpendingPaceInsightProps = {
  currentExpenses: number;
  referenceAmount: number;
  dayOfMonth: number;
  daysInMonth: number;
  usingBudget: boolean;
  locale: string;
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function SpendingPaceInsight({
  currentExpenses,
  referenceAmount,
  dayOfMonth,
  daysInMonth,
  usingBudget,
  locale,
}: SpendingPaceInsightProps) {
  const isEnglish = locale === "en";

  const safeDaysInMonth = Math.max(daysInMonth, 1);
  const progress = Math.min(Math.max(dayOfMonth / safeDaysInMonth, 0), 1);

  const expectedExpenses = referenceAmount * progress;
  const paceDifference = currentExpenses - expectedExpenses;
  const pacePercentage =
    expectedExpenses > 0 ? (paceDifference / expectedExpenses) * 100 : 0;

  const isOnTrack = paceDifference <= 0;
  const isSlightlyAbove = paceDifference > 0 && pacePercentage <= 10;

  const status = isOnTrack
    ? {
        label: isEnglish ? "On track" : "No ritmo",
        color: "text-emerald-200",
        badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
        bar: "bg-emerald-300",
        icon: "✓",
      }
    : isSlightlyAbove
      ? {
          label: isEnglish ? "Attention" : "Atenção",
          color: "text-amber-200",
          badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
          bar: "bg-amber-300",
          icon: "!",
        }
      : {
          label: isEnglish ? "Above pace" : "Acima do ritmo",
          color: "text-rose-200",
          badge: "border-rose-300/20 bg-rose-300/10 text-rose-100",
          bar: "bg-rose-300",
          icon: "!",
        };

  const projectedExpenses =
    dayOfMonth > 0
      ? (currentExpenses / dayOfMonth) * safeDaysInMonth
      : currentExpenses;

  const projectedDifference = projectedExpenses - referenceAmount;
  const visibleReference = Math.max(referenceAmount, 1);
  const expectedWidth = Math.min(
    (expectedExpenses / visibleReference) * 100,
    100,
  );
  const actualWidth = Math.min(
    (currentExpenses / visibleReference) * 100,
    100,
  );

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How spending pace works"
          : "Como funciona o ritmo de gasto"
      }
      description={
        isEnglish
          ? "The app compares what you have spent so far with the ideal amount for today's date. It uses your total budget when available, or your recent expense average otherwise."
          : "O app compara quanto você já gastou com o valor ideal para a data de hoje. Ele usa seu orçamento total quando disponível ou sua média recente de despesas como referência."
      }
      example={
        isEnglish
          ? "With a $3,000 monthly reference, by day 10 of a 30-day month the ideal spending is about $1,000."
          : "Com uma referência mensal de R$ 3.000, no dia 10 de um mês de 30 dias o gasto ideal é cerca de R$ 1.000."
      }
    />
  );

  if (referenceAmount <= 0) {
    return (
      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <p className="app-kicker">
          {isEnglish ? "Spending control" : "Controle de gastos"}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Spending pace" : "Ritmo de gasto"}
          </h2>

          {helpTooltip}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6">
          <p className="text-sm font-semibold text-slate-200">
            {isEnglish
              ? "Not enough history to calculate your spending pace."
              : "Ainda não há histórico suficiente para calcular seu ritmo de gasto."}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Add expense transactions or configure budgets to receive this insight."
              : "Adicione despesas ou configure orçamentos para receber este insight."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Spending control" : "Controle de gastos"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Spending pace" : "Ritmo de gasto"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {usingBudget
              ? isEnglish
                ? "Your real spending compared with the ideal pace for your budgets."
                : "Seu gasto real comparado ao ritmo ideal para seus orçamentos."
              : isEnglish
                ? "Your real spending compared with your recent monthly average."
                : "Seu gasto real comparado à sua média mensal recente."}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status.badge}`}
        >
          <span>{status.icon}</span>
          {status.label}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">
              {isEnglish ? "Ideal until today" : "Ideal até hoje"}
            </p>

            <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-100">
              {formatCurrency(expectedExpenses, locale)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {isEnglish
                ? `Day ${dayOfMonth} of ${daysInMonth}`
                : `Dia ${dayOfMonth} de ${daysInMonth}`}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">
              {isEnglish ? "Spent so far" : "Gasto até agora"}
            </p>

            <p className={`mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] ${status.color}`}>
              {formatCurrency(currentExpenses, locale)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {isEnglish
                ? `Reference: ${formatCurrency(referenceAmount, locale)}`
                : `Referência: ${formatCurrency(referenceAmount, locale)}`}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">
              {isEnglish ? "Month projection" : "Projeção do mês"}
            </p>

            <p className={`mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] ${projectedDifference <= 0 ? "text-emerald-200" : "text-rose-200"}`}>
              {formatCurrency(projectedExpenses, locale)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {projectedDifference <= 0
                ? isEnglish
                  ? "Within your reference."
                  : "Dentro da sua referência."
                : isEnglish
                  ? `${formatCurrency(projectedDifference, locale)} above reference.`
                  : `${formatCurrency(projectedDifference, locale)} acima da referência.`}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-slate-950/25 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-100">
              {isEnglish ? "Pace comparison" : "Comparação de ritmo"}
            </p>

            <p className={`text-xs font-bold ${status.color}`}>
              {isOnTrack
                ? isEnglish
                  ? `${formatCurrency(Math.abs(paceDifference), locale)} below pace`
                  : `${formatCurrency(Math.abs(paceDifference), locale)} abaixo do ritmo`
                : isEnglish
                  ? `${formatCurrency(paceDifference, locale)} above pace`
                  : `${formatCurrency(paceDifference, locale)} acima do ritmo`}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-medium text-slate-400">
                  {isEnglish ? "Ideal pace" : "Ritmo ideal"}
                </span>

                <span className="text-slate-300">
                  {formatCurrency(expectedExpenses, locale)}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{width: `${expectedWidth}%`}}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-medium text-slate-400">
                  {isEnglish ? "Your spending" : "Seu gasto"}
                </span>

                <span className={status.color}>
                  {formatCurrency(currentExpenses, locale)}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={`h-full rounded-full ${status.bar}`}
                  style={{width: `${actualWidth}%`}}
                />
              </div>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-300">
            {isOnTrack
              ? isEnglish
                ? `You are spending at a sustainable pace. If you keep this behavior, you may finish the month with ${formatCurrency(
                    Math.max(referenceAmount - projectedExpenses, 0),
                    locale,
                  )} below your reference.`
                : `Você está gastando em um ritmo sustentável. Se mantiver este comportamento, pode terminar o mês com ${formatCurrency(
                    Math.max(referenceAmount - projectedExpenses, 0),
                    locale,
                  )} abaixo da sua referência.`
              : isEnglish
                ? `Your spending is moving faster than the ideal pace. At this rate, you may finish the month ${formatCurrency(
                    Math.max(projectedDifference, 0),
                    locale,
                  )} above your reference.`
                : `Seu gasto está avançando mais rápido que o ritmo ideal. Neste ritmo, você pode terminar o mês ${formatCurrency(
                    Math.max(projectedDifference, 0),
                    locale,
                  )} acima da sua referência.`}
          </p>
        </div>
      </div>
    </section>
  );
}
