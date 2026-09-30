import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryIcon} from "@/components/categories/category-icon";

export const metadata: Metadata = {
  title: "Relatórios",
  description: "Análise de receitas, despesas e categorias financeiras.",
};

type ReportsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    month?: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
};

type TransactionFromDatabase = {
  amount: number | string;
  type: "income" | "expense";
  category: Category[] | Category | null;
};

type CategoryTotal = {
  id: string | null;
  name: string;
  color: string;
  icon: string | null;
  total: number;
  percentage: number;
};

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function getDefaultMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
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
    labelDate: start,
  };
}

function formatMonthLabel(monthDate: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    month: "long",
    year: "numeric",
  }).format(monthDate);
}

export default async function ReportsPage({
  params,
  searchParams,
}: ReportsPageProps) {
  const {locale: receivedLocale} = await params;
  const locale = receivedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const {month: requestedMonth} = await searchParams;

  const selectedMonth = isValidMonth(requestedMonth)
    ? requestedMonth
    : getDefaultMonth();

  const {
    start: monthStart,
    end: nextMonthStart,
    labelDate,
  } = getMonthRange(selectedMonth);

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: transactions, error} = await supabase
    .from("transactions")
    .select(`
      amount,
      type,
      category:categories!transactions_category_id_fkey (
        id,
        name,
        color,
        icon
      )
    `)
    .eq("user_id", user.id)
    .neq("type", "transfer")
    .gte("occurred_on", monthStart)
    .lt("occurred_on", nextMonthStart);

  if (error) {
    console.error("Erro ao carregar relatório financeiro:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Não foi possível carregar o relatório.");
  }

  const typedTransactions = (
    transactions ?? []
  ) as unknown as TransactionFromDatabase[];

  const incomeTransactions = typedTransactions.filter(
    (transaction) => transaction.type === "income",
  );

  const expenseTransactions = typedTransactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const totalIncome = incomeTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0,
  );

  const totalExpenses = expenseTransactions.reduce(
    (total, transaction) => total + Number(transaction.amount),
    0,
  );

  const netResult = totalIncome - totalExpenses;

  const totalsByCategory = new Map<
    string,
    Omit<CategoryTotal, "percentage">
  >();

  for (const transaction of expenseTransactions) {
    const category = getFirstRelation(transaction.category);

    const categoryKey = category?.id ?? "uncategorized";
    const existing = totalsByCategory.get(categoryKey);

    if (existing) {
      existing.total += Number(transaction.amount);
      continue;
    }

    totalsByCategory.set(categoryKey, {
      id: category?.id ?? null,
      name: category?.name ?? (isEnglish ? "No category" : "Sem categoria"),
      color: category?.color ?? "#64748b",
      icon: category?.icon ?? null,
      total: Number(transaction.amount),
    });
  }

  const categoryTotals: CategoryTotal[] = Array.from(
    totalsByCategory.values(),
  )
    .map((category) => ({
      ...category,
      percentage:
        totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0,
    }))
    .sort((first, second) => second.total - first.total);

  const topCategory = categoryTotals[0] ?? null;
  const transactionCount = typedTransactions.length;
  const monthLabel = formatMonthLabel(labelDate, locale);

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-cyan-950/25 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-80 rounded-full bg-violet-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Financial analysis" : "Análise financeira"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? "Understand every financial choice."
                : "Entenda cada escolha financeira."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? `Analyze income, expenses, and category distribution for ${monthLabel}.`
                : `Analise receitas, despesas e a distribuição por categoria em ${monthLabel}.`}
            </p>
          </div>

          <Link
            href={`/${locale}/transactions`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
          >
            {isEnglish ? "View transactions" : "Ver lançamentos"} →
          </Link>
        </div>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="mb-5">
          <p className="app-kicker">
            {isEnglish ? "Period filter" : "Filtro de período"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
            {isEnglish ? "Reference month" : "Mês de referência"}
          </h2>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Month" : "Mês"}
            </span>

            <input
              type="month"
              name="month"
              defaultValue={selectedMonth}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-cyan-300/55 focus:ring-2 focus:ring-cyan-300/10"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-300 px-4 text-sm font-bold text-cyan-950 shadow-[0_10px_22px_rgba(103,232,249,0.15)] transition hover:bg-cyan-200"
          >
            {isEnglish ? "Apply filter" : "Aplicar filtro"}
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Income" : "Receitas"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-emerald-200">
            {formatCurrency(totalIncome, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Income registered in the selected month."
              : "Receitas registradas no mês selecionado."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Expenses" : "Despesas"}
          </p>

          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-rose-300">
            {formatCurrency(totalExpenses, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? "Expenses registered in the selected month."
              : "Despesas registradas no mês selecionado."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {isEnglish ? "Net result" : "Resultado líquido"}
          </p>

          <p
            className={`mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] ${
              netResult >= 0 ? "text-emerald-200" : "text-rose-300"
            }`}
          >
            {netResult >= 0 ? "+" : ""}
            {formatCurrency(netResult, locale)}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isEnglish
              ? `${transactionCount} transaction(s) analyzed.`
              : `${transactionCount} lançamento(s) analisado(s).`}
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="app-surface overflow-hidden rounded-[1.7rem]">
          <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
            <p className="app-kicker">
              {isEnglish ? "Expense distribution" : "Distribuição das despesas"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Expenses by category" : "Despesas por categoria"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {isEnglish
                ? "Categories are ordered from highest to lowest expense."
                : "As categorias são ordenadas da maior para a menor despesa."}
            </p>
          </div>

          {categoryTotals.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-rose-300/[0.1] text-2xl text-rose-200">
                ◌
              </span>

              <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
                {isEnglish
                  ? "No expenses recorded"
                  : "Nenhuma despesa registrada"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "There are no expense transactions for the selected month."
                  : "Não há lançamentos de despesa no mês selecionado."}
              </p>

              <Link
                href={`/${locale}/transactions/new`}
                className="app-shine mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200"
              >
                <span className="mr-2 text-lg leading-none">+</span>
                {isEnglish ? "Create transaction" : "Criar lançamento"}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {categoryTotals.map((category) => (
                <li key={category.id ?? "uncategorized"} className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                          boxShadow: `0 0 16px ${category.color}18`,
                        }}
                      >
                        <CategoryIcon
                          name={category.icon}
                          size={20}
                          strokeWidth={1.9}
                        />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {category.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.035em] text-rose-300">
                      {formatCurrency(category.total, locale)}
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(category.percentage, 1)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="app-surface rounded-[1.7rem] p-5 sm:p-6">
          <p className="app-kicker">
            {isEnglish ? "Main insight" : "Principal insight"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "What stood out" : "O que se destacou"}
          </h2>

          {topCategory ? (
            <div className="mt-6">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${topCategory.color}20`,
                  color: topCategory.color,
                  boxShadow: `0 0 20px ${topCategory.color}20`,
                }}
              >
                <CategoryIcon
                  name={topCategory.icon}
                  size={26}
                  strokeWidth={1.9}
                />
              </span>

              <p className="mt-5 text-sm text-slate-400">
                {isEnglish
                  ? "Your highest expense category was"
                  : "Sua categoria com maior despesa foi"}
              </p>

              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-white">
                {topCategory.name}
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {isEnglish
                  ? `${topCategory.percentage.toFixed(
                      1,
                    )}% of all monthly expenses, totaling ${formatCurrency(
                      topCategory.total,
                      locale,
                    )}.`
                  : `${topCategory.percentage.toFixed(
                      1,
                    )}% de todas as despesas mensais, totalizando ${formatCurrency(
                      topCategory.total,
                      locale,
                    )}.`}
              </p>

              <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {isEnglish ? "Categories used" : "Categorias utilizadas"}
                </p>

                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-cyan-200">
                  {categoryTotals.length}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.025] p-5">
              <p className="text-sm font-medium text-slate-200">
                {isEnglish
                  ? "No insights available yet"
                  : "Nenhum insight disponível ainda"}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Record expense transactions to receive category insights."
                  : "Registre despesas para receber insights por categoria."}
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Next action" : "Próxima ação"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
              {isEnglish
                ? "Keep your financial data up to date"
                : "Mantenha seus dados financeiros atualizados"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isEnglish
                ? "The quality of your reports improves as income and expenses are recorded with correct categories."
                : "A qualidade dos relatórios melhora conforme receitas e despesas são registradas com categorias corretas."}
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