"use client";

import {useState} from "react";
import {ChartHelpTooltip} from "@/components/financial-health/chart-help-tooltip";

type SpendingPattern = {
  id: string;
  label: string;
  count: number;
  total: number;
  averageTicket: number;
  categoryName?: string | null;
};

type SpendingFrequencyInsightProps = {
  data: SpendingPattern[];
  locale: string;
};

type PatternKind =
  | "high-impact"
  | "frequency-leak"
  | "large-purchase"
  | "low-impact";

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function getPatternKind(
  pattern: SpendingPattern,
  averageCount: number,
  averageTotal: number,
): PatternKind {
  const highFrequency = pattern.count >= averageCount;
  const highTotal = pattern.total >= averageTotal;

  if (highFrequency && highTotal) {
    return "high-impact";
  }

  if (highFrequency) {
    return "frequency-leak";
  }

  if (highTotal) {
    return "large-purchase";
  }

  return "low-impact";
}

function getPatternStyle(kind: PatternKind, isEnglish: boolean) {
  if (kind === "high-impact") {
    return {
      label: isEnglish ? "High impact" : "Alto impacto",
      badge: "border-rose-300/20 bg-rose-300/10 text-rose-100",
      dot: "bg-rose-300",
    };
  }

  if (kind === "frequency-leak") {
    return {
      label: isEnglish ? "Frequency leak" : "Efeito frequência",
      badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
      dot: "bg-amber-300",
    };
  }

  if (kind === "large-purchase") {
    return {
      label: isEnglish ? "Large purchase" : "Compra elevada",
      badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
      dot: "bg-cyan-300",
    };
  }

  return {
    label: isEnglish ? "Lower impact" : "Menor impacto",
    badge: "border-slate-300/15 bg-slate-300/[0.06] text-slate-300",
    dot: "bg-slate-400",
  };
}

