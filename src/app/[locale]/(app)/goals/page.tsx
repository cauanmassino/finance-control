import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryIcon} from "@/components/categories/category-icon";
import {GoalActions} from "@/components/goals/goal-actions";
import {GoalCreateModal} from "@/components/goals/goal-create-modal";

export const metadata: Metadata = {
  title: "Metas e objetivos",
  description: "Planeje, acompanhe aportes e evolua em direção aos seus objetivos.",
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
  contribution_type: "contribution" | "withdrawal" | "initial_balance";
  source_account_id: string | null;
  occurred_on: string;
  notes: string | null;
  created_at: string;
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

function formatShortDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
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

  return Math.ceil(difference / 86_400_000);
}

function getMonthsUntil(value: string) {
  const days = getDaysUntil(value);

  if (days <= 0) {
    return null;
  }

  return Math.max(Math.ceil(days / 30.44), 1);
}

function getMonthsSince(value: string) {
  const createdDate = new Date(`${value.slice(0, 10)}T12:00:00`);
  const today = new Date();

  const months =
    (today.getFullYear() - createdDate.getFullYear()) * 12 +
    (today.getMonth() - createdDate.getMonth()) +
    1;

  return Math.max(months, 1);
}

function getSparklinePath(values: number[]) {
  const width = 420;
  const height = 110;
  const padding = 8;
  const maximum = Math.max(...values, 1);
  const minimum = Math.min(...values, 0);
  const range = Math.max(maximum - minimum, 1);

  const points = values.map((value, index) => {
    const x =
      padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      ((value - minimum) / range) * (height - padding * 2);

    return {x, y};
  });

  const linePath = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previousPoint = points[index - 1];
    const controlX = (previousPoint.x + point.x) / 2;

    return `${path} C ${controlX} ${previousPoint.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return {
    linePath,
    areaPath,
    lastPoint: points[points.length - 1],
    width,
    height,
  };
}

function GoalSparkline({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const {linePath, areaPath, lastPoint, width, height} = getSparklinePath(values);
  const gradientId = `goal-${color.replace("#", "")}`;

  return (
    <svg
      aria-label="Gráfico de evolução da meta"
      className="h-[118px] w-full overflow-visible"
      fill="none"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} stroke={color} strokeLinecap="round" strokeWidth="3.2" />
      <circle cx={lastPoint.x} cy={lastPoint.y} fill="#ecfdf5" r="4.6" />
      <circle cx={lastPoint.x} cy={lastPoint.y} fill={color} r="2.5" />
    </svg>
  );
}

export default async function GoalsPage({params}: GoalsPageProps) {
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
      .select(`
        id,
        goal_id,
        amount,
        contribution_type,
        source_account_id,
        occurred_on,
        notes,
        created_at
      `)
      .eq("user_id", user.id)
      .order("occurred_on", {ascending: false})
      .order("created_at", {ascending: false})
      .limit(200),
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

  const totalRemaining = Math.max(totalTarget - totalSaved, 0);

  const netContributed = typedContributions.reduce((total, contribution) => {
    const amount = Number(contribution.amount);

    return contribution.contribution_type === "withdrawal"
      ? total - amount
      : total + amount;
  }, 0);

  const totalAllTargets = typedGoals.reduce(
    (total, goal) => total + Number(goal.target_amount),
    0,
  );

  const totalAllSaved = typedGoals.reduce(
    (total, goal) => total + Number(goal.current_amount),
    0,
  );

  const overallProgress =
    totalAllTargets > 0
      ? Math.min((totalAllSaved / totalAllTargets) * 100, 100)
      : 0;

  const today = toDateString(new Date());

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-emerald-950/30 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/16 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-80 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
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
                ? "Create objectives, follow every contribution and turn financial progress into something visible."
                : "Crie objetivos, acompanhe cada aporte e transforme progresso financeiro em algo visível."}
            </p>

            <div className="mt-6">
              <GoalCreateModal locale={locale} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[410px]">
            <div className="rounded-2xl border border-white/[0.1] bg-slate-950/35 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {isEnglish ? "Reserved in goals" : "Guardado em metas"}
              </p>

              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-emerald-200">
                {formatCurrency(totalAllSaved, locale)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {overallProgress.toFixed(0)}%{" "}
                {isEnglish ? "of all targets" : "de todos os objetivos"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-slate-950/35 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {isEnglish ? "Active goals" : "Metas ativas"}
              </p>

              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-cyan-200">
                {activeGoals.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {completedGoals.length}{" "}
                {isEnglish ? "completed" : "concluídas"}
              </p>
            </div>
          </div>
        </div>

        {typedGoals.length > 0 ? (
          <div className="relative mt-8 border-t border-white/[0.08] pt-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {isEnglish ? "Overall progress" : "Progresso geral"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {formatCurrency(totalAllSaved, locale)}{" "}
                  {isEnglish ? "of" : "de"}{" "}
                  {formatCurrency(totalAllTargets, locale)}
                </p>
              </div>

              <p className="text-lg font-bold text-emerald-200">
                {overallProgress.toFixed(0)}%
              </p>
            </div>

            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-300 transition-all duration-700"
                style={{width: `${overallProgress}%`}}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Active goals" : "Metas ativas"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-emerald-200">
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
            {isEnglish ? "Saved in active goals" : "Guardado em metas ativas"}
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
            {isEnglish ? "Net contributions" : "Aportes líquidos"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-cyan-200">
            {formatCurrency(netContributed, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Contributions minus withdrawals."
              : "Aportes realizados menos resgates."}
          </p>
        </article>
      </section>

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Progress" : "Progresso"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Your financial goals" : "Suas metas financeiras"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
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

            <div className="sm:hidden">
              <GoalCreateModal locale={locale} />
            </div>
          </div>
        </div>

        {typedGoals.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-emerald-300/[0.1] text-2xl text-emerald-200">
              🎯
            </span>

            <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
              {isEnglish ? "No goals created yet" : "Nenhuma meta criada"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Start by creating a goal for something that matters to you."
                : "Comece criando uma meta para algo que é importante para você."}
            </p>

            <div className="mt-5 flex justify-center">
              <GoalCreateModal locale={locale} />
            </div>
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

              const monthsUntil = goal.target_date
                ? getMonthsUntil(goal.target_date)
                : null;

              const monthlyRequired =
                monthsUntil && remaining > 0
                  ? remaining / monthsUntil
                  : null;

              const goalContributions = typedContributions.filter(
                (contribution) => contribution.goal_id === goal.id,
              );

              const orderedContributions = [...goalContributions].sort(
                (first, second) =>
                  new Date(first.occurred_on).getTime() -
                  new Date(second.occurred_on).getTime(),
              );

              let runningAmount = 0;

              const evolutionValues = [
                0,
                ...orderedContributions.map((contribution) => {
                  const amount = Number(contribution.amount);

                  runningAmount +=
                    contribution.contribution_type === "withdrawal"
                      ? -amount
                      : amount;

                  return Math.max(0, runningAmount);
                }),
              ];

              if (
                currentAmount > 0 &&
                evolutionValues[evolutionValues.length - 1] !== currentAmount
              ) {
                evolutionValues.push(currentAmount);
              }

              if (evolutionValues.length < 3) {
                evolutionValues.push(
                  Math.max(currentAmount * 0.45, 0),
                  Math.max(currentAmount * 0.75, 0),
                  currentAmount,
                );
              }

              const monthlyContributionTotal = goalContributions
                .filter(
                  (contribution) =>
                    contribution.contribution_type !== "withdrawal",
                )
                .reduce(
                  (total, contribution) =>
                    total + Number(contribution.amount),
                  0,
                );

              const monthsSinceCreation = getMonthsSince(goal.created_at);

              const averageMonthlyContribution =
                monthlyContributionTotal / monthsSinceCreation;

              const estimatedMonths =
                averageMonthlyContribution > 0 && remaining > 0
                  ? Math.ceil(remaining / averageMonthlyContribution)
                  : null;

              const estimatedCompletion =
                estimatedMonths !== null
                  ? new Date(
                      new Date().getFullYear(),
                      new Date().getMonth() + estimatedMonths,
                      1,
                    )
                  : null;

              const pace =
                goal.is_completed
                  ? "completed"
                  : !monthlyRequired
                    ? "noDeadline"
                    : averageMonthlyContribution === 0
                      ? "noHistory"
                      : averageMonthlyContribution >= monthlyRequired
                        ? "onTrack"
                        : "attention";

              const paceConfig = {
                completed: {
                  label: isEnglish ? "Goal completed" : "Meta concluída",
                  text: isEnglish
                    ? "You reached this objective. Celebrate this achievement."
                    : "Você atingiu este objetivo. Celebre essa conquista.",
                  className:
                    "border-emerald-300/20 bg-emerald-300/[0.09] text-emerald-200",
                  icon: "✓",
                },
                noDeadline: {
                  label: isEnglish ? "Set a target date" : "Defina uma data",
                  text: isEnglish
                    ? "Set a target date to calculate your monthly plan."
                    : "Defina uma data desejada para calcular seu plano mensal.",
                  className:
                    "border-sky-300/20 bg-sky-300/[0.08] text-sky-200",
                  icon: "↗",
                },
                noHistory: {
                  label: isEnglish ? "Start your history" : "Comece seu histórico",
                  text: isEnglish
                    ? "Make your first contribution to track your pace."
                    : "Faça seu primeiro aporte para acompanhar seu ritmo.",
                  className:
                    "border-amber-300/20 bg-amber-300/[0.08] text-amber-200",
                  icon: "!",
                },
                onTrack: {
                  label: isEnglish ? "On track" : "No ritmo",
                  text: isEnglish
                    ? "Your current contribution pace is enough for this deadline."
                    : "Seu ritmo atual de aportes é suficiente para cumprir o prazo.",
                  className:
                    "border-emerald-300/20 bg-emerald-300/[0.09] text-emerald-200",
                  icon: "↗",
                },
                attention: {
                  label: isEnglish ? "Plan needs attention" : "Atenção ao plano",
                  text: isEnglish
                    ? "Your average contribution is below what is needed."
                    : "Seu aporte médio está abaixo do necessário.",
                  className:
                    "border-amber-300/20 bg-amber-300/[0.08] text-amber-200",
                  icon: "!",
                },
              }[pace];

              return (
                <details
                  className="group p-5 open:bg-white/[0.012] sm:p-6"
                  key={goal.id}
                >
                  <summary className="cursor-pointer list-none outline-none">
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

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-slate-100">
                              {formatCurrency(currentAmount, locale)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {isEnglish ? "of" : "de"}{" "}
                              {formatCurrency(targetAmount, locale)}
                            </p>
                          </div>

                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.03] text-slate-400 transition group-open:rotate-180">
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                d="m6 9 6 6 6-6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400">
                            {goal.is_completed
                              ? isEnglish
                                ? "Goal reached"
                                : "Objetivo atingido"
                              : isEnglish
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
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${goal.color}, #67e8f9)`,
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

                      <p className="text-xs font-medium text-emerald-300 group-open:hidden">
                        {isEnglish
                          ? "Tap to see your evolution and history"
                          : "Toque para ver evolução e histórico"}
                      </p>
                    </div>
                  </summary>

                  <div className="mt-6 border-t border-white/[0.08] pt-5">
                    <div
                      className={`rounded-2xl border p-4 ${paceConfig.className}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold">{paceConfig.label}</p>
                          <p className="mt-1 text-xs leading-5 opacity-75">
                            {paceConfig.text}
                          </p>
                        </div>

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/10 text-sm font-bold">
                          {paceConfig.icon}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {isEnglish ? "Missing" : "Falta"}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-100">
                          {formatCurrency(remaining, locale)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {isEnglish ? "Monthly plan" : "Plano mensal"}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-emerald-200">
                          {monthlyRequired
                            ? formatCurrency(monthlyRequired, locale)
                            : isEnglish
                              ? "Set a date"
                              : "Defina uma data"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {isEnglish ? "Estimated finish" : "Previsão"}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-100">
                          {goal.is_completed
                            ? isEnglish
                              ? "Completed"
                              : "Concluída"
                            : estimatedCompletion
                              ? new Intl.DateTimeFormat(
                                  locale === "en" ? "en-US" : "pt-BR",
                                  {
                                    month: "short",
                                    year: "numeric",
                                  },
                                ).format(estimatedCompletion)
                              : isEnglish
                                ? "Add an amount"
                                : "Faça um aporte"}
                        </p>
                      </div>
                    </div>

                    <section className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            {isEnglish ? "Evolution" : "Evolução"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {isEnglish
                              ? "Your progress since this goal was created."
                              : "Seu progresso desde que esta meta foi criada."}
                          </p>
                        </div>

                        <p className="text-xs font-bold text-emerald-300">
                          {formatCurrency(currentAmount, locale)}
                        </p>
                      </div>

                      <div className="mt-3">
                        <GoalSparkline
                          color={goal.color || "#10b981"}
                          values={evolutionValues}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-medium text-slate-600">
                        <span>
                          {new Intl.DateTimeFormat(
                            locale === "en" ? "en-US" : "pt-BR",
                            {month: "short"},
                          ).format(
                            new Date(
                              `${goal.created_at.slice(0, 10)}T12:00:00`,
                            ),
                          )}
                        </span>

                        <span>{isEnglish ? "Today" : "Hoje"}</span>
                      </div>
                    </section>

                    <section className="mt-5">
                      <p className="text-sm font-semibold text-slate-100">
                        {isEnglish ? "Milestones" : "Marcos da meta"}
                      </p>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((milestone) => {
                          const reached = percentage >= milestone;
                          const nextMilestone =
                            !reached &&
                            milestone ===
                              [25, 50, 75, 100].find(
                                (item) => percentage < item,
                              );

                          return (
                            <div
                              className={`rounded-xl border p-2.5 text-center ${
                                reached
                                  ? "border-emerald-300/25 bg-emerald-300/[0.09] text-emerald-200"
                                  : nextMilestone
                                    ? "border-cyan-300/25 bg-cyan-300/[0.07] text-cyan-200"
                                    : "border-white/[0.08] bg-white/[0.02] text-slate-500"
                              }`}
                              key={milestone}
                            >
                              <p className="text-xs font-bold">
                                {reached ? "✓" : `${milestone}%`}
                              </p>

                              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em]">
                                {reached
                                  ? isEnglish
                                    ? "done"
                                    : "feito"
                                  : nextMilestone
                                    ? isEnglish
                                      ? "next"
                                      : "próximo"
                                    : ""}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {goal.notes ? (
                      <section className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {isEnglish ? "Your reason" : "Seu motivo"}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {goal.notes}
                        </p>
                      </section>
                    ) : null}

                    <div className="mt-5">
                      <GoalActions
                        locale={locale}
                        goalId={goal.id}
                        isCompleted={goal.is_completed}
                        today={today}
                      />
                    </div>

                    <section className="mt-6 border-t border-white/[0.08] pt-5">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {isEnglish ? "Recent history" : "Histórico recente"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {isEnglish
                            ? "Your latest movements toward this goal."
                            : "As últimas movimentações em direção a esta meta."}
                        </p>
                      </div>

                      {goalContributions.length === 0 ? (
                        <p className="mt-4 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.015] p-4 text-sm text-slate-500">
                          {isEnglish
                            ? "No contributions recorded yet."
                            : "Nenhum aporte registrado ainda."}
                        </p>
                      ) : (
                        <div className="mt-4 space-y-2">
                          {goalContributions.slice(0, 5).map((contribution) => {
                            const isWithdrawal =
                              contribution.contribution_type === "withdrawal";

                            const movementLabel = contribution.notes
                              ? contribution.notes
                              : contribution.contribution_type === "withdrawal"
                                ? isEnglish
                                  ? "Goal withdrawal"
                                  : "Resgate da meta"
                                : contribution.contribution_type ===
                                    "initial_balance"
                                  ? isEnglish
                                    ? "Initial amount"
                                    : "Valor inicial"
                                  : isEnglish
                                    ? "Manual contribution"
                                    : "Aporte manual";

                            return (
                              <div
                                className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
                                key={contribution.id}
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-slate-200">
                                    {movementLabel}
                                  </p>

                                  <p className="mt-1 text-[11px] text-slate-500">
                                    {formatShortDate(
                                      contribution.occurred_on,
                                      locale,
                                    )}
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 text-sm font-bold ${
                                    isWithdrawal
                                      ? "text-rose-300"
                                      : "text-emerald-300"
                                  }`}
                                >
                                  {isWithdrawal ? "−" : "+"}
                                  {formatCurrency(
                                    Number(contribution.amount),
                                    locale,
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  </div>
                </details>
              );
            })}
          </div>
        )}
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
                ? "Even small and consistent contributions make long-term goals easier to reach."
                : "Mesmo aportes pequenos e consistentes tornam metas de longo prazo mais fáceis de alcançar."}
            </p>
          </div>

          <Link
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
            href={`/${locale}/dashboard`}
          >
            {isEnglish ? "Back to dashboard" : "Voltar ao dashboard"}
          </Link>
        </div>
      </section>
    </main>
  );
}