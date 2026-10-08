import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart"
import { CategorySpendingChart } from "@/components/dashboard/category-spending-chart"
import {
  SpendingSourceChart,
  type SpendingSource,
} from "@/components/dashboard/spending-source-chart"
import { CategoryIcon } from "@/components/categories/category-icon"
import { AlertsSummary } from "@/components/dashboard/alerts-summary"

type PageProps = {
  params: Promise<{
    locale: string
  }>
  searchParams: Promise<{
    from?: string
    to?: string
  }>
}

type Account = {
  id: string
  name: string
  color: string | null
}

type Category = {
  id: string
  name: string
  color: string | null
  icon: string | null
}

type CreditCardSource = {
  id: string
  name: string
  institution: string | null
  brand: string | null
  last_four: string | null
}

type RecentTransaction = {
  id: string
  description: string
  amount: number | string
  type: "income" | "expense"
  occurred_on: string
  account: Account[] | Account | null
  category: Category[] | Category | null
}

type RecurringTransaction = {
  id: string
  description: string
  amount: number | string
  type: "income" | "expense"
  next_occurrence: string | null
}

type AccountBalance = Account & {
  balance: number
  share: number
}

type CashFlowItem = {
  occurred_on: string
  amount: number | string
  type: "income" | "expense"
}

type CategoryExpenseItem = {
  amount: number | string
  category: Category[] | Category | null
}

type SpendingSourceTransaction = {
  amount: number | string
  account: Account[] | Account | null
  credit_card: CreditCardSource[] | CreditCardSource | null
}

type CategorySpending = {
  id: string
  name: string
  color: string | null
  icon: string | null
  amount: number
  percentage: number
}

type CashFlowPoint = {
  label: string
  income: number
  expense: number
  result: number
}

type BudgetFromDatabase = {
  id: string
  amount: number | string
  category: Category[] | Category | null
}

type BudgetSummaryItem = {
  id: string
  amount: number
  spent: number
  percentage: number
  category: Category
}

type CreditCardStatement = {
  id: string
  credit_card_id: string
  total_amount: number | string
  paid_amount: number | string
  status: "open" | "closed" | "overdue" | "paid"
}

type CreditCardTransaction = {
  id: string
  amount: number | string
  credit_card_statement_id: string | null
}

function getFirstRelation<T>(
  relation: T[] | T | null | undefined,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function isValidDateString(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  return !Number.isNaN(new Date(`${value}T12:00:00`).getTime())
}

function getDefaultPeriod() {
  const now = new Date()

  return {
    from: toDateString(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

function getSelectedPeriod(
  fromValue: string | undefined,
  toValue: string | undefined,
) {
  const defaultPeriod = getDefaultPeriod()

  const from = isValidDateString(fromValue)
    ? fromValue!
    : defaultPeriod.from

  const to = isValidDateString(toValue) ? toValue! : defaultPeriod.to

  return from <= to ? { from, to } : { from: to, to: from }
}

function getExclusiveEndDate(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + 1)

  return toDateString(date)
}

function getPreviousMonthPeriod() {
  const now = new Date()

  return {
    from: toDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: toDateString(new Date(now.getFullYear(), now.getMonth(), 0)),
  }
}

function getLastThirtyDaysPeriod() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)

  return {
    from: toDateString(from),
    to: toDateString(to),
  }
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`))
}

function formatPeriodLabel(from: string, to: string, locale: string) {
  const formatter = new Intl.DateTimeFormat(
    locale === "en" ? "en-US" : "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  )

  return `${formatter.format(
    new Date(`${from}T12:00:00`),
  )} – ${formatter.format(new Date(`${to}T12:00:00`))}`
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`
}

function getMonthShortLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(
    locale === "en" ? "en-US" : "pt-BR",
    {
      month: "short",
    },
  )
    .format(date)
    .replace(".", "")
    .slice(0, 3)
}

function getMonthsInPeriod(from: string, to: string, locale: string) {
  const start = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)

  const firstMonth = new Date(start.getFullYear(), start.getMonth(), 1)
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  const months: Array<{
    key: string
    label: string
  }> = []

  let cursor = firstMonth

  while (cursor <= lastMonth) {
    months.push({
      key: getMonthKey(cursor),
      label: getMonthShortLabel(cursor, locale),
    })

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }

  return months
}