export function SpendingFrequencyInsight({
  data,
  locale,
}: SpendingFrequencyInsightProps) {
  const [activeId, setActiveId] = useState<string | null>(data[0]?.id ?? null);
  const isEnglish = locale === "en";

  const averageCount =
    data.length > 0
      ? data.reduce((total, item) => total + item.count, 0) / data.length
      : 0;

  const averageTotal =
    data.length > 0
      ? data.reduce((total, item) => total + item.total, 0) / data.length
      : 0;

  const visibleData = data.slice(0, 5);
  const highestFrequency = Math.max(
    ...visibleData.map((item) => item.count),
    1,
  );
  const highestTotal = Math.max(
    ...visibleData.map((item) => item.total),
    1,
  );

  const primaryPattern = visibleData[0];
  const primaryKind = primaryPattern
    ? getPatternKind(primaryPattern, averageCount, averageTotal)
    : null;

  const helpTooltip = (
    <ChartHelpTooltip
      title={
        isEnglish
          ? "How frequency versus value works"
          : "Como funciona frequência versus valor"
      }
      description={
        isEnglish
          ? "The app groups expenses with similar descriptions and compares how often they happen with their total cost. It helps reveal repeated small purchases that become expensive over time."
          : "O app agrupa despesas com descrições parecidas e compara a frequência com o valor total. Isso revela pequenas compras repetidas que se tornam caras ao longo do mês."
      }
      example={
        isEnglish
          ? "Fifteen $30 delivery orders cost $450 in the month, even though each order seems small."
          : "Quinze pedidos de delivery de R$ 30 somam R$ 450 no mês, mesmo que cada pedido pareça pequeno."
      }
    />
  );

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Behavior analysis" : "Análise de comportamento"}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish
                ? "Frequency versus value"
                : "Frequência versus valor"}
            </h2>

            {helpTooltip}
          </div>

          <p className="mt-1 max-w-xl text-sm text-slate-400">
            {isEnglish
              ? "Identify spending habits whose impact comes from repetition, not only from individual price."
              : "Identifique hábitos cujo impacto vem da repetição, não apenas do preço individual."}
          </p>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-300">
          {isEnglish
            ? `${data.length} spending pattern(s)`
            : `${data.length} padrão(ões) de gasto`}
        </span>
      </div>

      {visibleData.length === 0 ? (
        <div className="p-8 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.08] text-xl text-cyan-100">
            ◌
          </span>

          <p className="mt-4 text-sm font-semibold text-slate-200">
            {isEnglish
              ? "Not enough expense data to identify patterns."
              : "Ainda não há despesas suficientes para identificar padrões."}
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Record expenses with clear descriptions to reveal frequency-based habits."
              : "Registre despesas com descrições claras para revelar hábitos baseados em frequência."}
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          {primaryPattern && primaryKind ? (
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-4">
              <p className="text-sm font-semibold text-amber-100">
                {primaryKind === "frequency-leak"
                  ? isEnglish
                    ? `${primaryPattern.label} may be a frequency leak.`
                    : `${primaryPattern.label} pode ser um vazamento por frequência.`
                  : primaryKind === "high-impact"
                    ? isEnglish
                      ? `${primaryPattern.label} is your highest-impact spending pattern.`
                      : `${primaryPattern.label} é seu padrão de gasto de maior impacto.`
                    : isEnglish
                      ? `${primaryPattern.label} deserves your attention this month.`
                      : `${primaryPattern.label} merece sua atenção neste mês.`}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                {isEnglish
                  ? `${primaryPattern.count} purchase(s) generated ${formatCurrency(
                      primaryPattern.total,
                      locale,
                    )} in spending, with an average ticket of ${formatCurrency(
                      primaryPattern.averageTicket,
                      locale,
                    )}.`
                  : `${primaryPattern.count} compra(s) geraram ${formatCurrency(
                      primaryPattern.total,
                      locale,
                    )} em gastos, com ticket médio de ${formatCurrency(
                      primaryPattern.averageTicket,
                      locale,
                    )}.`}
              </p>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {visibleData.map((pattern) => {
              const kind = getPatternKind(
                pattern,
                averageCount,
                averageTotal,
              );
              const style = getPatternStyle(kind, isEnglish);
              const isActive = activeId === pattern.id;
              const frequencyWidth = (pattern.count / highestFrequency) * 100;
              const totalWidth = (pattern.total / highestTotal) * 100;

              return (
                <article
                  key={pattern.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`${pattern.label}: ${pattern.count} purchases, ${formatCurrency(
                    pattern.total,
                    locale,
                  )}`}
                  onBlur={() => setActiveId(null)}
                  onFocus={() => setActiveId(pattern.id)}
                  onMouseEnter={() => setActiveId(pattern.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onTouchStart={() => setActiveId(pattern.id)}
                  className={`rounded-2xl border p-4 outline-none transition ${
                    isActive
                      ? "border-white/[0.16] bg-white/[0.065]"
                      : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.045]"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
                        />

                        <h3 className="truncate text-sm font-semibold text-slate-100">
                          {pattern.label}
                        </h3>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${style.badge}`}
                        >
                          {style.label}
                        </span>
                      </div>

                      {pattern.categoryName ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {pattern.categoryName}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-5 sm:text-right">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {isEnglish ? "Frequency" : "Frequência"}
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-200">
                          {pattern.count}×
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {isEnglish ? "Total" : "Total"}
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-100">
                          {formatCurrency(pattern.total, locale)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {isEnglish ? "Purchase frequency" : "Frequência de compra"}
                        </span>

                        <span className="text-slate-300">{pattern.count}×</span>
                      </div>

                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-amber-300 transition-all duration-300"
                          style={{width: `${frequencyWidth}%`}}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {isEnglish ? "Financial impact" : "Impacto financeiro"}
                        </span>

                        <span className="text-slate-300">
                          {formatCurrency(pattern.total, locale)}
                        </span>
                      </div>

                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full bg-cyan-300 transition-all duration-300"
                          style={{width: `${totalWidth}%`}}
                        />
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <div className="mt-4 border-t border-white/[0.08] pt-3">
                      <p className="text-xs leading-5 text-slate-400">
                        {kind === "frequency-leak"
                          ? isEnglish
                            ? `The main impact is frequency: each purchase averages ${formatCurrency(
                                pattern.averageTicket,
                                locale,
                              )}, but it happened ${pattern.count} times this month.`
                            : `O principal impacto está na frequência: cada compra custa em média ${formatCurrency(
                                pattern.averageTicket,
                                locale,
                              )}, mas ocorreu ${pattern.count} vezes neste mês.`
                          : kind === "large-purchase"
                            ? isEnglish
                              ? `The main impact is the average ticket: each purchase costs about ${formatCurrency(
                                  pattern.averageTicket,
                                  locale,
                                )}.`
                              : `O principal impacto está no ticket médio: cada compra custa cerca de ${formatCurrency(
                                  pattern.averageTicket,
                                  locale,
                                )}.`
                            : isEnglish
                              ? `Average ticket: ${formatCurrency(
                                  pattern.averageTicket,
                                  locale,
                                )} per purchase.`
                              : `Ticket médio: ${formatCurrency(
                                  pattern.averageTicket,
                                  locale,
                                )} por compra.`}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
