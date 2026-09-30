import Link from "next/link";
import {CategoryIcon} from "@/components/categories/category-icon";

type GoalSummary = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  color: string;
  icon: string | null;
};

type GoalsSummaryProps = {
  locale: string;
  goals: GoalSummary[];
  totalSaved: number;
  totalTarget: number;
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export function GoalsSummary({
  locale,
  goals,
  totalSaved,
  totalTarget,
}: GoalsSummaryProps) {
  const isEnglish = locale === "en";

  return (
    <section className="app-surface overflow-hidden rounded-[1.7rem]">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="app-kicker">
            {isEnglish ? "Long-term planning" : "Planejamento de longo prazo"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Financial goals" : "Metas financeiras"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {isEnglish
              ? "Track the objectives you are building toward."
              : "Acompanhe os objetivos que você está construindo."}
          </p>
        </div>

        <Link
          href={`/${locale}/goals`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
        >
          {isEnglish ? "View goals" : "Ver metas"} →
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {isEnglish
                ? "No active goals yet"
                : "Nenhuma meta ativa ainda"}
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Create a goal to make your financial progress visible."
                : "Crie uma meta para tornar seu progresso financeiro visível."}
            </p>
          </div>

          <Link
            href={`/${locale}/goals`}
            className="app-shine inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-violet-300 px-4 text-sm font-bold text-violet-950 transition hover:bg-violet-200"
          >
            {isEnglish ? "Create goal" : "Criar meta"}
          </Link>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {isEnglish ? "Saved in goals" : "Guardado em metas"}
              </p>

              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-emerald-200">
                {formatCurrency(totalSaved, locale)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {isEnglish ? "Active target" : "Objetivo ativo"}
              </p>

              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-violet-200">
                {formatCurrency(totalTarget, locale)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${goal.color}20`,
                      color: goal.color,
                    }}
                  >
                    <CategoryIcon
                      name={goal.icon}
                      size={18}
                      strokeWidth={1.9}
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {goal.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatCurrency(goal.currentAmount, locale)} /{" "}
                      {formatCurrency(goal.targetAmount, locale)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${goal.percentage}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>

                  <span
                    className="text-xs font-bold"
                    style={{color: goal.color}}
                  >
                    {goal.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}