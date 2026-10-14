import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {NetWorthChart} from "@/components/financial-health/net-worth-chart";
import {ExpenseTrendChart} from "@/components/financial-health/expense-trend-chart";
import {CategoryExpensesChart} from "@/components/financial-health/category-expenses-chart";
import {RecurringCostsInsight} from "@/components/financial-health/recurring-costs-insight";
import {SpendingPaceInsight} from "@/components/financial-health/spending-pace-insight";
import {CashFlowForecast} from "@/components/financial-health/cash-flow-forecast";
import {SpendingFrequencyInsight} from "@/components/financial-health/spending-frequency-insight";
import {FinancialHealthPeriodFilter} from "@/components/financial-health/financial-health-period-filter";

export const metadata: Metadata = {
  title: "Saúde financeira",
  description:
    "Acompanhe os saldos das suas contas, evolução de despesas e comportamento financeiro.",
};

type PeriodValue = "3" | "6" | "12" | "all";

type FinancialHealthPageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{
    period?: string;
  }>;
};

type Account = {
  id: string;
  name: string;
  color: string | null;
  initial_balance: number | string | null;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
};

type Transaction = {
  id: string;
  description: string;
  amount: number | string;
  type: "income" | "expense" | "transfer";
  status: string | null;
  occurred_on: string;
  account_id: string | null;
  transfer_account_id: string | null;
  credit_card_id: string | null;
  credit_card_statement_id: string | null;
  payment_method: string | null;
  category_id: string | null;
  category: Category[] | Category | null;
};

type RecurringTransaction = {
  id: string;
  description: string;
  amount: number | string;
  type: "income" | "expense";
  frequency: "weekly" | "monthly" | "yearly";
  next_occurrence: string | null;
};

type Budget = {
  id: string;
  amount: number | string;
};

type CreditCardStatement = {
  id: string;
  credit_card_id: string;
  total_amount: number | string;
  paid_amount: number | string;
  status: "open" | "closed" | "overdue" | "paid";
};

type AccountBalancePoint = {
  label: string;
  value: number;
  isCurrent?: boolean;
};

type ExpenseTrendPoint = {
  label: string;
  value: number;
  isCurrent?: boolean;
};

type CategoryExpense = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  amount: number;
  percentage: number;
};

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function getMonthShortLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    month: "short",
  })
    .format(date)
    .replace(".", "")
    .slice(0, 3);
}

function getLastMonths(count: number, locale: string, now: Date) {
  return Array.from({length: count}, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (count - 1 - index),
      1,
    );

    return {
      key: getMonthKey(date),
      label: getMonthShortLabel(date, locale),
      start: toDateString(getMonthStart(date)),
      end: toDateString(getNextMonthStart(date)),
      isCurrent:
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth(),
    };
  });
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercentage(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value / 100);
}

function normalizeDescription(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function isCreditCardExpense(transaction: Transaction) {
  return (
    transaction.type === "expense" &&
    (
      Boolean(transaction.credit_card_id) ||
      transaction.payment_method === "credit_card" ||
      transaction.payment_method === "card"
    )
  );
}

/*
 * Saldo inicial + movimentações efetivadas antes da data de corte.
 * Compras no crédito não debitam a conta.
 * Pagamentos de fatura devem estar registrados como saída bancária.
 */
function calculateAccountBalanceAtDate(
  account: Account,
  transactions: Transaction[],
  endDateExclusive: string,
  historyStartDate: string,
) {
  if (historyStartDate >= endDateExclusive) {
    return 0;
  }

  return transactions.reduce((total, transaction) => {
    if (
      transaction.occurred_on >= endDateExclusive ||
      transaction.status === "pending" ||
      isCreditCardExpense(transaction)
    ) {
      return total;
    }

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
      let nextBalance = total;

      if (transaction.account_id === account.id) {
        nextBalance -= amount;
      }

      if (transaction.transfer_account_id === account.id) {
        nextBalance += amount;
      }

      return nextBalance;
    }

    return total;
  }, Number(account.initial_balance ?? 0));
}

