import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {TransactionActions} from "@/components/transactions/transaction-actions";
import {CategoryIcon} from "@/components/categories/category-icon";

export const metadata: Metadata = {
  title: "Lançamentos",
  description: "Lista de receitas e despesas.",
};

type TransactionsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    month?: string;
    type?: string;
    account?: string;
    category?: string;
  }>;
};

type TransactionType = "income" | "expense";

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

type Account = {
  id: string;
  name: string;
  color: string;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  occurred_on: string;
  category: Category | null;
  account: Account | null;
};

type TransactionFromDatabase = {
  id: string;
  description: string;
  amount: number | string;
  type: TransactionType;
  occurred_on: string;
  category: Category[] | Category | null;
  account: Account[] | Account | null;
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

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatMonth(month: string, locale: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  if (!year || !monthNumber) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
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
  const now = new Date();

  const year = Number(yearText ?? now.getFullYear());
  const month = Number(monthText ?? now.getMonth() + 1);

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

export default async function TransactionsPage({
  params,
  searchParams,
}: TransactionsPageProps) {
  const {locale: receivedLocale} = await params;
  const locale = receivedLocale === "en" ? "en" : "pt";

  const {
    month: requestedMonth,
    type: requestedType,
    account: requestedAccount,
    category: requestedCategory,
  } = await searchParams;

  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const selectedMonth = isValidMonth(requestedMonth)
    ? requestedMonth
    : getDefaultMonth();

  const selectedType: TransactionType | "all" =
    requestedType === "income" || requestedType === "expense"
      ? requestedType
      : "all";

  const selectedAccount = requestedAccount ?? "";
  const selectedCategory = requestedCategory ?? "";

  const exportSearchParams = new URLSearchParams({
    locale,
    month: selectedMonth,
  });

  if (selectedType !== "all") {
    exportSearchParams.set("type", selectedType);
  }

  if (selectedAccount) {
    exportSearchParams.set("account", selectedAccount);
  }

  if (selectedCategory) {
    exportSearchParams.set("category", selectedCategory);
  }

  const exportUrl = `/api/transactions/export?${exportSearchParams.toString()}`;

  const {start: monthStart, end: nextMonthStart} = getMonthRange(
    selectedMonth,
  );

  const [
    {data: accounts, error: accountsError},
    {data: categories, error: categoriesError},
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("categories")
      .select("id, name, color, icon")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),
  ]);

  if (accountsError) {
    console.error("Erro ao carregar contas para filtros:", accountsError);

    throw new Error("Não foi possível carregar as contas.");
  }

  if (categoriesError) {
    console.error(
      "Erro ao carregar categorias para filtros:",
      categoriesError,
    );

    throw new Error("Não foi possível carregar as categorias.");
  }

  let transactionsQuery = supabase
    .from("transactions")
    .select(`
      id,
      description,
      amount,
      type,
      occurred_on,
      category:categories!transactions_category_id_fkey (
        id,
        name,
        color,
        icon
      ),
      account:accounts!transactions_account_id_fkey (
        id,
        name,
        color
      )
    `)
    .eq("user_id", user.id)
    .neq("type", "transfer")
    .gte("occurred_on", monthStart)
    .lt("occurred_on", nextMonthStart)
    .order("occurred_on", {ascending: false})
    .order("created_at", {ascending: false});

  if (selectedType !== "all") {
    transactionsQuery = transactionsQuery.eq("type", selectedType);
  }

  if (selectedAccount) {
    transactionsQuery = transactionsQuery.eq("account_id", selectedAccount);
  }

  if (selectedCategory) {
    transactionsQuery = transactionsQuery.eq(
      "category_id",
      selectedCategory,
    );
  }

  const {data: transactions, error} = await transactionsQuery;

  if (error) {
    console.error("Erro detalhado ao carregar lançamentos:", error);

    throw new Error(
      `Não foi possível carregar os lançamentos: ${error.message}`,
    );
  }

  const typedAccounts = (accounts ?? []) as Account[];
  const typedCategories = (categories ?? []) as Category[];

  const typedTransactions: Transaction[] = (
    (transactions ?? []) as TransactionFromDatabase[]
  ).map((transaction) => ({
    id: transaction.id,
    description: transaction.description,
    amount: Number(transaction.amount),
    type: transaction.type,
    occurred_on: transaction.occurred_on,
    category: getFirstRelation(transaction.category),
    account: getFirstRelation(transaction.account),
  }));

  const totalIncome = typedTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalExpense = typedTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const netResult = totalIncome - totalExpense;
  const transactionCount = typedTransactions.length;

  const selectedTypeLabel =
    selectedType === "income"
      ? isEnglish
        ? "Income"
        : "Receitas"
      : selectedType === "expense"
        ? isEnglish
          ? "Expenses"
          : "Despesas"
        : isEnglish
          ? "All transactions"
          : "Todos os lançamentos";

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-cyan-950/25 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-40 w-80 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Financial activity" : "Atividade financeira"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? "Transactions, organized."
                : "Lançamentos, organizados."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? `Track your income and expenses for ${formatMonth(
                    selectedMonth,
                    locale,
                  )}.`
                : `Acompanhe suas receitas e despesas em ${formatMonth(
                    selectedMonth,
                    locale,
                  )}.`}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300">
                {transactionCount}{" "}
                {isEnglish
                  ? transactionCount === 1
                    ? "entry"
                    : "entries"
                  : transactionCount === 1
                    ? "lançamento"
                    : "lançamentos"}
              </span>

              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                {selectedTypeLabel}
              </span>
            </div>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 xl:max-w-xl">
            <a
              href={exportUrl}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.055] px-4 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white"
            >
              <span className="mr-2 text-base">↓</span>
              {isEnglish ? "Export CSV" : "Exportar CSV"}
            </a>

            <Link
              href={`/${locale}/transfers`}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 text-sm font-semibold text-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-300/16"
            >
              <span className="mr-2 text-base">⇄</span>
              {isEnglish ? "Transfers" : "Transferências"}
            </Link>

            <Link
              href={`/${locale}/transactions/new`}
              className="app-shine inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_15px_32px_rgba(16,185,129,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-200"
            >
              <span className="mr-2 text-lg leading-none">+</span>
              {isEnglish ? "New entry" : "Novo lançamento"}
            </Link>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Explore data" : "Explore seus dados"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white">
              {isEnglish ? "Filters" : "Filtros"}
            </h2>
          </div>

          {(requestedMonth ||
            requestedType ||
            requestedAccount ||
            requestedCategory) && (
            <Link
              href={`/${locale}/transactions`}
              className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
            >
              {isEnglish ? "Reset filters" : "Limpar filtros"} ×
            </Link>
          )}
        </div>

        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Month" : "Mês"}
            </span>

            <input
              type="month"
              name="month"
              defaultValue={selectedMonth}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Type" : "Tipo"}
            </span>

            <select
              name="type"
              defaultValue={selectedType}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10"
            >
              <option value="all">
                {isEnglish ? "All types" : "Todos os tipos"}
              </option>

              <option value="income">
                {isEnglish ? "Income" : "Receitas"}
              </option>

              <option value="expense">
                {isEnglish ? "Expenses" : "Despesas"}
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Account" : "Conta"}
            </span>

            <select
              name="account"
              defaultValue={selectedAccount}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10"
            >
              <option value="">
                {isEnglish ? "All accounts" : "Todas as contas"}
              </option>

              {typedAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Category" : "Categoria"}
            </span>

            <select
              name="category"
              defaultValue={selectedCategory}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10"
            >
              <option value="">
                {isEnglish ? "All categories" : "Todas as categorias"}
              </option>

              {typedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_22px_rgba(16,185,129,0.16)] transition hover:bg-emerald-200"
            >
              <span className="mr-1.5">⌕</span>
              {isEnglish ? "Apply" : "Aplicar"}
            </button>

            <Link
              href={`/${locale}/transactions`}
              aria-label={isEnglish ? "Clear filters" : "Limpar filtros"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-sm text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
            >
              ×
            </Link>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Income in period" : "Receitas no período"}
              </p>

              <p className="amount-positive mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em]">
                {formatCurrency(totalIncome, locale)}
              </p>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/12 text-xl text-emerald-300">
              ↗
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {isEnglish
              ? "Income recorded in the selected period."
              : "Receitas registradas no período selecionado."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Expenses in period" : "Despesas no período"}
              </p>

              <p className="amount-negative mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em]">
                {formatCurrency(totalExpense, locale)}
              </p>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-400/12 text-xl text-rose-300">
              ↘
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {isEnglish
              ? "Expenses recorded in the selected period."
              : "Despesas registradas no período selecionado."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Result in period" : "Resultado no período"}
              </p>

              <p
                className={`mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] ${
                  netResult >= 0 ? "text-emerald-200" : "text-rose-300"
                }`}
              >
                {netResult >= 0 ? "+" : ""}
                {formatCurrency(netResult, locale)}
              </p>
            </div>

            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${
                netResult >= 0
                  ? "bg-emerald-400/12 text-emerald-300"
                  : "bg-rose-400/12 text-rose-300"
              }`}
            >
              {netResult >= 0 ? "✦" : "!"}
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {netResult >= 0
              ? isEnglish
                ? "You earned more than you spent."
                : "Você recebeu mais do que gastou."
              : isEnglish
                ? "Expenses exceeded income in this period."
                : "As despesas ultrapassaram as receitas neste período."}
          </p>
        </article>
      </section>

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Detailed list" : "Lista detalhada"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Your entries" : "Seus lançamentos"}
            </h2>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_9px_rgba(110,231,183,0.85)]" />
            {transactionCount}{" "}
            {isEnglish
              ? transactionCount === 1
                ? "record"
                : "records"
              : transactionCount === 1
                ? "registro"
                : "registros"}
          </div>
        </div>

        {typedTransactions.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-2xl text-slate-400">
              ✦
            </span>

            <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
              {isEnglish
                ? "No transactions found"
                : "Nenhum lançamento encontrado"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Try changing the filters or create a new transaction to start tracking your financial activity."
                : "Tente alterar os filtros ou crie um novo lançamento para começar a acompanhar sua atividade financeira."}
            </p>

            <Link
              href={`/${locale}/transactions/new`}
              className="app-shine mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-200"
            >
              <span className="mr-2 text-lg leading-none">+</span>
              {isEnglish ? "New transaction" : "Novo lançamento"}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {typedTransactions.map((transaction) => {
              const isIncome = transaction.type === "income";

              const categoryColor =
                transaction.category?.color ??
                (isIncome ? "#6ee7b7" : "#fda4af");

              return (
                <article
                  key={transaction.id}
                  className="group flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105"
                      style={{
                        backgroundColor: `${categoryColor}1f`,
                        color: categoryColor,
                        boxShadow: `0 0 22px ${categoryColor}12`,
                      }}
                      title={
                        transaction.category?.name ??
                        (isEnglish ? "No category" : "Sem categoria")
                      }
                    >
                      {transaction.category?.icon ? (
                        <CategoryIcon
                          name={transaction.category.icon}
                          size={22}
                          strokeWidth={1.9}
                        />
                      ) : (
                        <span className="text-lg">
                          {isIncome ? "↗" : "↘"}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100 sm:text-base">
                        {transaction.description}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{backgroundColor: categoryColor}}
                          />

                          {transaction.category?.name ??
                            (isEnglish ? "No category" : "Sem categoria")}
                        </span>

                        <span
                          aria-hidden="true"
                          className="text-slate-600"
                        >
                          ·
                        </span>

                        <span>
                          {transaction.account?.name ??
                            (isEnglish ? "No account" : "Sem conta")}
                        </span>

                        <span
                          aria-hidden="true"
                          className="text-slate-600"
                        >
                          ·
                        </span>

                        <span>
                          {formatDate(transaction.occurred_on, locale)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                    <p
                      className={`font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.035em] ${
                        isIncome ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount, locale)}
                    </p>

                    <div className="opacity-100 transition-opacity lg:opacity-75 lg:group-hover:opacity-100">
                      <TransactionActions
                        locale={locale}
                        transactionId={transaction.id}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}