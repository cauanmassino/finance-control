"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

type TransactionType = "income" | "expense" | "transfer"
type RecurringFrequency = "weekly" | "monthly" | "yearly"
type PaymentStatus = "paid" | "pending"

type PaymentMethod =
  | "account"
  | "transfer"
  | "credit_card"
  | "debit_card"
  | "pix"

type StatementRow = {
  id: string
  credit_card_id: string
  closing_date: string
  due_date: string
  status: "open" | "closed" | "paid" | "overdue"
  total_amount: number | string
  paid_amount: number | string
}

type CreditCardRow = {
  id: string
  closing_day: number
  due_day: number
  payment_account_id: string | null
}

function getText(formData: FormData, field: string) {
  const value = formData.get(field)

  return typeof value === "string" ? value.trim() : ""
}

function getLocale(value: string) {
  return value === "en" ? "en" : "pt"
}

function getValidAmount(value: string) {
  const rawValue = value.trim()

  if (!rawValue) {
    return null
  }

  let normalizedValue = rawValue.replace(/\s/g, "")

  const hasComma = normalizedValue.includes(",")
  const hasDot = normalizedValue.includes(".")

  if (hasComma && hasDot) {
    const lastComma = normalizedValue.lastIndexOf(",")
    const lastDot = normalizedValue.lastIndexOf(".")

    if (lastComma > lastDot) {
      normalizedValue = normalizedValue.replace(/\./g, "").replace(",", ".")
    } else {
      normalizedValue = normalizedValue.replace(/,/g, "")
    }
  } else if (hasComma) {
    normalizedValue = normalizedValue.replace(",", ".")
  }

  const amount = Number(normalizedValue)

  if (!Number.isFinite(amount) || amount <= 0) {
    return null
  }

  return Math.round(amount * 100) / 100
}

function isValidType(value: string): value is TransactionType {
  return value === "income" || value === "expense" || value === "transfer"
}

function isValidFrequency(value: string): value is RecurringFrequency {
  return value === "weekly" || value === "monthly" || value === "yearly"
}

function isValidPaymentStatus(value: string): value is PaymentStatus {
  return value === "paid" || value === "pending"
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsedDate = new Date(`${value}T12:00:00`)

  return !Number.isNaN(parsedDate.getTime())
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value)
}

function normalizePaymentMethod(value: string): PaymentMethod {
  if (value === "card" || value === "credit_card") {
    return "credit_card"
  }

  if (value === "pix") {
    return "pix"
  }

  if (value === "debit_card") {
    return "debit_card"
  }

  if (value === "transfer") {
    return "transfer"
  }

  return "account"
}

function normalizePaymentStatus(value: string): PaymentStatus {
  return isValidPaymentStatus(value) ? value : "paid"
}

function revalidateTransactionPaths(locale: string) {
  revalidatePath(`/${locale}`)
  revalidatePath(`/${locale}/dashboard`)
  revalidatePath(`/${locale}/transactions`)
  revalidatePath(`/${locale}/transactions/new`)
  revalidatePath(`/${locale}/reports`)
  revalidatePath(`/${locale}/recurring`)
  revalidatePath(`/${locale}/budgets`)
  revalidatePath(`/${locale}/accounts`)
  revalidatePath(`/${locale}/cards`)
}

async function getAccountBalance({
  supabase,
  userId,
  accountId,
  initialBalance,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  accountId: string
  initialBalance: number | string | null
}) {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      "amount, type, account_id, transfer_account_id, payment_method, credit_card_id, status",
    )
    .eq("user_id", userId)
    .or(`account_id.eq.${accountId},transfer_account_id.eq.${accountId}`)

  if (error) {
    throw error
  }

  return (transactions ?? []).reduce(
    (total, transaction) => {
      const transactionAmount = Number(transaction.amount)

      const isCreditCardExpense =
        transaction.type === "expense" &&
        (transaction.payment_method === "credit_card" ||
          Boolean(transaction.credit_card_id))

      /*
       * Compra no cartão pertence à fatura, não à conta bancária.
       *
       * Mesmo que haja registros antigos com account_id informado por engano,
       * o saldo bancário não será reduzido por esses lançamentos de cartão.
       */
      if (isCreditCardExpense) {
        return total
      }

      if (transaction.type === "income") {
        return transaction.account_id === accountId
          ? total + transactionAmount
          : total
      }

      if (transaction.type === "expense") {
        return transaction.account_id === accountId
          ? total - transactionAmount
          : total
      }

      if (transaction.type === "transfer") {
        if (transaction.account_id === accountId) {
          return total - transactionAmount
        }

        if (transaction.transfer_account_id === accountId) {
          return total + transactionAmount
        }
      }

      return total
    },
    Number(initialBalance ?? 0),
  )
}

