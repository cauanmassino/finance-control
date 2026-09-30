import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CashFlowChart} from "@/components/dashboard/cash-flow-chart";
import {CategorySpendingChart} from "@/components/dashboard/category-spending-chart";
import {AccountDistributionChart} from "@/components/dashboard/account-distribution-chart";
import {CategoryIcon} from "@/components/categories/category-icon";
import {GoalsSummary} from "@/components/dashboard/goals-summary";
import {AlertsSummary} from "@/components/dashboard/alerts-summary";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type Account = {
  id: string;
  name: string;
  color: string | null;
};

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
};

type RecentTransaction = {
  id: string;
  description: string;
  amount: number | string;
  type: "income" | "expense";
  occurred_on: string;
  account: Account[] | Account | null;
  category: Category[] | Category | null;
};

type RecurringTransaction = {
  id: string;
  description: string;
  amount: number | string;
  type: "income" | "expense";
  next_occurrence: string | null;
};

type AccountBalance = Account & {
  balance: number;
  share: number;
};

type CashFlowItem = {
  occurred_on: string;
  amount: number | string;
  type: "income" | "expense";
};

type CategoryExpenseItem = {
  amount: number | string;
  category: Category[] | Category | null;
};

type CategorySpending = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  amount: number;
  percentage: number;
};

type CashFlowPoint = {
  label: string;
  income: number;
  expense: number;
  result: number;
};

type BudgetFromDatabase = {
  id: string;
  amount: number | string;
  category: Category[] | Category | null;
};

type BudgetSummaryItem = {
  id: string;
  amount: number;
  spent: number;
  percentage: number;
  category: Category;
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

function getMonthLabel(locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function getMonthKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

function getMonthShortLabel(date: Date, locale: string) {
  const label = new Intl.DateTimeFormat(
    locale === "en" ? "en-US" : "pt-BR",
    {
      month: "short",
    },
  ).format(date);

  return label.replace(".", "").slice(0, 3);
}

function getLastMonths(count: number, locale: string) {
  const now = new Date();

  return Array.from({length: count}, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (count - 1 - index),
      1,
    );

    return {
      key: getMonthKey(date),
      label: getMonthShortLabel(date, locale),
    };
  });
}

export default async function DashboardPage({
  params,
}: PageProps) {
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

const {data: profile, error: profileError} = await supabase
  .from("profiles")
  .select("onboarding_completed")
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  console.error("Erro ao carregar perfil do dashboard:", profileError);
}

if (!profile?.onboarding_completed) {
  redirect(`/${locale}/onboarding`);
}