/*
 * Mantido somente para a base da previsão de fluxo de caixa existente.
 * Não participa do indicador nem do histórico de saldo em contas.
 */
function calculateCurrentCreditCardDebt(
  statements: CreditCardStatement[],
) {
  return statements
    .filter((statement) =>
      ["open", "closed", "overdue"].includes(statement.status),
    )
    .reduce((total, statement) => {
      const totalAmount = Number(statement.total_amount ?? 0);
      const paidAmount = Number(statement.paid_amount ?? 0);

      return total + Math.max(totalAmount - paidAmount, 0);
    }, 0);
}

export default async function FinancialHealthPage({
  params,
  searchParams,
}: FinancialHealthPageProps) {
  const {locale: receivedLocale} = await params;
  const {period: requestedPeriod} = await searchParams;

  const locale = receivedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const selectedPeriod: PeriodValue =
    requestedPeriod === "3" ||
    requestedPeriod === "12" ||
    requestedPeriod === "all"
      ? requestedPeriod
      : "6";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const now = new Date();
  const todayText = toDateString(now);

  const tomorrowText = toDateString(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
  );

  const currentMonthStart = getMonthStart(now);
  const currentMonthEnd = getNextMonthStart(now);
  const currentMonthStartText = toDateString(currentMonthStart);
  const currentMonthEndText = toDateString(currentMonthEnd);

  const [
    {data: accountsData, error: accountsError},
    {data: transactionsData, error: transactionsError},
    {data: recurringData, error: recurringError},
    {data: budgetsData, error: budgetsError},
    {data: creditCardStatementsData, error: creditCardStatementsError},
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color, initial_balance, created_at")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("transactions")
      .select(`
        id,
        description,
        amount,
        type,
        status,
        occurred_on,
        account_id,
        transfer_account_id,
        credit_card_id,
        credit_card_statement_id,
        payment_method,
        category_id,
        category:categories!transactions_category_id_fkey (
          id,
          name,
          color,
          icon
        )
      `)
      .eq("user_id", user.id)
      .order("occurred_on", {ascending: true}),

    supabase
      .from("recurring_transactions")
      .select("id, description, amount, type, frequency, next_occurrence")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("next_occurrence", {ascending: true}),

    supabase
      .from("budgets")
      .select("id, amount")
      .eq("user_id", user.id)
      .eq("month", currentMonthStartText),

    supabase
      .from("credit_card_statements")
      .select(`
        id,
        credit_card_id,
        total_amount,
        paid_amount,
        status
      `)
      .eq("user_id", user.id)
      .in("status", ["open", "closed", "overdue"]),
  ]);

  const loadError =
    accountsError ??
    transactionsError ??
    recurringError ??
    budgetsError ??
    creditCardStatementsError;

  if (loadError) {
    console.error("Erro ao carregar saúde financeira:", loadError);

    throw new Error(
      isEnglish
        ? "Unable to load financial health data."
        : "Não foi possível carregar os dados de saúde financeira.",
    );
  }

  const accounts = (accountsData ?? []) as Account[];
  const transactions = (transactionsData ?? []) as unknown as Transaction[];
  const budgets = (budgetsData ?? []) as Budget[];
  const creditCardStatements =
    (creditCardStatementsData ?? []) as CreditCardStatement[];

  /*
   * Sem uma data própria para o saldo inicial, o início do histórico
   * é aproximado pela criação da conta ou primeira movimentação retroativa.
   */
  const accountHistoryStart = new Map<string, string>();

  for (const account of accounts) {
    let startDate = account.created_at.slice(0, 10);

    for (const transaction of transactions) {
      const belongsToAccount =
        transaction.account_id === account.id ||
        transaction.transfer_account_id === account.id;

      if (
        belongsToAccount &&
        !isCreditCardExpense(transaction) &&
        transaction.status !== "pending" &&
        transaction.occurred_on < startDate
      ) {
        startDate = transaction.occurred_on;
      }
    }

    accountHistoryStart.set(account.id, startDate);
  }

  const availableHistoryDates = [
    ...accountHistoryStart.values(),
    ...transactions
      .filter((transaction) => transaction.occurred_on <= todayText)
      .map((transaction) => transaction.occurred_on),
  ]
    .filter((date) => date <= todayText)
    .sort();

  const earliestHistoryDate = availableHistoryDates[0] ?? todayText;

  const allTimeMonthCount = Math.max(
    (now.getFullYear() - Number(earliestHistoryDate.slice(0, 4))) * 12 +
      now.getMonth() -
      (Number(earliestHistoryDate.slice(5, 7)) - 1) +
      1,
    1,
  );

  const visibleMonthCount =
    selectedPeriod === "all"
      ? allTimeMonthCount
      : Number(selectedPeriod);

  const months = getLastMonths(visibleMonthCount, locale, now);

  const periodLabel =
    selectedPeriod === "all"
      ? isEnglish
        ? "All available history"
        : "Todo o histórico disponível"
      : isEnglish
        ? `Last ${visibleMonthCount} months`
        : `Últimos ${visibleMonthCount} meses`;

  const recurringCosts = (recurringData ?? []).map((item) => {
    const recurring = item as RecurringTransaction;

    return {
      id: recurring.id,
      description: recurring.description,
      amount: Number(recurring.amount),
      type: recurring.type,
      frequency: recurring.frequency,
      nextOccurrence: recurring.next_occurrence,
    };
  });

  function getAccountsBalanceAtDate(endDateExclusive: string) {
    return accounts.reduce(
      (total, account) =>
        total +
        calculateAccountBalanceAtDate(
          account,
          transactions,
          endDateExclusive,
          accountHistoryStart.get(account.id) ?? todayText,
        ),
      0,
    );
  }

  /*
   * Indicador principal: somente a soma dos saldos das contas até hoje.
   * Não inclui investimentos externos nem desconta faturas.
   */
  const currentAccountBalance = getAccountsBalanceAtDate(tomorrowText);

  const previousAccountBalance =
    getAccountsBalanceAtDate(currentMonthStartText);

  const accountBalanceChange =
    currentAccountBalance - previousAccountBalance;

  const accountBalanceChangePercentage =
    previousAccountBalance !== 0
      ? (accountBalanceChange / Math.abs(previousAccountBalance)) * 100
      : 0;

  const hasPreviousAccountHistory = Array.from(
    accountHistoryStart.values(),
  ).some((date) => date < currentMonthStartText);

  /*
   * Histórico de saldo em contas.
   * O último ponto e o indicador principal usam o mesmo cálculo.
   */
  const accountBalanceHistory: AccountBalancePoint[] =
    accounts.length === 0
      ? []
      : months
          .filter(
            (month) => month.key >= earliestHistoryDate.slice(0, 7),
          )
          .map((month) => ({
            label: month.label,
            value: getAccountsBalanceAtDate(
              month.isCurrent ? tomorrowText : month.end,
            ),
            isCurrent: month.isCurrent,
          }));

  /*
   * Base anterior da previsão preservada.
   * Esta variável não é utilizada no indicador de saldo em contas.
   */
  const totalCreditCardDebt = calculateCurrentCreditCardDebt(
    creditCardStatements,
  );

  const forecastBaseBalance =
    currentAccountBalance - totalCreditCardDebt;

  const expenseTrend: ExpenseTrendPoint[] = months.map((month) => ({
    label: month.label,
    value: transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.occurred_on >= month.start &&
          transaction.occurred_on < month.end,
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0),
    isCurrent: month.isCurrent,
  }));

  const expenseAverage =
    expenseTrend.length > 0
      ? expenseTrend.reduce((total, month) => total + month.value, 0) /
        expenseTrend.length
      : 0;

  const totalBudget = budgets.reduce(
    (total, budget) => total + Number(budget.amount),
    0,
  );

  const spendingReference =
    totalBudget > 0 ? totalBudget : expenseAverage;

  const usingBudget = totalBudget > 0;
  const dayOfMonth = now.getDate();

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const currentMonthTransactions = transactions.filter(
    (transaction) =>
      transaction.occurred_on >= currentMonthStartText &&
      transaction.occurred_on < currentMonthEndText,
  );

  const currentIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const currentExpenses = currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const currentMonthResult = currentIncome - currentExpenses;

  const savingsRate =
    currentIncome > 0
      ? Math.max((currentMonthResult / currentIncome) * 100, 0)
      : 0;

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

  currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      const category = getFirstRelation(transaction.category);
      const categoryId = category?.id ?? "uncategorized";

      const item = categoryMap.get(categoryId) ?? {
        id: categoryId,
        name: category?.name ?? (isEnglish ? "No category" : "Sem categoria"),
        color: category?.color ?? "#fb7185",
        icon: category?.icon ?? null,
        amount: 0,
      };

      item.amount += Number(transaction.amount);
      categoryMap.set(categoryId, item);
    });

  const categoryExpenses: CategoryExpense[] = Array.from(categoryMap.values())
    .sort((first, second) => second.amount - first.amount)
    .map((category) => ({
      ...category,
      percentage:
        currentExpenses > 0
          ? (category.amount / currentExpenses) * 100
          : 0,
    }));

  const spendingPatternMap = new Map<
    string,
    {
      id: string;
      label: string;
      count: number;
      total: number;
      categoryName: string | null;
    }
  >();

  currentMonthTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.description.trim().length > 0,
    )
    .forEach((transaction) => {
      const normalizedDescription = normalizeDescription(
        transaction.description,
      );

      const category = getFirstRelation(transaction.category);

      const existing = spendingPatternMap.get(normalizedDescription) ?? {
        id: normalizedDescription,
        label: transaction.description.trim(),
        count: 0,
        total: 0,
        categoryName: category?.name ?? null,
      };

      existing.count += 1;
      existing.total += Number(transaction.amount);
      spendingPatternMap.set(normalizedDescription, existing);
    });

  const spendingPatterns = Array.from(spendingPatternMap.values())
    .map((pattern) => ({
      ...pattern,
      averageTicket:
        pattern.count > 0 ? pattern.total / pattern.count : 0,
    }))
    .sort((first, second) => {
      if (second.total !== first.total) {
        return second.total - first.total;
      }

      return second.count - first.count;
    });

  const biggestCategory = categoryExpenses[0] ?? null;

  const currentExpenseDifference =
    currentExpenses - expenseAverage;

  const currentExpenseDifferencePercentage =
    expenseAverage > 0
      ? (currentExpenseDifference / expenseAverage) * 100
      : 0;

  const financialDiagnosis =
    currentIncome <= 0
      ? isEnglish
        ? "Add your income transactions to calculate a complete financial diagnosis."
        : "Adicione suas receitas para calcular um diagnóstico financeiro completo."
      : currentMonthResult < 0
        ? isEnglish
          ? `You spent ${formatCurrency(
              Math.abs(currentMonthResult),
              locale,
            )} more than you earned this month.`
          : `Você gastou ${formatCurrency(
              Math.abs(currentMonthResult),
              locale,
            )} a mais do que recebeu neste mês.`
        : currentExpenseDifference > 0 && biggestCategory
          ? isEnglish
            ? `Your expenses are ${formatPercentage(
                currentExpenseDifferencePercentage,
                locale,
              )} above your recent average. ${biggestCategory.name} is your largest category this month.`
            : `Suas despesas estão ${formatPercentage(
                currentExpenseDifferencePercentage,
                locale,
              )} acima da sua média recente. ${biggestCategory.name} é sua maior categoria neste mês.`
          : biggestCategory
            ? isEnglish
              ? `Your finances are on a positive track. ${biggestCategory.name} is your largest expense category this month.`
              : `Suas finanças estão em um caminho positivo. ${biggestCategory.name} é sua maior categoria de despesa neste mês.`
            : isEnglish
              ? "Your finances are on a positive track. Keep recording your transactions to unlock more insights."
              : "Suas finanças estão em um caminho positivo. Continue registrando seus lançamentos para liberar mais insights.";

  const forecastItems = recurringCosts
    .filter(
      (item) =>
        item.nextOccurrence &&
        item.nextOccurrence >= currentMonthStartText,
    )
    .sort((first, second) =>
      String(first.nextOccurrence).localeCompare(
        String(second.nextOccurrence),
      ),
    )
    .slice(0, 12);

  let projectedBalance = forecastBaseBalance;

  const cashFlowForecastItems = forecastItems.map((item) => {
    const amount = Number(item.amount);

    projectedBalance += item.type === "income" ? amount : -amount;

    return {
      id: item.id,
      description: item.description,
      amount,
      type: item.type,
      date: item.nextOccurrence as string,
      projectedBalance,
    };
  });

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/74 to-cyan-950/30 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 h-44 w-80 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Financial intelligence" : "Inteligência financeira"}
            </p>

            <h1 className="mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? "Understand the health of your money."
                : "Entenda a saúde do seu dinheiro."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "Track your account balances, spending patterns, and the decisions that shape your financial future."
                : "Acompanhe os saldos das suas contas, padrões de gasto e as decisões que moldam seu futuro financeiro."}
            </p>
          </div>

          <Link
            href={`/${locale}/transactions/new`}
            className="app-shine inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_16px_34px_rgba(16,185,129,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-200"
          >
            <span className="mr-2 text-lg">+</span>
            {isEnglish ? "New transaction" : "Novo lançamento"}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[1.7rem] border border-white/8 bg-white/2.5 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            {isEnglish ? "Analysis period" : "Período de análise"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {periodLabel}
          </p>
        </div>

        <FinancialHealthPeriodFilter
          locale={locale}
          value={selectedPeriod}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-400">
            {isEnglish ? "Total account balance" : "Saldo total em contas"}
          </p>

          <p
            className={`mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em] ${
              currentAccountBalance >= 0
                ? "text-slate-100"
                : "text-rose-300"
            }`}
          >
            {formatCurrency(currentAccountBalance, locale)}
          </p>

          {hasPreviousAccountHistory ? (
            <>
              <p
                className={`mt-5 text-xs font-semibold ${
                  accountBalanceChange >= 0
                    ? "text-emerald-200"
                    : "text-rose-200"
                }`}
              >
                {accountBalanceChange >= 0 ? "+" : ""}
                {formatCurrency(accountBalanceChange, locale)}
                {previousAccountBalance !== 0
                  ? ` (${accountBalanceChange >= 0 ? "+" : ""}${accountBalanceChangePercentage.toFixed(1)}%)`
                  : ""}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isEnglish
                  ? "Compared with the previous month's closing balance."
                  : "Em comparação ao saldo de fechamento do mês anterior."}
              </p>
            </>
          ) : (
            <p className="mt-5 text-xs text-slate-500">
              {isEnglish
                ? "No previous account history available for comparison."
                : "Sem histórico anterior de contas para comparação."}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">
            {isEnglish
              ? "Sum of your account balances. Credit card statements are not deducted."
              : "Soma dos saldos das suas contas. Faturas de cartão não são descontadas."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-400">
            {isEnglish ? "Monthly result" : "Resultado do mês"}
          </p>

          <p
            className={`mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em] ${
              currentMonthResult >= 0
                ? "text-emerald-200"
                : "text-rose-300"
            }`}
          >
            {currentMonthResult >= 0 ? "+" : ""}
            {formatCurrency(currentMonthResult, locale)}
          </p>

          <p className="mt-5 text-xs text-slate-400">
            {isEnglish
              ? `${formatCurrency(currentIncome, locale)} in income and ${formatCurrency(currentExpenses, locale)} in expenses.`
              : `${formatCurrency(currentIncome, locale)} em receitas e ${formatCurrency(currentExpenses, locale)} em despesas.`}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-400">
            {isEnglish ? "Saving rate" : "Taxa de poupança"}
          </p>

          <p
            className={`mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em] ${
              savingsRate >= 20
                ? "text-emerald-200"
                : savingsRate > 0
                  ? "text-amber-200"
                  : "text-rose-300"
            }`}
          >
            {savingsRate.toFixed(0)}%
          </p>

          <p className="mt-5 text-xs text-slate-400">
            {currentIncome > 0
              ? isEnglish
                ? "Percentage of your monthly income that was preserved."
                : "Percentual da sua receita mensal que foi preservado."
              : isEnglish
                ? "Add income transactions to calculate this metric."
                : "Adicione receitas para calcular esta métrica."}
          </p>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <p className="text-sm font-medium text-slate-400">
            {isEnglish ? "Largest expense" : "Maior gasto"}
          </p>

          <p className="mt-3 truncate font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em] text-slate-100">
            {biggestCategory?.name ?? "—"}
          </p>

          <p className="mt-5 text-xs text-slate-400">
            {biggestCategory
              ? isEnglish
                ? `${formatCurrency(biggestCategory.amount, locale)} · ${biggestCategory.percentage.toFixed(1)}% of this month's expenses.`
                : `${formatCurrency(biggestCategory.amount, locale)} · ${biggestCategory.percentage.toFixed(1)}% das despesas deste mês.`
              : isEnglish
                ? "No categorized expenses this month."
                : "Não há despesas categorizadas neste mês."}
          </p>
        </article>
      </section>

      <section className="rounded-[1.7rem] border border-cyan-300/15 bg-linear-to-r from-cyan-300/9 via-slate-900/30 to-emerald-300/7 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-xl text-cyan-100">
            ✦
          </span>

          <div className="min-w-0 flex-1">
            <p className="app-kicker text-cyan-100/80">
              {isEnglish ? "Financial diagnosis" : "Diagnóstico financeiro"}
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
              {financialDiagnosis}
            </p>
          </div>

          <Link
            href={`/${locale}/alerts`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            {isEnglish ? "View alerts" : "Ver alertas"} →
          </Link>
        </div>
      </section>

      <div className="space-y-3">
        <NetWorthChart data={accountBalanceHistory} locale={locale} />

        <p className="px-1 text-xs leading-5 text-slate-500">
          {isEnglish
            ? "This history combines account balances, including opening balances. Credit card statements are not deducted. Previous months are reconstructed from recorded transactions and an estimated opening date; changes to opening balances affect the reconstruction."
            : "Este histórico soma os saldos das contas, incluindo os saldos iniciais. Faturas não são descontadas. Os meses anteriores são reconstruídos pelos lançamentos cadastrados e por uma data inicial estimada; alterações no saldo inicial afetam essa reconstrução."}
        </p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <ExpenseTrendChart
          data={expenseTrend}
          average={expenseAverage}
          locale={locale}
        />

        <CategoryExpensesChart
          data={categoryExpenses}
          total={currentExpenses}
          locale={locale}
        />
      </section>

      <RecurringCostsInsight data={recurringCosts} locale={locale} />

      <SpendingPaceInsight
        currentExpenses={currentExpenses}
        referenceAmount={spendingReference}
        dayOfMonth={dayOfMonth}
        daysInMonth={daysInMonth}
        usingBudget={usingBudget}
        locale={locale}
      />

      <SpendingFrequencyInsight data={spendingPatterns} locale={locale} />

      <CashFlowForecast
        currentBalance={forecastBaseBalance}
        items={cashFlowForecastItems}
        locale={locale}
      />

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Next improvement" : "Próxima melhoria"}
            </p>

            <h2 className="mt-2 font-(family-name:--font-display) text-xl font-semibold tracking-[-0.04em] text-white">
              {isEnglish
                ? "Build a clearer financial future"
                : "Construa um futuro financeiro mais claro"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Keep transactions categorized and recurring items updated. Your future insights will identify subscriptions, recurring commitments, spending pace, and projected cash flow."
                : "Mantenha lançamentos categorizados e recorrências atualizadas. Seus próximos insights identificarão assinaturas, compromissos fixos, ritmo de gasto e fluxo de caixa projetado."}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href={`/${locale}/categories`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/4.5 px-4 text-xs font-bold text-slate-300 transition hover:bg-white/9 hover:text-white"
            >
              {isEnglish ? "Manage categories" : "Gerenciar categorias"}
            </Link>

            <Link
              href={`/${locale}/recurring`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/15"
            >
              {isEnglish
                ? "Review recurring items"
                : "Revisar recorrências"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}