import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryIcon} from "@/components/categories/category-icon";

export const metadata: Metadata = {
  title: "Alertas",
  description: "Acompanhe pontos financeiros que precisam da sua atenção.",
};

type AlertsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type AlertLevel = "danger" | "warning" | "info";

type Account = {
  id: string;
  name: string;
  color: string | null;
  initial_balance: number | string | null;
};

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
};

type TransactionForBalance = {
  amount: number | string;
  type: "income" | "expense" | "transfer";
  account_id: string | null;
  transfer_account_id: string | null;
};

type ExpenseTransaction = {
  amount: number | string;
  category_id: string | null;
};

type BudgetFromDatabase = {
  id: string;
  amount: number | string;
  category: Category[] | Category | null;
};

type RecurringItem = {
  id: string;
  description: string;
  amount: number | string;
  type: "income" | "expense";
  next_occurrence: string;
  frequency: "weekly" | "monthly" | "yearly";
};

type FinancialGoal = {
  id: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  target_date: string | null;
  color: string | null;
  icon: string | null;
  is_completed: boolean;
};

type AlertItem = {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  detail?: string;
  href: string;
  actionLabel: string;
  iconName?: string | null;
  color?: string;
};

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
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

function getDaysUntil(dateValue: string) {
  const today = new Date();
  const todayAtMidday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    12,
  );

  const targetDate = new Date(`${dateValue}T12:00:00`);

  return Math.round(
    (targetDate.getTime() - todayAtMidday.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function getLevelStyles(level: AlertLevel) {
  if (level === "danger") {
    return {
      icon: "!",
      border: "border-rose-300/20",
      background: "bg-rose-300/[0.08]",
      iconBackground: "bg-rose-300/15",
      iconColor: "text-rose-200",
      badge: "border-rose-300/20 bg-rose-300/10 text-rose-100",
      action:
        "border-rose-300/30 bg-rose-300/[0.08] text-rose-100 hover:bg-rose-300/[0.15]",
    };
  }

  if (level === "warning") {
    return {
      icon: "!",
      border: "border-amber-300/20",
      background: "bg-amber-300/[0.07]",
      iconBackground: "bg-amber-300/15",
      iconColor: "text-amber-100",
      badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
      action:
        "border-amber-300/30 bg-amber-300/[0.08] text-amber-100 hover:bg-amber-300/[0.15]",
    };
  }

  return {
    icon: "i",
    border: "border-cyan-300/20",
    background: "bg-cyan-300/[0.07]",
    iconBackground: "bg-cyan-300/15",
    iconColor: "text-cyan-100",
    badge: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
    action:
      "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100 hover:bg-cyan-300/[0.15]",
  };
}

function getAlertLabel(level: AlertLevel, isEnglish: boolean) {
  if (level === "danger") {
    return isEnglish ? "Attention required" : "Atenção necessária";
  }

  if (level === "warning") {
    return isEnglish ? "Near limit" : "Próximo do limite";
  }

  return isEnglish ? "Upcoming" : "Próximo";
}

export default async function AlertsPage({
  params,
}: AlertsPageProps) {
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

  const now = new Date();
  const {start: monthStart, end: nextMonthStart} = getMonthRange(now);

  const [
    {data: accounts, error: accountsError},
    {data: allTransactions, error: allTransactionsError},
    {data: expenseTransactions, error: expensesError},
    {data: budgets, error: budgetsError},
    {data: recurringItems, error: recurringError},
    {data: goals, error: goalsError},
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color, initial_balance")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("transactions")
      .select("amount, type, account_id, transfer_account_id")
      .eq("user_id", user.id),

    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("occurred_on", monthStart)
      .lt("occurred_on", nextMonthStart),

    supabase
      .from("budgets")
      .select(`
        id,
        amount,
        category:categories!budgets_category_id_fkey (
          id,
          name,
          color,
          icon
        )
      `)
      .eq("user_id", user.id)
      .eq("month", monthStart),

    supabase
      .from("recurring_transactions")
      .select("id, description, amount, type, next_occurrence, frequency")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("next_occurrence", {ascending: true}),

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
        is_completed
      `)
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .not("target_date", "is", null)
      .order("target_date", {ascending: true}),
  ]);

  const loadError =
    accountsError ??
    allTransactionsError ??
    expensesError ??
    budgetsError ??
    recurringError ??
    goalsError;

  if (loadError) {
    console.error("Erro ao carregar alertas:", {
      code: loadError.code,
      message: loadError.message,
      details: loadError.details,
      hint: loadError.hint,
    });

    throw new Error("Não foi possível carregar os alertas.");
  }

  const typedAccounts = (accounts ?? []) as Account[];
  const typedTransactions = (
    allTransactions ?? []
  ) as TransactionForBalance[];

  const typedExpenses = (expenseTransactions ?? []) as ExpenseTransaction[];
  const typedBudgets = (budgets ?? []) as unknown as BudgetFromDatabase[];
  const typedRecurring = (recurringItems ?? []) as RecurringItem[];
  const typedGoals = (goals ?? []) as FinancialGoal[];

  const spentByCategory = new Map<string, number>();

  typedExpenses.forEach((transaction) => {
    if (!transaction.category_id) {
      return;
    }

    const currentSpent = spentByCategory.get(transaction.category_id) ?? 0;

    spentByCategory.set(
      transaction.category_id,
      currentSpent + Number(transaction.amount),
    );
  });

  const alerts: AlertItem[] = [];

  typedAccounts.forEach((account) => {
    const balance = typedTransactions.reduce((total, transaction) => {
      const amount = Number(transaction.amount);

      if (transaction.type === "income") {
        return transaction.account_id === account.id ? total + amount : total;
      }

      if (transaction.type === "expense") {
        return transaction.account_id === account.id ? total - amount : total;
      }

      if (transaction.type === "transfer") {
        if (transaction.account_id === account.id) {
          return total - amount;
        }

        if (transaction.transfer_account_id === account.id) {
          return total + amount;
        }
      }

      return total;
    }, Number(account.initial_balance ?? 0));

    if (balance < 0) {
      alerts.push({
        id: `negative-account-${account.id}`,
        level: "danger",
        title: isEnglish
          ? `Negative balance in ${account.name}`
          : `Saldo negativo em ${account.name}`,
        description: isEnglish
          ? "This account is currently below zero."
          : "Esta conta está atualmente com saldo abaixo de zero.",
        detail: formatCurrency(balance, locale),
        href: `/${locale}/accounts`,
        actionLabel: isEnglish ? "View accounts" : "Ver contas",
        iconName: "wallet",
        color: account.color ?? "#fda4af",
      });
    }
  });

  typedBudgets.forEach((budget) => {
    const category = getFirstRelation(budget.category);

    if (!category) {
      return;
    }

    const limit = Number(budget.amount);
    const spent = spentByCategory.get(category.id) ?? 0;
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;

    if (percentage >= 100) {
      alerts.push({
        id: `budget-over-${budget.id}`,
        level: "danger",
        title: isEnglish
          ? `${category.name} budget exceeded`
          : `Orçamento de ${category.name} ultrapassado`,
        description: isEnglish
          ? `You spent ${formatCurrency(spent, locale)} of a ${formatCurrency(
              limit,
              locale,
            )} limit.`
          : `Você gastou ${formatCurrency(
              spent,
              locale,
            )} de um limite de ${formatCurrency(limit, locale)}.`,
        detail: `${percentage.toFixed(0)}%`,
        href: `/${locale}/budgets`,
        actionLabel: isEnglish ? "Review budget" : "Ver orçamento",
        iconName: category.icon,
        color: category.color ?? "#fda4af",
      });

      return;
    }

    if (percentage >= 75) {
      alerts.push({
        id: `budget-near-${budget.id}`,
        level: "warning",
        title: isEnglish
          ? `${category.name} budget is close to its limit`
          : `Orçamento de ${category.name} está perto do limite`,
        description: isEnglish
          ? `${formatCurrency(spent, locale)} was used from a ${formatCurrency(
              limit,
              locale,
            )} limit.`
          : `${formatCurrency(
              spent,
              locale,
            )} foi utilizado de um limite de ${formatCurrency(
              limit,
              locale,
            )}.`,
        detail: `${percentage.toFixed(0)}%`,
        href: `/${locale}/budgets`,
        actionLabel: isEnglish ? "Review budget" : "Ver orçamento",
        iconName: category.icon,
        color: category.color ?? "#fcd34d",
      });
    }
  });

  typedRecurring.forEach((item) => {
    const daysUntil = getDaysUntil(item.next_occurrence);
    const amount = Number(item.amount);
    const isIncome = item.type === "income";

    if (daysUntil < 0) {
      alerts.push({
        id: `recurring-overdue-${item.id}`,
        level: "danger",
        title: isEnglish
          ? `${item.description} is overdue`
          : `${item.description} está vencida`,
        description: isEnglish
          ? `This ${isIncome ? "income" : "expense"} was due on ${formatDate(
              item.next_occurrence,
              locale,
            )}.`
          : `Esta ${
              isIncome ? "receita" : "despesa"
            } venceu em ${formatDate(item.next_occurrence, locale)}.`,
        detail: isIncome
          ? `+${formatCurrency(amount, locale)}`
          : `-${formatCurrency(amount, locale)}`,
        href: `/${locale}/recurring`,
        actionLabel: isEnglish ? "Generate entry" : "Gerar lançamento",
        iconName: isIncome ? "wallet" : "repeat",
        color: isIncome ? "#6ee7b7" : "#fda4af",
      });

      return;
    }

    if (daysUntil <= 3) {
      alerts.push({
        id: `recurring-soon-${item.id}`,
        level: "info",
        title: isEnglish
          ? `${item.description} is due soon`
          : `${item.description} vence em breve`,
        description:
          daysUntil === 0
            ? isEnglish
              ? "This recurring item is due today."
              : "Esta recorrência vence hoje."
            : isEnglish
              ? `This item is due in ${daysUntil} day(s).`
              : `Esta recorrência vence em ${daysUntil} dia(s).`,
        detail: isIncome
          ? `+${formatCurrency(amount, locale)}`
          : `-${formatCurrency(amount, locale)}`,
        href: `/${locale}/recurring`,
        actionLabel: isEnglish ? "View recurrence" : "Ver recorrência",
        iconName: isIncome ? "wallet" : "repeat",
        color: isIncome ? "#67e8f9" : "#fcd34d",
      });
    }
  });

  typedGoals.forEach((goal) => {
    if (!goal.target_date) {
      return;
    }

    const daysUntil = getDaysUntil(goal.target_date);
    const targetAmount = Number(goal.target_amount);
    const currentAmount = Number(goal.current_amount);
    const remaining = Math.max(targetAmount - currentAmount, 0);

    if (daysUntil < 0) {
      alerts.push({
        id: `goal-overdue-${goal.id}`,
        level: "danger",
        title: isEnglish
          ? `${goal.name} target date has passed`
          : `A data desejada de ${goal.name} passou`,
        description: isEnglish
          ? `You still need ${formatCurrency(
              remaining,
              locale,
            )} to reach this goal.`
          : `Ainda faltam ${formatCurrency(
              remaining,
              locale,
            )} para atingir esta meta.`,
        detail: formatDate(goal.target_date, locale),
        href: `/${locale}/goals`,
        actionLabel: isEnglish ? "View goal" : "Ver meta",
        iconName: goal.icon,
        color: goal.color ?? "#fda4af",
      });

      return;
    }

    if (daysUntil <= 30) {
      alerts.push({
        id: `goal-soon-${goal.id}`,
        level: "warning",
        title: isEnglish
          ? `${goal.name} target date is approaching`
          : `A data desejada de ${goal.name} está próxima`,
        description: isEnglish
          ? `${formatCurrency(
              remaining,
              locale,
            )} remains and the target date is in ${daysUntil} day(s).`
          : `Faltam ${formatCurrency(
              remaining,
              locale,
            )} e a data desejada é em ${daysUntil} dia(s).`,
        detail: formatDate(goal.target_date, locale),
        href: `/${locale}/goals`,
        actionLabel: isEnglish ? "View goal" : "Ver meta",
        iconName: goal.icon,
        color: goal.color ?? "#fcd34d",
      });
    }
  });

  const sortedAlerts = alerts.sort((first, second) => {
    const priority: Record<AlertLevel, number> = {
      danger: 0,
      warning: 1,
      info: 2,
    };

    return priority[first.level] - priority[second.level];
  });

  const dangerCount = sortedAlerts.filter(
    (alert) => alert.level === "danger",
  ).length;

  const warningCount = sortedAlerts.filter(
    (alert) => alert.level === "warning",
  ).length;

  const infoCount = sortedAlerts.filter(
    (alert) => alert.level === "info",
  ).length;

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-amber-950/25 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-80 rounded-full bg-rose-400/10 blur-3xl"
        />

        <div className="relative max-w-2xl">
          <p className="app-kicker">
            {isEnglish ? "Financial monitoring" : "Monitoramento financeiro"}
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
            {isEnglish
              ? "Know what needs your attention."
              : "Saiba o que precisa da sua atenção."}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            {isEnglish
              ? "Alerts are calculated from your budgets, recurring items, goals, and account balances."
              : "Os alertas são calculados a partir dos seus orçamentos, recorrências, metas e saldos das contas."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Attention required" : "Atenção necessária"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-rose-300">
            {dangerCount}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Items requiring immediate action."
              : "Itens que exigem ação imediata."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Near limit" : "Próximos do limite"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-amber-200">
            {warningCount}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Situations that deserve planning."
              : "Situações que merecem planejamento."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Upcoming" : "Próximos"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-cyan-200">
            {infoCount}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Recurring items due in the next few days."
              : "Recorrências com vencimento nos próximos dias."}
          </p>
        </article>
      </section>

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Priority list" : "Lista de prioridades"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Your financial alerts" : "Seus alertas financeiros"}
            </h2>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-300">
            {sortedAlerts.length}{" "}
            {isEnglish
              ? sortedAlerts.length === 1
                ? "alert"
                : "alerts"
              : sortedAlerts.length === 1
                ? "alerta"
                : "alertas"}
          </span>
        </div>

        {sortedAlerts.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.1] text-2xl text-emerald-200">
              ✓
            </span>

            <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
              {isEnglish
                ? "Everything looks under control"
                : "Tudo parece sob controle"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {isEnglish
                ? "There are no financial alerts requiring your attention right now."
                : "Não há alertas financeiros que precisem da sua atenção neste momento."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {sortedAlerts.map((alert) => {
              const styles = getLevelStyles(alert.level);

              return (
                <article key={alert.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconBackground} ${styles.iconColor}`}
                        style={
                          alert.color
                            ? {
                                backgroundColor: `${alert.color}20`,
                                color: alert.color,
                              }
                            : undefined
                        }
                      >
                        {alert.iconName ? (
                          <CategoryIcon
                            name={alert.iconName}
                            size={21}
                            strokeWidth={1.9}
                          />
                        ) : (
                          <span className="text-lg font-bold">
                            {styles.icon}
                          </span>
                        )}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-100">
                            {alert.title}
                          </h3>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${styles.badge}`}
                          >
                            {getAlertLabel(alert.level, isEnglish)}
                          </span>
                        </div>

                        <p className="mt-1.5 text-sm leading-6 text-slate-400">
                          {alert.description}
                        </p>

                        {alert.detail ? (
                          <p className="mt-2 text-sm font-semibold text-slate-200">
                            {alert.detail}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <Link
                      href={alert.href}
                      className={`inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-3 text-xs font-bold transition ${styles.action}`}
                    >
                      {alert.actionLabel} →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Keep it current" : "Mantenha tudo atualizado"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
              {isEnglish
                ? "Alerts become more accurate with complete data"
                : "Os alertas ficam mais precisos com dados completos"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Record transactions consistently and keep budgets, recurring items, and goals updated."
                : "Registre lançamentos com consistência e mantenha orçamentos, recorrências e metas atualizados."}
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