const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sixMonthsStart = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1,
  );

  const monthStartText = toDateString(monthStart);
  const nextMonthStartText = toDateString(nextMonthStart);
  const sixMonthsStartText = toDateString(sixMonthsStart);

  const [
    {data: accounts, error: accountsError},
    {data: monthTransactions, error: monthTransactionsError},
    {data: allTransactions, error: allTransactionsError},
    {data: recentData, error: recentError},
    {data: recurringData, error: recurringError},
    {data: cashFlowData, error: cashFlowError},
    {data: categoryExpenseData, error: categoryExpenseError},
    {data: budgetsData, error: budgetsError},
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user.id)
      .neq("type", "transfer")
      .gte("occurred_on", monthStartText)
      .lt("occurred_on", nextMonthStartText),

    supabase
      .from("transactions")
      .select("type, amount, account_id, transfer_account_id")
      .eq("user_id", user.id),

    supabase
      .from("transactions")
      .select(`
        id,
        description,
        amount,
        type,
        occurred_on,
        account:accounts!transactions_account_id_fkey (
          id,
          name,
          color
        ),
        category:categories!transactions_category_id_fkey (
          id,
          name,
          color,
          icon
        )
      `)
      .eq("user_id", user.id)
      .neq("type", "transfer")
      .order("occurred_on", {ascending: false})
      .order("created_at", {ascending: false})
      .limit(6),

    supabase
      .from("recurring_transactions")
      .select("id, description, amount, type, next_occurrence")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("next_occurrence", {ascending: true})
      .limit(4),

    supabase
      .from("transactions")
      .select("occurred_on, amount, type")
      .eq("user_id", user.id)
      .neq("type", "transfer")
      .gte("occurred_on", sixMonthsStartText)
      .lt("occurred_on", nextMonthStartText),

    supabase
      .from("transactions")
      .select(`
        amount,
        category:categories!transactions_category_id_fkey (
          id,
          name,
          color,
          icon
        )
      `)
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("occurred_on", monthStartText)
      .lt("occurred_on", nextMonthStartText),

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
      .eq("month", monthStartText),
  ]);

  const loadError =
    accountsError ??
    monthTransactionsError ??
    allTransactionsError ??
    recentError ??
    recurringError ??
    cashFlowError ??
    categoryExpenseError ??
    budgetsError;

  if (loadError) {
    console.error("Erro ao carregar dashboard:", {
      code: loadError.code,
      message: loadError.message,
      details: loadError.details,
      hint: loadError.hint,
    });
  }

  const typedAccounts = (accounts ?? []) as Account[];

  const income = (monthTransactions ?? [])
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const expenses = (monthTransactions ?? [])
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const monthResult = income - expenses;

  const accountBalances: AccountBalance[] = typedAccounts.map((account) => {
    const balance = (allTransactions ?? []).reduce(
      (total, transaction) => {
        const amount = Number(transaction.amount);

        if (transaction.type === "income") {
          return transaction.account_id === account.id
            ? total + amount
            : total;
        }

        if (transaction.type === "expense") {
          return transaction.account_id === account.id
            ? total - amount
            : total;
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
      },
      0,
    );

    return {
      ...account,
      balance,
      share: 0,
    };
  });

  const totalBalance = accountBalances.reduce(
    (total, account) => total + account.balance,
    0,
  );

  const accountBalancesWithShare = accountBalances.map((account) => ({
    ...account,
    share:
      totalBalance > 0
        ? Math.max((account.balance / totalBalance) * 100, 0)
        : 0,
  }));

  const lastMonths = getLastMonths(6, locale);

  const cashFlowMap = new Map<
    string,
    {
      income: number;
      expense: number;
    }
  >();

  lastMonths.forEach((month) => {
    cashFlowMap.set(month.key, {
      income: 0,
      expense: 0,
    });
  });

  ((cashFlowData ?? []) as CashFlowItem[]).forEach((transaction) => {
    const monthKey = transaction.occurred_on.slice(0, 7);
    const month = cashFlowMap.get(monthKey);

    if (!month) {
      return;
    }

    if (transaction.type === "income") {
      month.income += Number(transaction.amount);
    }

    if (transaction.type === "expense") {
      month.expense += Number(transaction.amount);
    }
  });

  const cashFlowPoints: CashFlowPoint[] = lastMonths.map((month) => {
    const values = cashFlowMap.get(month.key) ?? {
      income: 0,
      expense: 0,
    };

    return {
      label: month.label,
      income: values.income,
      expense: values.expense,
      result: values.income - values.expense,
    };
  });

  const categoryMap = new Map<
    string,
    {
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
      amount: number;
    }
  >();

  ((categoryExpenseData ?? []) as unknown as CategoryExpenseItem[]).forEach(
    (transaction) => {
      const category = getFirstRelation(transaction.category);
      const categoryId = category?.id ?? "uncategorized";

      const existing = categoryMap.get(categoryId) ?? {
        id: categoryId,
        name: category?.name ?? (isEnglish ? "No category" : "Sem categoria"),
        color: category?.color ?? "#fb7185",
        icon: category?.icon ?? null,
        amount: 0,
      };

      existing.amount += Number(transaction.amount);
      categoryMap.set(categoryId, existing);
    },
  );

  const categorySpending: CategorySpending[] = Array.from(categoryMap.values())
    .sort((first, second) => second.amount - first.amount)
    .slice(0, 5)
    .map((category) => ({
      ...category,
      percentage:
        expenses > 0 ? Math.min((category.amount / expenses) * 100, 100) : 0,
  }));

  const spentByCategory = new Map<string, number>();

  categoryMap.forEach((category) => {
    spentByCategory.set(category.id, category.amount);
  });

  const budgetSummaryItems: BudgetSummaryItem[] = (
    (budgetsData ?? []) as unknown as BudgetFromDatabase[]
  )
    .map((budget) => {
      const category = getFirstRelation(budget.category);

      if (!category) {
        return null;
      }

      const amount = Number(budget.amount);
      const spent = spentByCategory.get(category.id) ?? 0;

      return {
        id: budget.id,
        amount,
        spent,
        percentage: amount > 0 ? (spent / amount) * 100 : 0,
        category,
      };
    })
    .filter((budget): budget is BudgetSummaryItem => budget !== null)
    .sort((first, second) => second.percentage - first.percentage);

  const totalBudget = budgetSummaryItems.reduce(
    (total, budget) => total + budget.amount,
    0,
  );

  const totalBudgetSpent = budgetSummaryItems.reduce(
    (total, budget) => total + budget.spent,
    0,
  );

  const totalBudgetRemaining = totalBudget - totalBudgetSpent;

  const budgetUsagePercentage =
    totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

  const visibleBudgetUsage = Math.min(budgetUsagePercentage, 100);

  const overBudgetCount = budgetSummaryItems.filter(
    (budget) => budget.percentage >= 100,
  ).length;

  const warningBudgetCount = budgetSummaryItems.filter(
    (budget) => budget.percentage >= 75 && budget.percentage < 100,
  ).length;

  const typedRecent = (recentData ?? []) as unknown as RecentTransaction[];
  const typedRecurring = (recurringData ?? []) as RecurringTransaction[];

  const biggestExpense =
    expenses > 0 ? Math.min((expenses / Math.max(income, 1)) * 100, 100) : 0;

  const savingsRate =
    income > 0 ? Math.max((monthResult / income) * 100, 0) : 0;

  const balanceStatus =
    monthResult >= 0
      ? isEnglish
        ? "Positive month"
        : "Mês positivo"
      : isEnglish
        ? "Attention needed"
        : "Atenção necessária";

  const budgetStatus =
    overBudgetCount > 0
      ? {
          label: isEnglish
            ? `${overBudgetCount} budget(s) over limit`
            : `${overBudgetCount} orçamento(s) acima do limite`,
          bar: "bg-rose-400",
          text: "text-rose-200",
          badge: "border-rose-300/20 bg-rose-300/10 text-rose-100",
        }
      : warningBudgetCount > 0
        ? {
            label: isEnglish
              ? `${warningBudgetCount} budget(s) close to the limit`
              : `${warningBudgetCount} orçamento(s) perto do limite`,
            bar: "bg-amber-300",
            text: "text-amber-200",
            badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
          }
        : {
            label: isEnglish
              ? "All budgets are under control"
              : "Todos os orçamentos estão sob controle",
            bar: "bg-emerald-300",
            text: "text-emerald-200",
            badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
          };

  const dashboardAlerts = [
    ...(overBudgetCount > 0
      ? [
          {
            id: "budget-alert",
            level: "danger" as const,
            title: isEnglish
              ? "One or more budgets were exceeded"
              : "Um ou mais orçamentos foram ultrapassados",
            description: isEnglish
              ? "Review your category limits."
              : "Revise seus limites por categoria.",
            href: `/${locale}/budgets`,
            iconName: "wallet",
            color: "#fda4af",
          },
        ]
      : []),
    ...(warningBudgetCount > 0
      ? [
          {
            id: "budget-warning",
            level: "warning" as const,
            title: isEnglish
              ? "Some budgets are near their limits"
              : "Alguns orçamentos estão perto do limite",
            description: isEnglish
              ? "Keep an eye on your spending."
              : "Fique atento aos seus gastos.",
            href: `/${locale}/budgets`,
            iconName: "wallet",
            color: "#fcd34d",
          },
        ]
      : []),
    ...(totalBalance < 0
      ? [
          {
            id: "balance-alert",
            level: "danger" as const,
            title: isEnglish
              ? "Your total balance is negative"
              : "Seu saldo total está negativo",
            description: isEnglish
              ? "Review your accounts and recent expenses."
              : "Revise suas contas e despesas recentes.",
            href: `/${locale}/accounts`,
            iconName: "wallet",
            color: "#fda4af",
          },
        ]
      : []),
  ];

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/72 to-emerald-950/30 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 h-44 w-80 rounded-full bg-cyan-500/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Financial overview" : "Visão financeira"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish ? "Your money, clear." : "Seu dinheiro, claro."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? `A precise view of your financial position in ${getMonthLabel(
                    locale,
                  )}.`
                : `Uma visão precisa da sua posição financeira em ${getMonthLabel(
                    locale,
                  )}.`}
            </p>

            <div className="mt-7">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                {isEnglish ? "Total balance" : "Saldo total"}
              </p>

              <p
                className={`mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.065em] sm:text-5xl lg:text-6xl ${
                  totalBalance >= 0 ? "text-white" : "text-rose-300"
                }`}
              >
                {formatCurrency(totalBalance, locale)}
              </p>

              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  monthResult >= 0
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-rose-300/20 bg-rose-300/10 text-rose-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    monthResult >= 0
                      ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]"
                      : "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.9)]"
                  }`}
                />
                {balanceStatus}
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-md">
            <Link
              href={`/${locale}/transactions/new`}
              className="app-shine group flex min-h-28 flex-col justify-between rounded-2xl border border-emerald-200/25 bg-emerald-300 px-5 py-4 text-emerald-950 shadow-[0_18px_38px_rgba(16,185,129,0.2)] transition hover:-translate-y-1 hover:bg-emerald-200"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-950/12 text-lg">
                +
              </span>

              <span>
                <span className="block text-sm font-bold">
                  {isEnglish ? "New transaction" : "Novo lançamento"}
                </span>

                <span className="mt-0.5 block text-xs text-emerald-950/70">
                  {isEnglish
                    ? "Add income or expense"
                    : "Adicione receita ou despesa"}
                </span>
              </span>
            </Link>

            <Link
              href={`/${locale}/transfers/new`}
              className="app-shine group flex min-h-28 flex-col justify-between rounded-2xl border border-white/12 bg-white/[0.07] px-5 py-4 text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.11]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-400/15 text-lg text-sky-200">
                ⇄
              </span>

              <span>
                <span className="block text-sm font-bold">
                  {isEnglish ? "Transfer money" : "Transferir dinheiro"}
                </span>

                <span className="mt-0.5 block text-xs text-slate-400">
                  {isEnglish
                    ? "Move between accounts"
                    : "Mova entre suas contas"}
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {typedAccounts.length === 0 ? (
        <section className="relative overflow-hidden rounded-[1.7rem] border border-emerald-300/20 bg-gradient-to-r from-emerald-300/[0.12] via-emerald-300/[0.06] to-cyan-400/[0.08] p-5 shadow-[0_18px_44px_rgba(16,185,129,0.08)] sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-xl font-black text-emerald-950 shadow-[0_10px_24px_rgba(52,211,153,0.22)]">
                1
              </span>

              <div>
                <p className="text-sm font-bold text-emerald-100">
                  {isEnglish
                    ? "Start with your first account"
                    : "Comece pela sua primeira conta"}
                </p>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-50/80">
                  {isEnglish
                    ? "Add your bank account, wallet, savings account, or investment balance to begin tracking your finances."
                    : "Adicione sua conta bancária, carteira, poupança ou investimento para começar a acompanhar sua vida financeira."}
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/accounts/new`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_24px_rgba(52,211,153,0.18)] transition hover:bg-emerald-200"
            >
              <span className="mr-2 text-lg leading-none">+</span>
              {isEnglish ? "Add account" : "Adicionar conta"}
            </Link>
          </div>
        </section>
      ) : typedRecent.length === 0 ? (
        <section className="relative overflow-hidden rounded-[1.7rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-300/[0.10] via-sky-400/[0.06] to-violet-400/[0.08] p-5 shadow-[0_18px_44px_rgba(56,189,248,0.07)] sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-black text-cyan-950 shadow-[0_10px_24px_rgba(56,189,248,0.22)]">
                2
              </span>

              <div>
                <p className="text-sm font-bold text-cyan-100">
                  {isEnglish
                    ? "Record your first transaction"
                    : "Registre seu primeiro lançamento"}
                </p>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-cyan-50/80">
                  {isEnglish
                    ? "Add an income or expense to make your dashboard, charts, and financial insights useful."
                    : "Adicione uma receita ou despesa para tornar seu dashboard, gráficos e insights financeiros mais úteis."}
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/transactions/new`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300 px-4 text-sm font-bold text-cyan-950 shadow-[0_10px_24px_rgba(56,189,248,0.18)] transition hover:bg-cyan-200"
            >
              <span className="mr-2 text-lg leading-none">+</span>
              {isEnglish ? "Add transaction" : "Adicionar lançamento"}
            </Link>
          </div>
        </section>
      ) : null}

      {loadError ? (
        <section className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {isEnglish
            ? "Some dashboard data could not be loaded. Please refresh the page."
            : "Alguns dados do dashboard não puderam ser carregados. Atualize a página."}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Income this month" : "Receitas do mês"}
              </p>

              <p className="amount-positive mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em]">
                {formatCurrency(income, locale)}
              </p>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/12 text-xl text-emerald-300">
              ↗
            </span>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/7">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
              style={{width: income > 0 ? "100%" : "0%"}}
            />
          </div>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Expenses this month" : "Despesas do mês"}
              </p>

              <p className="amount-negative mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em]">
                {formatCurrency(expenses, locale)}
              </p>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-400/12 text-xl text-rose-300">
              ↘
            </span>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/7">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-300"
              style={{width: `${biggestExpense}%`}}
            />
          </div>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Monthly result" : "Resultado do mês"}
              </p>

              <p
                className={`mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] ${
                  monthResult >= 0 ? "text-emerald-200" : "text-rose-300"
                }`}
              >
                {monthResult >= 0 ? "+" : ""}
                {formatCurrency(monthResult, locale)}
              </p>
            </div>

            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${
                monthResult >= 0
                  ? "bg-emerald-400/12 text-emerald-300"
                  : "bg-rose-400/12 text-rose-300"
              }`}
            >
              {monthResult >= 0 ? "✦" : "!"}
            </span>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            {income > 0
              ? isEnglish
                ? `${savingsRate.toFixed(0)}% of income retained this month.`
                : `${savingsRate.toFixed(
                    0,
                  )}% da receita foi preservada neste mês.`
              : isEnglish
                ? "Add income to see your monthly saving rate."
                : "Adicione receitas para visualizar sua taxa mensal."}
          </p>
        </article>
      </section>

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Monthly planning" : "Planejamento mensal"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Budget overview" : "Resumo de orçamentos"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {isEnglish
                ? "Monitor how much of your category limits has already been used."
                : "Acompanhe quanto dos limites por categoria já foi utilizado."}
            </p>
          </div>

          <Link
            href={`/${locale}/budgets`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            {isEnglish ? "View budgets" : "Ver orçamentos"} →
          </Link>
        </div>

        {budgetSummaryItems.length === 0 ? (
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {isEnglish
                  ? "No budgets configured for this month"
                  : "Nenhum orçamento configurado neste mês"}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Set spending limits by expense category to track your plan automatically."
                  : "Defina limites por categoria de despesa para acompanhar seu planejamento automaticamente."}
              </p>
            </div>

            <Link
              href={`/${locale}/budgets`}
              className="app-shine inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-bold text-amber-950 shadow-[0_10px_24px_rgba(252,211,77,0.13)] transition hover:bg-amber-200"
            >
              {isEnglish ? "Create budget" : "Criar orçamento"}
            </Link>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {isEnglish ? "Planned" : "Planejado"}
                </p>

                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-slate-100">
                  {formatCurrency(totalBudget, locale)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {isEnglish ? "Spent" : "Gasto"}
                </p>

                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-rose-300">
                  {formatCurrency(totalBudgetSpent, locale)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {isEnglish ? "Available" : "Disponível"}
                </p>

                <p
                  className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] ${
                    totalBudgetRemaining >= 0
                      ? "text-emerald-200"
                      : "text-rose-300"
                  }`}
                >
                  {formatCurrency(totalBudgetRemaining, locale)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-slate-950/25 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {isEnglish
                      ? "Overall budget usage"
                      : "Uso geral do orçamento"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {isEnglish
                      ? `${formatCurrency(
                          totalBudgetSpent,
                          locale,
                        )} used out of ${formatCurrency(totalBudget, locale)}`
                      : `${formatCurrency(
                          totalBudgetSpent,
                          locale,
                        )} utilizados de ${formatCurrency(
                          totalBudget,
                          locale,
                        )}`}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${budgetStatus.badge}`}
                >
                  {budgetUsagePercentage.toFixed(0)}%
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className={`h-full rounded-full transition-all ${budgetStatus.bar}`}
                  style={{width: `${visibleBudgetUsage}%`}}
                />
              </div>

              <p className={`mt-3 text-xs font-semibold ${budgetStatus.text}`}>
                {budgetStatus.label}
              </p>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {budgetSummaryItems.slice(0, 3).map((budget) => {
                const visiblePercentage = Math.min(budget.percentage, 100);

                const barClass =
                  budget.percentage >= 100
                    ? "bg-rose-400"
                    : budget.percentage >= 75
                      ? "bg-amber-300"
                      : "bg-emerald-300";

                return (
                  <div
                    key={budget.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: `${budget.category.color ?? "#64748b"}20`,
                          color: budget.category.color ?? "#64748b",
                        }}
                      >
                        <CategoryIcon
                          name={budget.category.icon}
                          size={18}
                          strokeWidth={1.9}
                        />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {budget.category.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatCurrency(budget.spent, locale)} /{" "}
                          {formatCurrency(budget.amount, locale)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className={`h-full rounded-full ${barClass}`}
                        style={{width: `${visiblePercentage}%`}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <AlertsSummary
        locale={locale}
        alerts={dashboardAlerts}
      />

      <CashFlowChart data={cashFlowPoints} locale={locale} />

      <section className="grid gap-5 xl:grid-cols-2">
        <CategorySpendingChart
          data={categorySpending}
          total={expenses}
          locale={locale}
        />

        <AccountDistributionChart
          data={accountBalancesWithShare}
          totalBalance={totalBalance}
          locale={locale}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.22fr_0.78fr]">
        <article className="app-surface rounded-[1.7rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="app-kicker">
                {isEnglish ? "Accounts" : "Contas"}
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
                {isEnglish ? "Where your money is" : "Onde está seu dinheiro"}
              </h2>
            </div>

            <Link
              href={`/${locale}/accounts`}
              className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
            >
              {isEnglish ? "Manage accounts" : "Gerenciar contas"} →
            </Link>
          </div>

          {accountBalancesWithShare.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-6 text-center">
              <p className="text-sm font-medium text-slate-200">
                {isEnglish ? "No accounts yet" : "Nenhuma conta ainda"}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Create your first account to track your balance."
                  : "Crie sua primeira conta para acompanhar seus saldos."}
              </p>

              <Link
                href={`/${locale}/accounts/new`}
                className="mt-4 inline-flex rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-950"
              >
                {isEnglish ? "Create account" : "Criar conta"}
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {accountBalancesWithShare.map((account) => (
                <div key={account.id}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full shadow-[0_0_14px_currentColor]"
                        style={{
                          backgroundColor: account.color ?? "#60a5fa",
                          color: account.color ?? "#60a5fa",
                        }}
                      />

                      <span className="truncate text-sm font-medium text-slate-200">
                        {account.name}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        account.balance >= 0
                          ? "text-slate-100"
                          : "text-rose-300"
                      }`}
                    >
                      {formatCurrency(account.balance, locale)}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${account.share}%`,
                        backgroundColor: account.color ?? "#60a5fa",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="app-surface rounded-[1.7rem] p-5 sm:p-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Upcoming" : "Próximas"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Recurring items" : "Recorrências"}
            </h2>
          </div>

          {typedRecurring.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5">
              <p className="text-sm text-slate-300">
                {isEnglish
                  ? "No active recurring transactions."
                  : "Nenhuma recorrência ativa."}
              </p>

              <Link
                href={`/${locale}/recurring`}
                className="mt-3 inline-flex text-xs font-bold text-emerald-300 hover:text-emerald-200"
              >
                {isEnglish
                  ? "Set up recurring items"
                  : "Configurar recorrências"}{" "}
                →
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {typedRecurring.map((item) => {
                const isIncome = item.type === "income";

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-200">
                        {item.description}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {item.next_occurrence
                          ? `${isEnglish ? "Due" : "Próxima"}: ${formatDate(
                              item.next_occurrence,
                              locale,
                            )}`
                          : "—"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-sm font-bold ${
                        isIncome ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(Number(item.amount), locale)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            href={`/${locale}/recurring`}
            className="mt-5 inline-flex text-xs font-bold text-slate-300 transition hover:text-white"
          >
            {isEnglish ? "See all recurring items" : "Ver todas as recorrências"}{" "}
            →
          </Link>
        </article>
      </section>

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Activity" : "Atividade"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Recent transactions" : "Lançamentos recentes"}
            </h2>
          </div>

          <Link
            href={`/${locale}/transactions`}
            className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            {isEnglish ? "View all" : "Ver todos"} →
          </Link>
        </div>

        {typedRecent.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-xl text-slate-400">
              ✦
            </span>

            <p className="mt-4 text-sm font-semibold text-slate-200">
              {isEnglish
                ? "Your activity will appear here."
                : "Sua atividade aparecerá aqui."}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              {isEnglish
                ? "Start by recording your first transaction."
                : "Comece registrando seu primeiro lançamento."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {typedRecent.map((transaction) => {
              const account = getFirstRelation(transaction.account);
              const category = getFirstRelation(transaction.category);
              const isIncome = transaction.type === "income";

              const accentColor =
                category?.color ?? (isIncome ? "#6ee7b7" : "#fda4af");

              return (
                <Link
                  key={transaction.id}
                  href={`/${locale}/transactions/${transaction.id}/edit`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: `${accentColor}1f`,
                        color: accentColor,
                        boxShadow: `0 0 18px ${accentColor}20`,
                      }}
                      title={
                        category?.name ??
                        (isEnglish ? "No category" : "Sem categoria")
                      }
                    >
                      {category?.icon ? (
                        <CategoryIcon
                          name={category.icon}
                          size={20}
                          strokeWidth={1.9}
                        />
                      ) : (
                        <span className="text-base">
                          {isIncome ? "↗" : "↘"}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {transaction.description}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {category?.name ??
                          (isEnglish ? "No category" : "Sem categoria")}
                        <span className="mx-1.5 text-slate-600">·</span>
                        {account?.name ??
                          (isEnglish ? "No account" : "Sem conta")}
                        <span className="mx-1.5 text-slate-600">·</span>
                        {formatDate(transaction.occurred_on, locale)}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-sm font-bold ${
                      isIncome ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount), locale)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}