function addMonths(year: number, month: number, months: number) {
  const date = new Date(Date.UTC(year, month - 1, 1))
  date.setUTCMonth(date.getUTCMonth() + months)

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  }
}

function getLastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function createDateString(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(
    2,
    "0",
  )}-${String(day).padStart(2, "0")}`
}

function addMonthsToDate(dateString: string, months: number) {
  const [year, month, day] = dateString.split("-").map(Number)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))

  const targetYear = target.getUTCFullYear()
  const targetMonth = target.getUTCMonth() + 1
  const targetDay = Math.min(day, getLastDayOfMonth(targetYear, targetMonth))

  return createDateString(targetYear, targetMonth, targetDay)
}

async function findOrCreateStatement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  card: Pick<CreditCardRow, "id" | "closing_day" | "due_day">,
  transactionDate: string,
) {
  const [yearValue, monthValue, dayValue] = transactionDate
    .split("-")
    .map(Number)

  const year = yearValue!
  const month = monthValue!
  const day = dayValue!

  let closingYear = year
  let closingMonth = month

  /*
   * Compra feita no próprio dia de fechamento entra na próxima fatura.
   *
   * Para incluir a compra no fechamento daquele mesmo dia,
   * troque "day >= card.closing_day" por "day > card.closing_day".
   */
  if (day >= card.closing_day) {
    const nextMonth = addMonths(closingYear, closingMonth, 1)
    closingYear = nextMonth.year
    closingMonth = nextMonth.month
  }

  const closingDay = Math.min(
    card.closing_day,
    getLastDayOfMonth(closingYear, closingMonth),
  )

  const closingDate = createDateString(closingYear, closingMonth, closingDay)

  const { data: existing, error: existingError } = await supabase
    .from("credit_card_statements")
    .select(
      "id, credit_card_id, closing_date, due_date, status, total_amount, paid_amount",
    )
    .eq("user_id", userId)
    .eq("credit_card_id", card.id)
    .eq("closing_date", closingDate)
    .in("status", ["open", "closed", "overdue"])
    .maybeSingle()

  if (existingError) {
    console.error("Erro ao procurar fatura:", existingError)
    throw new Error("Could not load the credit card statement.")
  }

  if (existing) {
    return existing as StatementRow
  }

  const dueMonth = addMonths(closingYear, closingMonth, 1)

  const dueDay = Math.min(
    card.due_day,
    getLastDayOfMonth(dueMonth.year, dueMonth.month),
  )

  const dueDate = createDateString(dueMonth.year, dueMonth.month, dueDay)

  const periodStartYear = closingMonth === 1 ? closingYear - 1 : closingYear
  const periodStartMonth = closingMonth === 1 ? 12 : closingMonth - 1

  const periodStart = createDateString(periodStartYear, periodStartMonth, 1)
  const periodEnd = closingDate

  const { data: inserted, error: insertError } = await supabase
    .from("credit_card_statements")
    .insert({
      user_id: userId,
      credit_card_id: card.id,
      period_start: periodStart,
      period_end: periodEnd,
      closing_date: closingDate,
      due_date: dueDate,
      status: "open",
      total_amount: 0,
      paid_amount: 0,
    })
    .select(
      "id, credit_card_id, closing_date, due_date, status, total_amount, paid_amount",
    )
    .single()

  if (insertError || !inserted) {
    console.error("Erro ao criar fatura:", insertError)
    throw new Error("Could not create the credit card statement.")
  }

  return inserted as StatementRow
}

export async function createTransaction(formData: FormData) {
  const locale = getLocale(getText(formData, "locale"))

  const description = getText(formData, "description")
  const amount = getValidAmount(getText(formData, "amount"))
  const type = getText(formData, "type")
  const occurredOn = getText(formData, "date")
  const categoryId = getText(formData, "category_id") || null
  const notes = getText(formData, "notes") || null

  const rawPaymentMethod = getText(formData, "payment_method")
  const rawPaymentStatus = getText(formData, "payment_status")
  const rawCreditCardId = getText(formData, "credit_card_id") || null

  /*
   * A presença de credit_card_id prevalece: qualquer despesa com cartão
   * é salva como compra de crédito, jamais como despesa da conta bancária.
   */
  const isCreditCardForm =
    type === "expense" && Boolean(rawCreditCardId)

  const paymentMethod: PaymentMethod = isCreditCardForm
    ? "credit_card"
    : normalizePaymentMethod(rawPaymentMethod)

  const creditCardId = isCreditCardForm ? rawCreditCardId : null

  /*
   * Apenas compras no cartão podem ser pendentes.
   * Os demais lançamentos sempre permanecem como pagos.
   */
  const paymentStatus: PaymentStatus =
    paymentMethod === "credit_card"
      ? normalizePaymentStatus(rawPaymentStatus)
      : "paid"

  /*
   * Uma compra de cartão nunca recebe account_id, mesmo que o navegador
   * envie algum valor antigo por campo oculto ou estado anterior.
   */
  const accountId =
    paymentMethod !== "credit_card"
      ? getText(formData, "account_id") || null
      : null

  const transferToAccountId =
    type === "transfer"
      ? getText(formData, "transfer_to_account_id") || null
      : null

  const isRecurring = formData.get("is_recurring") === "on"
  const frequency = getText(formData, "frequency") || null
  const endDate = getText(formData, "end_date") || null

  const isInstallment = formData.get("is_installment") === "on"

  const installments = isInstallment
    ? Number(formData.get("installments"))
    : null

  if (!description) {
    throw new Error(
      locale === "en" ? "Enter a description." : "Informe uma descrição.",
    )
  }

  if (description.length > 120) {
    throw new Error(
      locale === "en"
        ? "The description can have up to 120 characters."
        : "A descrição deve ter no máximo 120 caracteres.",
    )
  }

  if (!amount) {
    throw new Error(
      locale === "en"
        ? "Enter an amount greater than zero."
        : "Informe um valor maior que zero.",
    )
  }

  if (!isValidType(type)) {
    throw new Error(
      locale === "en"
        ? "Invalid transaction type."
        : "Tipo de transação inválido.",
    )
  }

  if (!isValidDate(occurredOn)) {
    throw new Error(
      locale === "en"
        ? "Enter a valid date."
        : "Informe uma data válida.",
    )
  }

  if (notes && notes.length > 500) {
    throw new Error(
      locale === "en"
        ? "The note can have up to 500 characters."
        : "A observação deve ter no máximo 500 caracteres.",
    )
  }

  if (
    type === "expense" &&
    (rawPaymentMethod === "card" || rawPaymentMethod === "credit_card") &&
    !creditCardId
  ) {
    throw new Error(
      locale === "en"
        ? "Choose a credit card."
        : "Selecione um cartão de crédito.",
    )
  }

  if (paymentMethod === "credit_card" && type !== "expense") {
    throw new Error(
      locale === "en"
        ? "Credit cards can only be used for expenses."
        : "Cartões de crédito só podem ser usados em despesas.",
    )
  }

  if (
    (type === "income" || type === "expense") &&
    paymentMethod !== "credit_card" &&
    !accountId
  ) {
    throw new Error(
      locale === "en" ? "Choose an account." : "Selecione uma conta.",
    )
  }

  if (type === "transfer") {
    if (!accountId || !transferToAccountId) {
      throw new Error(
        locale === "en"
          ? "Choose the source and destination accounts."
          : "Selecione a conta de origem e a conta de destino.",
      )
    }

    if (accountId === transferToAccountId) {
      throw new Error(
        locale === "en"
          ? "Source and destination accounts must be different."
          : "A conta de origem e a conta de destino devem ser diferentes.",
      )
    }
  }

  /*
   * Cartão pode ser recorrente, incluindo compras pendentes.
   * O único conflito permitido é recorrência + parcelamento.
   */
  if (isRecurring) {
    if (isInstallment) {
      throw new Error(
        locale === "en"
          ? "A transaction cannot be recurring and installment-based at the same time."
          : "Um lançamento não pode ser recorrente e parcelado ao mesmo tempo.",
      )
    }

    if (!frequency || !isValidFrequency(frequency)) {
      throw new Error(
        locale === "en"
          ? "Choose a valid recurring frequency."
          : "Escolha uma frequência válida para a recorrência.",
      )
    }

    if (endDate && !isValidDate(endDate)) {
      throw new Error(
        locale === "en"
          ? "Enter a valid end date."
          : "Informe uma data final válida.",
      )
    }

    if (endDate && endDate < occurredOn) {
      throw new Error(
        locale === "en"
          ? "The end date cannot be before the transaction date."
          : "A data final não pode ser anterior à data do lançamento.",
      )
    }
  }

  if (
    isInstallment &&
    (!installments ||
      !Number.isInteger(installments) ||
      installments < 2 ||
      installments > 48)
  ) {
    throw new Error(
      locale === "en"
        ? "Installments must be a whole number between 2 and 48."
        : "O número de parcelas deve ser um número inteiro entre 2 e 48.",
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  const isCreditCardPurchase =
    type === "expense" && Boolean(creditCardId)

  let selectedCard: CreditCardRow | null = null

  if (isCreditCardPurchase && creditCardId) {
    const { data: card, error: cardError } = await supabase
      .from("credit_cards")
      .select("id, closing_day, due_day, payment_account_id")
      .eq("id", creditCardId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    if (cardError || !card) {
      console.error("Erro ao buscar cartão:", cardError)

      throw new Error(
        locale === "en"
          ? "The selected credit card is invalid or inactive."
          : "O cartão de crédito selecionado é inválido ou está inativo.",
      )
    }

    selectedCard = card as CreditCardRow
  }

  let selectedAccount: {
    id: string
    name: string
    initial_balance: number | string | null
  } | null = null

  if (accountId) {
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("id, name, initial_balance")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (accountError || !account) {
      throw new Error(
        locale === "en"
          ? "The selected account is invalid."
          : "A conta selecionada não é válida.",
      )
    }

    selectedAccount = account
  }

  if (transferToAccountId) {
    const { data: destinationAccount, error: destinationError } =
      await supabase
        .from("accounts")
        .select("id")
        .eq("id", transferToAccountId)
        .eq("user_id", user.id)
        .maybeSingle()

    if (destinationError || !destinationAccount) {
      throw new Error(
        locale === "en"
          ? "The destination account is invalid."
          : "A conta de destino não é válida.",
      )
    }
  }

  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (categoryError || !category) {
      throw new Error(
        locale === "en"
          ? "The selected category is invalid."
          : "A categoria selecionada não é válida.",
      )
    }

    if (
      (type === "income" || type === "expense") &&
      category.type !== type
    ) {
      throw new Error(
        locale === "en"
          ? "Choose a category with the same type as the transaction."
          : "Escolha uma categoria do mesmo tipo da transação.",
      )
    }
  }

  /*
   * Não validamos saldo negativo para compras no cartão:
   * elas não reduzem a conta no instante da compra.
   */
  if (
    type === "expense" &&
    !isCreditCardPurchase &&
    selectedAccount
  ) {
    const currentBalance = await getAccountBalance({
      supabase,
      userId: user.id,
      accountId: selectedAccount.id,
      initialBalance: selectedAccount.initial_balance,
    })

    const projectedBalance = currentBalance - amount

    if (projectedBalance < 0) {
      throw new Error(
        locale === "en"
          ? `This expense will make the "${selectedAccount.name}" account negative. Current balance: ${formatCurrency(currentBalance, locale)}. Projected balance: ${formatCurrency(projectedBalance, locale)}.`
          : `Esta despesa deixará a conta "${selectedAccount.name}" negativa. Saldo atual: ${formatCurrency(currentBalance, locale)}. Saldo após o lançamento: ${formatCurrency(projectedBalance, locale)}.`,
      )
    }
  }

  if (type === "transfer" && selectedAccount) {
    const currentBalance = await getAccountBalance({
      supabase,
      userId: user.id,
      accountId: selectedAccount.id,
      initialBalance: selectedAccount.initial_balance,
    })

    const projectedBalance = currentBalance - amount

    if (projectedBalance < 0) {
      throw new Error(
        locale === "en"
          ? `This transfer will make the "${selectedAccount.name}" account negative. Current balance: ${formatCurrency(currentBalance, locale)}. Projected balance: ${formatCurrency(projectedBalance, locale)}.`
          : `Esta transferência deixará a conta "${selectedAccount.name}" negativa. Saldo atual: ${formatCurrency(currentBalance, locale)}. Saldo após a transferência: ${formatCurrency(projectedBalance, locale)}.`,
      )
    }
  }

  let recurringTransactionId: string | null = null

  if (isRecurring) {
    const recurringPayload: Record<string, unknown> = {
      user_id: user.id,
      description,
      amount,
      type,
      account_id: isCreditCardPurchase ? null : accountId,
      category_id: categoryId,
      credit_card_id: isCreditCardPurchase ? creditCardId : null,
      payment_method: paymentMethod,
      payment_status: isCreditCardPurchase ? paymentStatus : "paid",
      notes,
      frequency,
      start_date: occurredOn,
      next_occurrence: occurredOn,
      end_date: endDate,
      is_active: true,
    }

    const { data: recurringTransaction, error: recurringError } =
      await supabase
        .from("recurring_transactions")
        .insert(recurringPayload)
        .select("id")
        .single()

    if (recurringError || !recurringTransaction) {
      console.error("Erro ao criar recorrência:", recurringError)

      throw new Error(
        locale === "en"
          ? "Could not create the recurring item."
          : "Não foi possível criar a recorrência.",
      )
    }

    recurringTransactionId = recurringTransaction.id
  }

  const installmentCount =
    isInstallment && installments ? installments : 1

  const totalCents = Math.round(amount * 100)
  const baseInstallmentCents = Math.floor(totalCents / installmentCount)
  const remainderCents = totalCents % installmentCount

  const createdStatementIds = new Set<string>()

  for (let index = 0; index < installmentCount; index++) {
    const installmentDate = addMonthsToDate(occurredOn, index)

    const installmentCents =
      baseInstallmentCents + (index < remainderCents ? 1 : 0)

    const installmentAmount = installmentCents / 100

    let creditCardStatementId: string | null = null

    if (isCreditCardPurchase && selectedCard) {
      const statement = await findOrCreateStatement(
        supabase,
        user.id,
        selectedCard,
        installmentDate,
      )

      creditCardStatementId = statement.id
      createdStatementIds.add(statement.id)
    }

    const transactionPayload: Record<string, unknown> = {
      user_id: user.id,
      description:
        installmentCount > 1
          ? `${description} (${index + 1}/${installmentCount})`
          : description,
      amount: installmentAmount,
      type,
      occurred_on: installmentDate,
      account_id: isCreditCardPurchase ? null : accountId,
      category_id: type === "transfer" ? null : categoryId,
      payment_method:
        type === "transfer"
          ? "transfer"
          : isCreditCardPurchase
            ? "credit_card"
            : paymentMethod,
      status: isCreditCardPurchase ? paymentStatus : "paid",
      notes:
        installmentCount > 1
          ? notes
            ? `${notes} — Parcela ${index + 1}/${installmentCount}`
            : `Parcela ${index + 1}/${installmentCount}`
          : notes,
      recurring_transaction_id: recurringTransactionId,
    }

    if (type === "transfer" && transferToAccountId) {
      transactionPayload.transfer_account_id = transferToAccountId
    }

    if (isCreditCardPurchase && creditCardId) {
      transactionPayload.credit_card_id = creditCardId
    }

    if (creditCardStatementId) {
      transactionPayload.credit_card_statement_id = creditCardStatementId
    }

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionPayload)

    if (transactionError) {
      console.error("Erro detalhado ao criar transação:", {
        code: transactionError.code,
        message: transactionError.message,
        details: transactionError.details,
        hint: transactionError.hint,
      })

      throw new Error(
        locale === "en"
          ? "Could not create the transaction."
          : "Não foi possível criar o lançamento.",
      )
    }
  }

  for (const statementId of createdStatementIds) {
    const { error: statementTotalError } = await supabase.rpc(
      "update_statement_totals",
      {
        p_statement_id: statementId,
      },
    )

    if (statementTotalError) {
      console.error("Erro ao atualizar total da fatura:", {
        code: statementTotalError.code,
        message: statementTotalError.message,
        details: statementTotalError.details,
        hint: statementTotalError.hint,
      })

      throw new Error(
        locale === "en"
          ? "The transaction was created, but the statement total could not be updated."
          : "O lançamento foi criado, mas não foi possível atualizar o total da fatura.",
      )
    }
  }

  revalidateTransactionPaths(locale)

  redirect(`/${locale}/transactions`)
}