import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryIcon} from "@/components/categories/category-icon";
import {BudgetForm} from "@/components/budgets/budget-form";
import {BudgetActions} from "@/components/budgets/budget-actions";

export const metadata: Metadata = {
  title: "Orçamentos",
  description: "Defina limites mensais para suas categorias de despesa.",
};

type BudgetsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    month?: string;
  }>;
};

type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

type BudgetFromDatabase = {
  id: string;
  amount: number | string;
  month: string;
  category:
    | ExpenseCategory[]
    | ExpenseCategory
    | null;
};

type ExpenseTransaction = {
  amount: number | string;
  category_id: string | null;
};

type BudgetItem = {
  id: string;
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category: ExpenseCategory;
};

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function getDefaultMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function isValidMonth(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

function getMonthRange(monthValue: string) {
  const [yearText, monthText] = monthValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  function toDateString(date: Date) {
    const dateYear = date.getFullYear();
    const dateMonth = String(date.getMonth() + 1).padStart(2, "0");
    const dateDay = String(date.getDate()).padStart(2, "0");

    return `${dateYear}-${dateMonth}-${dateDay}`;
  }

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

function formatMonth(month: string, locale: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
}

function getStatus(percentage: number) {
  if (percentage >= 100) {
    return {
      bar: "bg-rose-400",
      text: "text-rose-200",
      badge: "border-rose-300/20 bg-rose-300/10 text-rose-100",
    };
  }

  if (percentage >= 75) {
    return {
      bar: "bg-amber-300",
      text: "text-amber-200",
      badge: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    };
  }

  return {
    bar: "bg-emerald-300",
    text: "text-emerald-200",
    badge: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  };
}

export default async function BudgetsPage({
  params,
  searchParams,
}: BudgetsPageProps) {
  const {locale: receivedLocale} = await params;
  const locale = receivedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const {month: requestedMonth} = await searchParams;

  const selectedMonth = isValidMonth(requestedMonth)
    ? requestedMonth
    : getDefaultMonth();

  const {start: monthStart, end: nextMonthStart} = getMonthRange(
    selectedMonth,
  );

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [
    {data: categories, error: categoriesError},
    {data: budgets, error: budgetsError},
    {data: expenseTransactions, error: transactionsError},
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, color, icon")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .order("name", {ascending: true}),

    supabase
      .from("budgets")
      .select(`
        id,
        amount,
        month,
        category:categories!budgets_category_id_fkey (
          id,
          name,
          color,
          icon
        )
      `)
      .eq("user_id", user.id)
      .eq("month", `${selectedMonth}-01`)
      .order("created_at", {ascending: false}),

    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("occurred_on", monthStart)
      .lt("occurred_on", nextMonthStart),
  ]);

  if (categoriesError) {
    console.error("Erro ao carregar categorias de despesa:", categoriesError);
    throw new Error("Não foi possível carregar as categorias.");
  }

  if (budgetsError) {
    console.error("Erro ao carregar orçamentos:", budgetsError);
    throw new Error("Não foi possível carregar os orçamentos.");
  }

  if (transactionsError) {
    console.error("Erro ao carregar gastos mensais:", transactionsError);
    throw new Error("Não foi possível carregar os gastos mensais.");
  }

  const typedCategories = (categories ?? []) as ExpenseCategory[];
  const typedExpenses = (expenseTransactions ?? []) as ExpenseTransaction[];

  const spentByCategory = new Map<string, number>();

  typedExpenses.forEach((transaction) => {
    if (!transaction.category_id) {
      return;
    }

    const currentAmount = spentByCategory.get(transaction.category_id) ?? 0;

    spentByCategory.set(
      transaction.category_id,
      currentAmount + Number(transaction.amount),
    );
  });

  const budgetItems: BudgetItem[] = (
    (budgets ?? []) as unknown as BudgetFromDatabase[]
  )
    .map((budget) => {
      const category = getFirstRelation(budget.category);

      if (!category) {
        return null;
      }

      const amount = Number(budget.amount);
      const spent = spentByCategory.get(category.id) ?? 0;
      const remaining = amount - spent;
      const percentage = amount > 0 ? (spent / amount) * 100 : 0;

      return {
        id: budget.id,
        month: budget.month,
        amount,
        spent,
        remaining,
        percentage,
        category,
      };
    })
    .filter((budget): budget is BudgetItem => budget !== null);

  const totalBudget = budgetItems.reduce(
    (total, budget) => total + budget.amount,
    0,
  );

  const totalSpent = budgetItems.reduce(
    (total, budget) => total + budget.spent,
    0,
  );

  const totalRemaining = totalBudget - totalSpent;

  const overBudgetCount = budgetItems.filter(
    (budget) => budget.percentage >= 100,
  ).length;

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-amber-950/25 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/14 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-80 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Spending planning" : "Planejamento de gastos"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? "Spend with intention."
                : "Gaste com intenção."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? `Set category limits and monitor your spending in ${formatMonth(
                    selectedMonth,
                    locale,
                  )}.`
                : `Defina limites por categoria e acompanhe seus gastos em ${formatMonth(
                    selectedMonth,
                    locale,
                  )}.`}
            </p>
          </div>

          <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
              type="month"
              name="month"
              defaultValue={selectedMonth}
              className="h-11 rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none focus:border-amber-300/55 focus:ring-2 focus:ring-amber-300/10"
            />

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
            >
              {isEnglish ? "View month" : "Ver mês"}
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Planned" : "Planejado"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white">
            {formatCurrency(totalBudget, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Total configured for the selected month."
              : "Total configurado para o mês selecionado."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Spent" : "Gasto"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-rose-300">
            {formatCurrency(totalSpent, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Expense transactions linked to budgeted categories."
              : "Despesas vinculadas às categorias orçadas."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Available" : "Disponível"}
          </p>

          <p
            className={`mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] ${
              totalRemaining >= 0 ? "text-emerald-200" : "text-rose-300"
            }`}
          >
            {formatCurrency(totalRemaining, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {overBudgetCount > 0
              ? isEnglish
                ? `${overBudgetCount} budget(s) have reached their limit.`
                : `${overBudgetCount} orçamento(s) já atingiram o limite.`
              : isEnglish
                ? "All configured budgets are under control."
                : "Todos os orçamentos configurados estão sob controle."}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <BudgetForm
          locale={locale}
          month={selectedMonth}
          categories={typedCategories}
        />

        <article className="app-surface overflow-hidden rounded-[1.7rem]">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="app-kicker">
                {isEnglish ? "Monthly tracking" : "Acompanhamento mensal"}
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
                {isEnglish ? "Category budgets" : "Orçamentos por categoria"}
              </h2>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-300">
              {budgetItems.length}{" "}
              {isEnglish
                ? budgetItems.length === 1
                  ? "budget"
                  : "budgets"
                : budgetItems.length === 1
                  ? "orçamento"
                  : "orçamentos"}
            </span>
          </div>

          {budgetItems.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-amber-300/[0.1] text-2xl text-amber-200">
                ◉
              </span>

              <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
                {isEnglish
                  ? "No budgets for this month"
                  : "Nenhum orçamento neste mês"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Create category limits to understand how much remains available to spend."
                  : "Crie limites por categoria para entender quanto ainda está disponível para gastar."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {budgetItems.map((budget) => {
                const status = getStatus(budget.percentage);
                const visiblePercentage = Math.min(budget.percentage, 100);

                return (
                  <div key={budget.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                            style={{
                              backgroundColor: `${budget.category.color}20`,
                              color: budget.category.color,
                              boxShadow: `0 0 18px ${budget.category.color}18`,
                            }}
                          >
                            <CategoryIcon
                              name={budget.category.icon}
                              size={21}
                              strokeWidth={1.9}
                            />
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-100">
                              {budget.category.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {isEnglish ? "Monthly limit" : "Limite mensal"}:{" "}
                              {formatCurrency(budget.amount, locale)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-400">
                              {isEnglish ? "Spent" : "Gasto"}:{" "}
                              <span className="font-semibold text-slate-200">
                                {formatCurrency(budget.spent, locale)}
                              </span>
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 font-semibold ${status.badge}`}
                            >
                              {budget.percentage.toFixed(0)}%
                            </span>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                            <div
                              className={`h-full rounded-full transition-all ${status.bar}`}
                              style={{width: `${visiblePercentage}%`}}
                            />
                          </div>

                          <p className={`mt-2 text-xs ${status.text}`}>
                            {budget.remaining >= 0
                              ? isEnglish
                                ? `${formatCurrency(
                                    budget.remaining,
                                    locale,
                                  )} remaining`
                                : `${formatCurrency(
                                    budget.remaining,
                                    locale,
                                  )} disponível`
                              : isEnglish
                                ? `${formatCurrency(
                                    Math.abs(budget.remaining),
                                    locale,
                                  )} over budget`
                                : `${formatCurrency(
                                    Math.abs(budget.remaining),
                                    locale,
                                  )} acima do limite`}
                          </p>
                        </div>
                      </div>

                      <div className="w-full lg:w-56">
                        <BudgetActions
                          locale={locale}
                          budgetId={budget.id}
                          amount={budget.amount}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Next step" : "Próximo passo"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
              {isEnglish
                ? "Record your expenses consistently"
                : "Registre suas despesas com consistência"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Budget progress updates automatically as expense transactions are registered in each category."
                : "O progresso dos orçamentos é atualizado automaticamente conforme despesas são registradas em cada categoria."}
            </p>
          </div>

          <Link
            href={`/${locale}/transactions/new`}
            className="app-shine inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-200"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            {isEnglish ? "New transaction" : "Novo lançamento"}
          </Link>
        </div>
      </section>
    </main>
  );
}