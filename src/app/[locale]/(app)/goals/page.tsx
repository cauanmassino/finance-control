import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryIcon} from "@/components/categories/category-icon";
import {GoalForm} from "@/components/goals/goal-form";
import {GoalActions} from "@/components/goals/goal-actions";

export const metadata: Metadata = {
  title: "Metas",
  description: "Planeje e acompanhe seus objetivos financeiros.",
};

type GoalsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type Goal = {
  id: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  target_date: string | null;
  color: string;
  icon: string | null;
  notes: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
};

type Contribution = {
  id: string;
  goal_id: string;
  amount: number | string;
  occurred_on: string;
  notes: string | null;
};

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getDaysUntil(value: string) {
  const today = new Date();
  const todayAtMidday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  );

  const target = new Date(`${value}T12:00:00`);
  const difference = target.getTime() - todayAtMidday.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

export default async function GoalsPage({
  params,
}: GoalsPageProps) {
  const {locale: receivedLocale} = await params;
  const locale = receivedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [
    {data: goals, error: goalsError},
    {data: contributions, error: contributionsError},
  ] = await Promise.all([
    supabase
      .from("financial_goals")
      .select(`
        id,
        name,
        target_amount,
        current_amount,
        target_date,
        color,
        icon,
        notes,
        is_completed,
        completed_at,
        created_at
      `)
      .eq("user_id", user.id)
      .order("is_completed", {ascending: true})
      .order("target_date", {ascending: true, nullsFirst: false})
      .order("created_at", {ascending: false}),

    supabase
      .from("goal_contributions")
      .select("id, goal_id, amount, occurred_on, notes")
      .eq("user_id", user.id)
      .order("occurred_on", {ascending: false})
      .limit(100),
  ]);

  if (goalsError) {
    console.error("Erro ao carregar metas:", goalsError);
    throw new Error("Não foi possível carregar as metas.");
  }

  if (contributionsError) {
    console.error("Erro ao carregar aportes:", contributionsError);
    throw new Error("Não foi possível carregar os aportes.");
  }

  const typedGoals = (goals ?? []) as Goal[];
  const typedContributions = (contributions ?? []) as Contribution[];

  const activeGoals = typedGoals.filter((goal) => !goal.is_completed);
  const completedGoals = typedGoals.filter((goal) => goal.is_completed);

  const totalTarget = activeGoals.reduce(
    (total, goal) => total + Number(goal.target_amount),
    0,
  );

  const totalSaved = activeGoals.reduce(
    (total, goal) => total + Number(goal.current_amount),
    0,
  );

  const totalRemaining = totalTarget - totalSaved;

  const totalContributed = typedContributions.reduce(
    (total, contribution) => total + Number(contribution.amount),
    0,
  );

  const today = toDateString(new Date());

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-violet-950/30 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-400/16 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-80 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative max-w-2xl">
          <p className="app-kicker">
            {isEnglish ? "Long-term planning" : "Planejamento de longo prazo"}
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
            {isEnglish
              ? "Give your money a destination."
              : "Dê um destino ao seu dinheiro."}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            {isEnglish
              ? "Create objectives, add contributions, and make financial progress visible."
              : "Crie objetivos, registre aportes e transforme progresso financeiro em algo visível."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Active goals" : "Metas ativas"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-violet-200">
            {activeGoals.length}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Goals still in progress."
              : "Objetivos ainda em andamento."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Saved in goals" : "Guardado em metas"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-emerald-200">
            {formatCurrency(totalSaved, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? `${formatCurrency(totalRemaining, locale)} remaining to active targets.`
              : `${formatCurrency(totalRemaining, locale)} restantes para as metas ativas.`}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Completed" : "Concluídas"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-cyan-200">
            {completedGoals.length}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? `${formatCurrency(totalContributed, locale)} contributed in total.`
              : `${formatCurrency(totalContributed, locale)} aportados no total.`}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <GoalForm locale={locale} />

        <article className="app-surface overflow-hidden rounded-[1.7rem]">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="app-kicker">
                {isEnglish ? "Progress" : "Progresso"}
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
                {isEnglish ? "Your financial goals" : "Suas metas financeiras"}
              </h2>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-300">
              {typedGoals.length}{" "}
              {isEnglish
                ? typedGoals.length === 1
                  ? "goal"
                  : "goals"
                : typedGoals.length === 1
                  ? "meta"
                  : "metas"}
            </span>
          </div>

          {typedGoals.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-violet-300/[0.1] text-2xl text-violet-200">
                ✦
              </span>

              <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
                {isEnglish ? "No goals created yet" : "Nenhuma meta criada"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Start by creating a goal for something that matters to you."
                  : "Comece criando uma meta para algo que é importante para você."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {typedGoals.map((goal) => {
                const targetAmount = Number(goal.target_amount);
                const currentAmount = Number(goal.current_amount);
                const remaining = Math.max(targetAmount - currentAmount, 0);

                const rawPercentage =
                  targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

                const percentage = Math.min(rawPercentage, 100);

                const isOverdue =
                  !goal.is_completed &&
                  goal.target_date &&
                  getDaysUntil(goal.target_date) < 0;

                const daysUntil =
                  goal.target_date && !goal.is_completed
                    ? getDaysUntil(goal.target_date)
                    : null;

                const goalContributions = typedContributions.filter(
                  (contribution) => contribution.goal_id === goal.id,
                );

                return (
                  <div key={goal.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor: `${goal.color}20`,
                              color: goal.color,
                              boxShadow: `0 0 18px ${goal.color}18`,
                            }}
                          >
                            <CategoryIcon
                              name={goal.icon}
                              size={21}
                              strokeWidth={1.9}
                            />
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-100">
                                {goal.name}
                              </p>

                              {goal.is_completed ? (
                                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-100">
                                  {isEnglish ? "Completed" : "Concluída"}
                                </span>
                              ) : isOverdue ? (
                                <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-rose-100">
                                  {isEnglish ? "Overdue" : "Atrasada"}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1.5 text-xs text-slate-400">
                              {goal.target_date
                                ? isEnglish
                                  ? `Target date: ${formatDate(
                                      goal.target_date,
                                      locale,
                                    )}`
                                  : `Data desejada: ${formatDate(
                                      goal.target_date,
                                      locale,
                                    )}`
                                : isEnglish
                                  ? "No target date"
                                  : "Sem data desejada"}
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-100">
                            {formatCurrency(currentAmount, locale)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {isEnglish ? "of" : "de"}{" "}
                            {formatCurrency(targetAmount, locale)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400">
                            {isEnglish
                              ? `${formatCurrency(remaining, locale)} remaining`
                              : `${formatCurrency(remaining, locale)} restante`}
                          </span>

                          <span
                            className="rounded-full border px-2.5 py-1 font-semibold"
                            style={{
                              borderColor: `${goal.color}40`,
                              backgroundColor: `${goal.color}18`,
                              color: goal.color,
                            }}
                          >
                            {percentage.toFixed(0)}%
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: goal.color,
                            }}
                          />
                        </div>
                      </div>

                      {daysUntil !== null ? (
                        <p
                          className={`text-xs font-semibold ${
                            isOverdue
                              ? "text-rose-300"
                              : daysUntil <= 30
                                ? "text-amber-200"
                                : "text-slate-400"
                          }`}
                        >
                          {isOverdue
                            ? isEnglish
                              ? `${Math.abs(daysUntil)} day(s) past target date`
                              : `${Math.abs(daysUntil)} dia(s) após a data desejada`
                            : isEnglish
                              ? `${daysUntil} day(s) until target date`
                              : `${daysUntil} dia(s) até a data desejada`}
                        </p>
                      ) : null}

                      {goal.notes ? (
                        <p className="text-sm leading-6 text-slate-400">
                          {goal.notes}
                        </p>
                      ) : null}

                      <GoalActions
                        locale={locale}
                        goalId={goal.id}
                        isCompleted={goal.is_completed}
                        today={today}
                      />

                      {goalContributions.length > 0 ? (
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                            {isEnglish ? "Latest contributions" : "Últimos aportes"}
                          </p>

                          <div className="mt-3 space-y-2">
                            {goalContributions.slice(0, 3).map((contribution) => (
                              <div
                                key={contribution.id}
                                className="flex items-center justify-between gap-3 text-xs"
                              >
                                <span className="truncate text-slate-400">
                                  {formatDate(contribution.occurred_on, locale)}
                                  {contribution.notes
                                    ? ` · ${contribution.notes}`
                                    : ""}
                                </span>

                                <span className="shrink-0 font-bold text-violet-200">
                                  +{formatCurrency(Number(contribution.amount), locale)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Your next step" : "Seu próximo passo"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
              {isEnglish
                ? "Make regular contributions"
                : "Faça aportes com regularidade"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Even small, consistent contributions make long-term goals easier to reach."
                : "Mesmo aportes pequenos e consistentes tornam metas de longo prazo mais fáceis de alcançar."}
            </p>
          </div>

          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            {isEnglish ? "Back to dashboard" : "Voltar ao dashboard"}
          </Link>
        </div>
      </section>
    </main>
  );
}