export default async function DashboardPage({
  params,
  searchParams,
}: PageProps) {
  const { locale: receivedLocale } = await params
  const query = await searchParams

  const locale = receivedLocale === "en" ? "en" : "pt"
  const isEnglish = locale === "en"

  const { from, to } = getSelectedPeriod(query.from, query.to)
  const periodEndExclusive = getExclusiveEndDate(to)
  const periodLabel = formatPeriodLabel(from, to, locale)

  const defaultPeriod = getDefaultPeriod()
  const previousMonthPeriod = getPreviousMonthPeriod()
  const lastThirtyDaysPeriod = getLastThirtyDaysPeriod()

  const budgetMonth = `${from.slice(0, 7)}-01`
  const periodCrossesMonths = from.slice(0, 7) !== to.slice(0, 7)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Erro ao carregar perfil do dashboard:", profileError)
  }

  if (!profile?.onboarding_completed) {
    redirect(`/${locale}/onboarding`)
  }

  const [
    { data: accounts, error: accountsError },
    { data: periodTransactions, error: periodTransactionsError },
    { data: allTransactions, error: allTransactionsError },
    { data: recentData, error: recentError },
    { data: recurringData, error: recurringError },
    { data: cashFlowData, error: cashFlowError },
    { data: categoryExpenseData, error: categoryExpenseError },
    { data: spendingSourceData, error: spendingSourceError },
    { data: budgetsData, error: budgetsError },
    { data: creditCardStatements, error: creditCardStatementsError },
    { data: creditCardTransactions, error: creditCardTransactionsError },
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name", { ascending: true }),

    supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", user.id)
      .neq("type", "transfer")
      .gte("occurred_on", from)
      .lt("occurred_on", periodEndExclusive),

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
      .gte("occurred_on", from)
      .lt("occurred_on", periodEndExclusive)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),

    supabase
      .from("recurring_transactions")
      .select("id, description, amount, type, next_occurrence")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("next_occurrence", { ascending: true })
      .limit(4),

    supabase
      .from("transactions")
      .select("occurred_on, amount, type")
      .eq("user_id", user.id)
      .neq("type", "transfer")
      .gte("occurred_on", from)
      .lt("occurred_on", periodEndExclusive),

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
      .gte("occurred_on", from)
      .lt("occurred_on", periodEndExclusive),

    supabase
      .from("transactions")
      .select(`
        amount,
        account:accounts!transactions_account_id_fkey (
          id,
          name,
          color
        ),
        credit_card:credit_cards!transactions_credit_card_id_fkey (
          id,
          name,
          institution,
          brand,
          last_four
        )
      `)
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("occurred_on", from)
      .lt("occurred_on", periodEndExclusive),

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
      .eq("month", budgetMonth),

    supabase
      .from("credit_card_statements")
      .select("id, credit_card_id, total_amount, paid_amount, status")
      .eq("user_id", user.id)
      .in("status", ["open", "closed", "overdue"]),

    supabase
      .from("transactions")
      .select("id, amount, credit_card_statement_id")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .eq("payment_method", "credit_card")
      .not("credit_card_id", "is", null),
  ])

  const loadError =
    accountsError ??
    periodTransactionsError ??
    allTransactionsError ??
    recentError ??
    recurringError ??
    cashFlowError ??
    categoryExpenseError ??
    spendingSourceError ??
    budgetsError ??
    creditCardStatementsError ??
    creditCardTransactionsError

  if (loadError) {
    console.error("Erro ao carregar dashboard:", {
      code: loadError.code,
      message: loadError.message,
      details: loadError.details,
      hint: loadError.hint,
    })
  }

  const typedAccounts = (accounts ?? []) as Account[]
  const typedCreditCardStatements =
    (creditCardStatements ?? []) as CreditCardStatement[]
  const typedCreditCardTransactions =
    (creditCardTransactions ?? []) as CreditCardTransaction[]

  const income = (periodTransactions ?? [])
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0)

  const expenses = (periodTransactions ?? [])
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0)

  const periodResult = income - expenses

  const accountBalances: AccountBalance[] = typedAccounts.map((account) => {
    const balance = (allTransactions ?? []).reduce(
      (total, transaction) => {
        const amount = Number(transaction.amount)

        if (transaction.type === "income") {
          return transaction.account_id === account.id
            ? total + amount
            : total
        }

        if (transaction.type === "expense") {
          return transaction.account_id === account.id
            ? total - amount
            : total
        }

        if (transaction.type === "transfer") {
          if (transaction.account_id === account.id) {
            return total - amount
          }

          if (transaction.transfer_account_id === account.id) {
            return total + amount
          }
        }

        return total
      },
      0,
    )

    return {
      ...account,
      balance,
      share: 0,
    }
  })

  const totalBalance = accountBalances.reduce(
    (total, account) => total + account.balance,
    0,
  )

  const statementDebt = typedCreditCardStatements.reduce(
    (total, statement) => {
      const statementTotal = Number(statement.total_amount ?? 0)
      const paidAmount = Number(statement.paid_amount ?? 0)

      return total + Math.max(statementTotal - paidAmount, 0)
    },
    0,
  )

  const unlinkedCreditCardDebt = typedCreditCardTransactions
    .filter((transaction) => !transaction.credit_card_statement_id)
    .reduce(
      (total, transaction) => total + Number(transaction.amount),
      0,
    )

  const totalCreditCardDebt = statementDebt + unlinkedCreditCardDebt
  const netWorth = totalBalance - totalCreditCardDebt

  const accountBalancesWithShare = accountBalances.map((account) => ({
    ...account,
    share:
      totalBalance > 0
        ? Math.max((account.balance / totalBalance) * 100, 0)
        : 0,
  }))

  const shouldShowDailyCashFlow = !periodCrossesMonths

  const getDaysInPeriod = () => {
    const start = new Date(`${from}T12:00:00`)
    const end = new Date(`${to}T12:00:00`)

    const days: Array<{
      key: string
      label: string
    }> = []

    let cursor = new Date(start)

    while (cursor <= end) {
      const key = toDateString(cursor)

      days.push({
        key,
        label: String(cursor.getDate()),
      })

      cursor.setDate(cursor.getDate() + 1)
    }

    return days
  }

  const shouldGroupCashFlowByWeek = !periodCrossesMonths

  const getWeekBucketsInPeriod = () => {
    const start = new Date(`${from}T12:00:00`)
    const end = new Date(`${to}T12:00:00`)

    const buckets: Array<{
      key: string
      label: string
      from: string
      to: string
    }> = []

    let weekIndex = 1
    let cursor = new Date(start)

    while (cursor <= end) {
      const bucketStart = new Date(cursor)
      const bucketEnd = new Date(cursor)

      bucketEnd.setDate(bucketEnd.getDate() + 6)

      if (bucketEnd > end) {
        bucketEnd.setTime(end.getTime())
      }

      buckets.push({
        key: `week-${weekIndex}`,
        label: isEnglish ? `W${weekIndex}` : `Sem. ${weekIndex}`,
        from: toDateString(bucketStart),
        to: toDateString(bucketEnd),
      })

      cursor = new Date(bucketEnd)
      cursor.setDate(cursor.getDate() + 1)
      weekIndex += 1
    }

    return buckets
  }

  const cashFlowBuckets = shouldGroupCashFlowByWeek
    ? getWeekBucketsInPeriod()
    : getMonthsInPeriod(from, to, locale).map((month) => ({
        key: month.key,
        label: month.label,
        from: `${month.key}-01`,
        to: `${month.key}-31`,
      }))

  const cashFlowMap = new Map<
    string,
    {
      income: number
      expense: number
    }
  >()

  cashFlowBuckets.forEach((bucket) => {
    cashFlowMap.set(bucket.key, {
      income: 0,
      expense: 0,
    })
  })

  ;((cashFlowData ?? []) as CashFlowItem[]).forEach((transaction) => {
    const bucket = cashFlowBuckets.find(
      (item) =>
        transaction.occurred_on >= item.from &&
        transaction.occurred_on <= item.to,
    )

    if (!bucket) {
      return
    }

    const values = cashFlowMap.get(bucket.key)

    if (!values) {
      return
    }

    if (transaction.type === "income") {
      values.income += Number(transaction.amount)
    }

    if (transaction.type === "expense") {
      values.expense += Number(transaction.amount)
    }
  })

  const cashFlowPoints: CashFlowPoint[] = cashFlowBuckets.map((bucket) => {
    const values = cashFlowMap.get(bucket.key) ?? {
      income: 0,
      expense: 0,
    }

    return {
      label: bucket.label,
      income: values.income,
      expense: values.expense,
      result: values.income - values.expense,
    }
  })

  const categoryMap = new Map<
    string,
    {
      id: string
      name: string
      color: string | null
      icon: string | null
      amount: number
    }
  >()

  ;((categoryExpenseData ?? []) as unknown as CategoryExpenseItem[]).forEach(
    (transaction) => {
      const category = getFirstRelation(transaction.category)
      const categoryId = category?.id ?? "uncategorized"

      const existing = categoryMap.get(categoryId) ?? {
        id: categoryId,
        name: category?.name ?? (isEnglish ? "No category" : "Sem categoria"),
        color: category?.color ?? "#fb7185",
        icon: category?.icon ?? null,
        amount: 0,
      }

      existing.amount += Number(transaction.amount)
      categoryMap.set(categoryId, existing)
    },
  )

  const categorySpending: CategorySpending[] = Array.from(categoryMap.values())
    .sort((first, second) => second.amount - first.amount)
    .slice(0, 5)
    .map((category) => ({
      ...category,
      percentage:
        expenses > 0 ? Math.min((category.amount / expenses) * 100, 100) : 0,
    }))

  const spendingSourceMap = new Map<
    string,
    Omit<SpendingSource, "percentage">
  >()

  ;((spendingSourceData ?? []) as unknown as SpendingSourceTransaction[]).forEach(
    (transaction) => {
      const account = getFirstRelation(transaction.account)
      const creditCard = getFirstRelation(transaction.credit_card)
      const amount = Number(transaction.amount)

      if (creditCard) {
        const sourceId = `credit-card-${creditCard.id}`

        const cardDetails = [
          creditCard.institution,
          creditCard.brand,
          creditCard.last_four ? `•••• ${creditCard.last_four}` : null,
        ]
          .filter(Boolean)
          .join(" · ")

        const existing = spendingSourceMap.get(sourceId) ?? {
          id: sourceId,
          name: cardDetails
            ? `${creditCard.name} — ${cardDetails}`
            : creditCard.name,
          kind: "credit_card" as const,
          color: "#fbbf24",
          amount: 0,
        }

        existing.amount += amount
        spendingSourceMap.set(sourceId, existing)
        return
      }

      if (account) {
        const sourceId = `account-${account.id}`

        const existing = spendingSourceMap.get(sourceId) ?? {
          id: sourceId,
          name: account.name,
          kind: "account" as const,
          color: account.color ?? "#60a5fa",
          amount: 0,
        }

        existing.amount += amount
        spendingSourceMap.set(sourceId, existing)
        return
      }

      const existing = spendingSourceMap.get("other") ?? {
        id: "other",
        name: isEnglish ? "No source informed" : "Sem origem informada",
        kind: "other" as const,
        color: "#94a3b8",
        amount: 0,
      }

      existing.amount += amount
      spendingSourceMap.set("other", existing)
    },
  )

  const spendingSources: SpendingSource[] = Array.from(
    spendingSourceMap.values(),
  )
    .sort((first, second) => second.amount - first.amount)
    .map((source) => ({
      ...source,
      percentage: expenses > 0 ? (source.amount / expenses) * 100 : 0,
    }))

  const spentByCategory = new Map<string, number>()

  categoryMap.forEach((category) => {
    spentByCategory.set(category.id, category.amount)
  })

  const budgetSummaryItems: BudgetSummaryItem[] = (
    (budgetsData ?? []) as unknown as BudgetFromDatabase[]
  )
    .map((budget) => {
      const category = getFirstRelation(budget.category)

      if (!category) {
        return null
      }

      const amount = Number(budget.amount)
      const spent = spentByCategory.get(category.id) ?? 0

      return {
        id: budget.id,
        amount,
        spent,
        percentage: amount > 0 ? (spent / amount) * 100 : 0,
        category,
      }
    })
    .filter((budget): budget is BudgetSummaryItem => budget !== null)
    .sort((first, second) => second.percentage - first.percentage)

  const totalBudget = budgetSummaryItems.reduce(
    (total, budget) => total + budget.amount,
    0,
  )

  const totalBudgetSpent = budgetSummaryItems.reduce(
    (total, budget) => total + budget.spent,
    0,
  )
    const totalBudgetRemaining = totalBudget - totalBudgetSpent

  const budgetUsagePercentage =
    totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0

  const visibleBudgetUsage = Math.min(budgetUsagePercentage, 100)

  const overBudgetCount = budgetSummaryItems.filter(
    (budget) => budget.percentage >= 100,
  ).length

  const warningBudgetCount = budgetSummaryItems.filter(
    (budget) => budget.percentage >= 75 && budget.percentage < 100,
  ).length

  const typedRecent = (recentData ?? []) as unknown as RecentTransaction[]
  const typedRecurring = (recurringData ?? []) as RecurringTransaction[]

  const biggestExpense =
    expenses > 0 ? Math.min((expenses / Math.max(income, 1)) * 100, 100) : 0

  const savingsRate =
    income > 0 ? Math.max((periodResult / income) * 100, 0) : 0

  const balanceStatus =
    periodResult >= 0
      ? isEnglish
        ? "Positive period"
        : "Período positivo"
      : isEnglish
        ? "Attention needed"
        : "Atenção necessária"

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
          }

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
              : "Alguns orçamentos estão perto dos limites",
            description: isEnglish
              ? "Keep an eye on your spending."
              : "Fique atento aos seus gastos.",
            href: `/${locale}/budgets`,
            iconName: "wallet",
            color: "#fcd34d",
          },
        ]
      : []),
    ...(totalCreditCardDebt > 0
      ? [
          {
            id: "credit-card-debt",
            level: "warning" as const,
            title: isEnglish
              ? "Credit card bills are open"
              : "Existem faturas de cartão em aberto",
            description: isEnglish
              ? `You currently owe ${formatCurrency(totalCreditCardDebt, locale)} on credit cards.`
              : `Você possui ${formatCurrency(totalCreditCardDebt, locale)} em faturas de cartão pendentes.`,
            href: `/${locale}/cards`,
            iconName: "wallet",
            color: "#fcd34d",
          },
        ]
      : []),
    ...(netWorth < 0
      ? [
          {
            id: "net-worth-alert",
            level: "danger" as const,
            title: isEnglish
              ? "Your net worth is negative"
              : "Seu patrimônio líquido está negativo",
            description: isEnglish
              ? "Your debts are greater than the money tracked in your accounts."
              : "Suas dívidas são maiores que o dinheiro registrado nas suas contas.",
            href: `/${locale}/cards`,
            iconName: "wallet",
            color: "#fda4af",
          },
        ]
      : []),
  ]

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-900/72 to-emerald-950/30 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
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

            <h1 className="mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish ? "Your money, clear." : "Seu dinheiro, claro."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? `A precise view of your financial position and transactions from ${periodLabel}.`
                : `Uma visão precisa da sua posição financeira e movimentações de ${periodLabel}.`}
            </p>

            <div className="mt-7">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                {isEnglish ? "Net worth today" : "Patrimônio líquido atual"}
              </p>

              <p
                className={`mt-2 font-(family-name:--font-display) text-4xl font-semibold tracking-[-0.065em] sm:text-5xl lg:text-6xl ${
                  netWorth >= 0 ? "text-white" : "text-rose-300"
                }`}
              >
                {formatCurrency(netWorth, locale)}
              </p>

              <div
                className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  periodResult >= 0
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-rose-300/20 bg-rose-300/10 text-rose-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    periodResult >= 0
                      ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]"
                      : "bg-rose-300 shadow-[0_0_10px_rgba(253,164,175,0.9)]"
                  }`}
                />
                {balanceStatus}
              </div>

              <div className="mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/4.5 p-3.5">
                  <p className="text-xs font-medium uppercase tracking-[0.11em] text-slate-500">
                    {isEnglish
                      ? "Accounts balance today"
                      : "Saldo em contas atual"}
                  </p>
                  <p
                    className={`mt-1.5 text-lg font-semibold ${
                      totalBalance >= 0 ? "text-slate-100" : "text-rose-300"
                    }`}
                  >
                    {formatCurrency(totalBalance, locale)}
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-300/15 bg-rose-400/6 p-3.5">
                  <p className="text-xs font-medium uppercase tracking-[0.11em] text-rose-200/60">
                    {isEnglish
                      ? "Open card bills today"
                      : "Faturas em aberto atuais"}
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-rose-300">
                    -{formatCurrency(totalCreditCardDebt, locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-md">
            <Link
              className="app-shine group flex min-h-28 flex-col justify-between rounded-2xl border border-emerald-200/25 bg-emerald-300 px-5 py-4 text-emerald-950 shadow-[0_18px_38px_rgba(16,185,129,0.2)] transition hover:-translate-y-1 hover:bg-emerald-200"
              href={`/${locale}/transactions/new`}
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
              className="app-shine group flex min-h-28 flex-col justify-between rounded-2xl border border-white/12 bg-white/7 px-5 py-4 text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/11"
              href={`/${locale}/transfers/new`}
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

      <section className="sticky top-3 z-30 -mx-1 sm:-mx-2 lg:top-5">
        <form
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-[0_16px_45px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
          method="get"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect height="16" rx="3" width="17" x="3.5" y="5" />
                <path d="M8 3v4M16 3v4M3.5 10h17" strokeLinecap="round" />
              </svg>
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isEnglish ? "Selected period" : "Período selecionado"}
              </p>

              <p className="truncate text-sm font-semibold text-slate-100">
                {periodLabel}
              </p>
            </div>

            <div className="ml-0 flex flex-wrap items-center gap-1.5 sm:ml-2">
              <Link
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/7 hover:text-white"
                href={`/${locale}/dashboard?from=${defaultPeriod.from}&to=${defaultPeriod.to}`}
              >
                {isEnglish ? "This month" : "Este mês"}
              </Link>

              <Link
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/7 hover:text-white"
                href={`/${locale}/dashboard?from=${previousMonthPeriod.from}&to=${previousMonthPeriod.to}`}
              >
                {isEnglish ? "Previous" : "Anterior"}
              </Link>

              <Link
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/7 hover:text-white"
                href={`/${locale}/dashboard?from=${lastThirtyDaysPeriod.from}&to=${lastThirtyDaysPeriod.to}`}
              >
                {isEnglish ? "30 days" : "30 dias"}
              </Link>
            </div>
          </div>

          <details className="group relative shrink-0">
            <summary className="flex h-9 cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white">
              {isEnglish ? "Custom" : "Personalizar"}

              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
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
            </summary>

            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-white/10 bg-slate-950 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {isEnglish ? "From" : "De"}
                  </span>

                  <input
                    className="h-10 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none transition focus:border-emerald-400"
                    defaultValue={from}
                    name="from"
                    required
                    type="date"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {isEnglish ? "To" : "Até"}
                  </span>

                  <input
                    className="h-10 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white outline-none transition focus:border-emerald-400"
                    defaultValue={to}
                    name="to"
                    required
                    type="date"
                  />
                </label>
              </div>

              <button
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200"
                type="submit"
              >
                {isEnglish ? "Apply period" : "Aplicar período"}
              </button>
            </div>
          </details>
        </form>
      </section>

      {typedAccounts.length === 0 ? (
        <section className="relative overflow-hidden rounded-[1.7rem] border border-emerald-300/20 bg-linear-to-r from-emerald-300/12 via-emerald-300/6 to-cyan-400/8 p-5 shadow-[0_18px_44px_rgba(16,185,129,0.08)] sm:p-6">
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
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_24px_rgba(52,211,153,0.18)] transition hover:bg-emerald-200"
              href={`/${locale}/accounts/new`}
            >
              <span className="mr-2 text-lg leading-none">+</span>
              {isEnglish ? "Add account" : "Adicionar conta"}
            </Link>
          </div>
        </section>
      ) : typedRecent.length === 0 ? (
        <section className="relative overflow-hidden rounded-[1.7rem] border border-cyan-300/20 bg-linear-to-r from-cyan-300/10 via-sky-400/6 to-violet-400/8 p-5 shadow-[0_18px_44px_rgba(56,189,248,0.07)] sm:p-6">
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
                    ? "No transactions in this period"
                    : "Nenhum lançamento neste período"}
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-cyan-50/80">
                  {isEnglish
                    ? "Choose another period or add an income or expense to see it in your financial overview."
                    : "Escolha outro período ou adicione uma receita ou despesa para vê-la na sua visão financeira."}
                </p>
              </div>
            </div>
            <Link
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300 px-4 text-sm font-bold text-cyan-950 shadow-[0_10px_24px_rgba(56,189,248,0.18)] transition hover:bg-cyan-200"
              href={`/${locale}/transactions/new`}
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
                {isEnglish ? "Income in period" : "Receitas no período"}
              </p>
              <p className="amount-positive mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em]">
                {formatCurrency(income, locale)}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/12 text-xl text-emerald-300">
              ↗
            </span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/7">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-400 to-cyan-300"
              style={{ width: income > 0 ? "100%" : "0%" }}
            />
          </div>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Expenses in period" : "Despesas no período"}
              </p>
              <p className="amount-negative mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em]">
                {formatCurrency(expenses, locale)}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-400/12 text-xl text-rose-300">
              ↘
            </span>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/7">
            <div
              className="h-full rounded-full bg-linear-to-r from-rose-400 to-orange-300"
              style={{ width: `${biggestExpense}%` }}
            />
          </div>
        </article>

        <article className="app-surface app-surface-hover rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">
                {isEnglish ? "Period result" : "Resultado do período"}
              </p>
              <p
                className={`mt-3 font-(family-name:--font-display) text-3xl font-semibold tracking-[-0.055em] ${
                  periodResult >= 0 ? "text-emerald-200" : "text-rose-300"
                }`}
              >
                {periodResult >= 0 ? "+" : ""}
                {formatCurrency(periodResult, locale)}
              </p>
            </div>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${
                periodResult >= 0
                  ? "bg-emerald-400/12 text-emerald-300"
                  : "bg-rose-400/12 text-rose-300"
              }`}
            >
              {periodResult >= 0 ? "✦" : "!"}
            </span>
          </div>
          <p className="mt-5 text-xs text-slate-400">
            {income > 0
              ? isEnglish
                ? `${savingsRate.toFixed(0)}% of income was retained in this period.`
                : `${savingsRate.toFixed(0)}% da receita foi preservada neste período.`
              : isEnglish
                ? "Add income to see the saving rate for this period."
                : "Adicione receitas para visualizar a taxa de preservação neste período."}
          </p>
        </article>
      </section>

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Monthly planning" : "Planejamento mensal"}
            </p>
            <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Budget overview" : "Resumo de orçamentos"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {isEnglish
                ? "Budgets use the month of the selected start date."
                : "Os orçamentos utilizam o mês da data inicial selecionada."}
            </p>
            {periodCrossesMonths ? (
              <p className="mt-2 text-xs font-medium text-amber-200">
                {isEnglish
                  ? "This period crosses more than one month. Budget limits refer to the first month only."
                  : "Este período atravessa mais de um mês. Os limites de orçamento se referem apenas ao primeiro mês."}
              </p>
            ) : null}
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/4.5 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/9 hover:text-white"
            href={`/${locale}/budgets`}
          >
            {isEnglish ? "View budgets" : "Ver orçamentos"} →
          </Link>
        </div>

        {budgetSummaryItems.length === 0 ? (
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {isEnglish
                  ? "No budgets configured for the selected start month"
                  : "Nenhum orçamento configurado para o mês inicial selecionado"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Set spending limits by expense category to track your plan automatically."
                  : "Defina limites por categoria de despesa para acompanhar seu planejamento automaticamente."}
              </p>
            </div>
            <Link
              className="app-shine inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-amber-300 px-4 text-sm font-bold text-amber-950 shadow-[0_10px_24px_rgba(252,211,77,0.13)] transition hover:bg-amber-200"
              href={`/${locale}/budgets`}
            >
              {isEnglish ? "Create budget" : "Criar orçamento"}
            </Link>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {isEnglish ? "Planned" : "Planejado"}
                </p>
                <p className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-slate-100">
                  {formatCurrency(totalBudget, locale)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {isEnglish ? "Spent in period" : "Gasto no período"}
                </p>
                <p className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-rose-300">
                  {formatCurrency(totalBudgetSpent, locale)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {isEnglish ? "Available" : "Disponível"}
                </p>
                <p
                  className={`mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] ${
                    totalBudgetRemaining >= 0
                      ? "text-emerald-200"
                      : "text-rose-300"
                  }`}
                >
                  {formatCurrency(totalBudgetRemaining, locale)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/8 bg-slate-950/25 p-4">
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
                        )} utilizados de ${formatCurrency(totalBudget, locale)}`}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${budgetStatus.badge}`}
                >
                  {budgetUsagePercentage.toFixed(0)}%
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/7">
                <div
                  className={`h-full rounded-full transition-all ${budgetStatus.bar}`}
                  style={{ width: `${visibleBudgetUsage}%` }}
                />
              </div>

              <p className={`mt-3 text-xs font-semibold ${budgetStatus.text}`}>
                {budgetStatus.label}
              </p>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {budgetSummaryItems.slice(0, 3).map((budget) => {
                const visiblePercentage = Math.min(budget.percentage, 100)
                const barClass =
                  budget.percentage >= 100
                    ? "bg-rose-400"
                    : budget.percentage >= 75
                      ? "bg-amber-300"
                      : "bg-emerald-300"

                return (
                  <div
                    className="rounded-2xl border border-white/8 bg-white/2.5 p-3.5"
                    key={budget.id}
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

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/7">
                      <div
                        className={`h-full rounded-full ${barClass}`}
                        style={{ width: `${visiblePercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <AlertsSummary alerts={dashboardAlerts} locale={locale} />

      <CashFlowChart data={cashFlowPoints} locale={locale} />

      <section className="grid gap-5 xl:grid-cols-2">
        <CategorySpendingChart
          data={categorySpending}
          locale={locale}
          total={expenses}
        />

        <SpendingSourceChart
          data={spendingSources}
          locale={locale}
          total={expenses}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.22fr_0.78fr]">
        <article className="app-surface rounded-[1.7rem] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="app-kicker">
                {isEnglish ? "Accounts" : "Contas"}
              </p>
              <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
                {isEnglish ? "Where your money is" : "Onde está seu dinheiro"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {isEnglish
                  ? "Current balances, independent of the selected period."
                  : "Saldos atuais, independentes do período selecionado."}
              </p>
            </div>

            <Link
              className="rounded-xl border border-white/10 bg-white/4.5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/9 hover:text-white"
              href={`/${locale}/accounts`}
            >
              {isEnglish ? "Manage accounts" : "Gerenciar contas"} →
            </Link>
          </div>

          {accountBalancesWithShare.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/2.5 p-6 text-center">
              <p className="text-sm font-medium text-slate-200">
                {isEnglish ? "No accounts yet" : "Nenhuma conta ainda"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {isEnglish
                  ? "Create your first account to track your balance."
                  : "Crie sua primeira conta para acompanhar seus saldos."}
              </p>
              <Link
                className="mt-4 inline-flex rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-bold text-emerald-950"
                href={`/${locale}/accounts/new`}
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

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/6">
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
            <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Recurring items" : "Recorrências"}
            </h2>
          </div>

          {typedRecurring.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/12 bg-white/2.5 p-5">
              <p className="text-sm text-slate-300">
                {isEnglish
                  ? "No active recurring transactions."
                  : "Nenhuma recorrência ativa."}
              </p>
              <Link
                className="mt-3 inline-flex text-xs font-bold text-emerald-300 hover:text-emerald-200"
                href={`/${locale}/recurring`}
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
                const isIncome = item.type === "income"

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/3.5 p-3.5"
                    key={item.id}
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
                )
              })}
            </div>
          )}

          <Link
            className="mt-5 inline-flex text-xs font-bold text-slate-300 transition hover:text-white"
            href={`/${locale}/recurring`}
          >
            {isEnglish
              ? "See all recurring items"
              : "Ver todas as recorrências"}{" "}
            →
          </Link>
        </article>
      </section>

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Activity" : "Atividade"}
            </p>
            <h2 className="mt-2 font-(family-name:--font-display) text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish
                ? "Transactions in period"
                : "Lançamentos no período"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{periodLabel}</p>
          </div>

          <Link
            className="rounded-xl border border-white/10 bg-white/4.5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/9 hover:text-white"
            href={`/${locale}/transactions?from=${from}&to=${to}`}
          >
            {isEnglish ? "View all" : "Ver todos"} →
          </Link>
        </div>

        {typedRecent.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6 text-xl text-slate-400">
              ✦
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-200">
              {isEnglish
                ? "No activity in this period."
                : "Nenhuma atividade neste período."}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {isEnglish
                ? "Choose another date range or create a new transaction."
                : "Escolha outro intervalo de datas ou crie um novo lançamento."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/7">
            {typedRecent.map((transaction) => {
              const account = getFirstRelation(transaction.account)
              const category = getFirstRelation(transaction.category)
              const isIncome = transaction.type === "income"

              const accentColor =
                category?.color ?? (isIncome ? "#6ee7b7" : "#fda4af")

              return (
                <Link
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/2.5 sm:px-6"
                  href={`/${locale}/transactions/${transaction.id}/edit`}
                  key={transaction.id}
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
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}