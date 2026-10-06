"use client"

import { useState } from "react"
import { createTransaction } from "@/app/[locale]/(app)/transactions/actions"

type CardOption = {
  id: string
  name: string
  institution: string | null
  brand: string | null
  last_four: string | null
}

type AccountOption = {
  id: string
  name: string
}

type CategoryOption = {
  id: string
  name: string
  type: "income" | "expense"
}

type TransactionFormProps = {
  locale: string
  cards: CardOption[]
  accounts: AccountOption[]
  categories: CategoryOption[]
}

type TransactionType = "income" | "expense" | "transfer"
type PaymentMethod = "account" | "card"
type PaymentStatus = "paid" | "pending"

const selectClassName =
  "app-input h-11 rounded-xl bg-slate-950 px-3.5 text-sm text-white outline-none focus:border-emerald-400 focus:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-45"

const optionClassName = "bg-slate-950 text-white"

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function CardIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect height="15" rx="2.5" width="21" x="1.5" y="4.5" />
      <path d="M2 10h20" strokeLinecap="round" />
      <path d="M6 15h3" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.3"
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TransactionForm({
  locale,
  cards,
  accounts,
  categories,
}: TransactionFormProps) {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense")

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("account")

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("paid")

  const [isRecurring, setIsRecurring] = useState(false)
  const [isInstallment, setIsInstallment] = useState(false)

  const isEnglish = locale === "en"

  const availableCategories =
    transactionType === "transfer"
      ? []
      : categories.filter((category) => category.type === transactionType)

  const isTransfer = transactionType === "transfer"
  const canUseCreditCard = transactionType === "expense"

  const isCreditCardPurchase =
    transactionType === "expense" && paymentMethod === "card"

  function handleTransactionTypeChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const nextType = event.target.value as TransactionType

    setTransactionType(nextType)

    if (nextType !== "expense") {
      setPaymentMethod("account")
      setPaymentStatus("paid")
      setIsInstallment(false)
    }
  }

  function handlePaymentMethodChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const nextMethod = event.target.value as PaymentMethod

    setPaymentMethod(nextMethod)

    if (nextMethod === "card") {
      setPaymentStatus("pending")
    } else {
      setPaymentStatus("paid")
    }
  }

  function handleRecurringChange(checked: boolean) {
    setIsRecurring(checked)

    if (checked) {
      setIsInstallment(false)
    }
  }

  function handleInstallmentChange(checked: boolean) {
    setIsInstallment(checked)

    if (checked) {
      setIsRecurring(false)
    }
  }

  return (
    <form action={createTransaction} className="space-y-6">
      <input name="locale" type="hidden" value={locale} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {isEnglish ? "Transaction details" : "Dados do lançamento"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Type" : "Tipo"}
            </span>

            <select
              className={selectClassName}
              name="type"
              onChange={handleTransactionTypeChange}
              value={transactionType}
            >
              <option className={optionClassName} value="expense">
                {isEnglish ? "Expense" : "Despesa"}
              </option>
              <option className={optionClassName} value="income">
                {isEnglish ? "Income" : "Receita"}
              </option>
              <option className={optionClassName} value="transfer">
                {isEnglish ? "Transfer" : "Transferência"}
              </option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Total amount" : "Valor total"}
            </span>

            <input
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/[0.05]"
              inputMode="decimal"
              min="0.01"
              name="amount"
              placeholder="0,00"
              required
              step="0.01"
              type="number"
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Description" : "Descrição"}
            </span>

            <input
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/[0.05]"
              maxLength={120}
              name="description"
              placeholder={
                isEnglish
                  ? "e.g. Groceries, salary, rent..."
                  : "Ex.: Supermercado, salário, aluguel..."
              }
              required
              type="text"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Category" : "Categoria"}
            </span>

            <select
              className={selectClassName}
              disabled={isTransfer}
              name="category_id"
            >
              <option className={optionClassName} value="">
                {isTransfer
                  ? isEnglish
                    ? "Transfers do not use categories"
                    : "Transferência não usa categoria"
                  : isEnglish
                    ? "No category"
                    : "Sem categoria"}
              </option>

              {availableCategories.map((category) => (
                <option
                  className={optionClassName}
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Date" : "Data"}
            </span>

            <input
              className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
              defaultValue={getToday()}
              name="date"
              required
              type="date"
            />
          </label>
        </div>
      </section>

      {!isTransfer ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {isEnglish ? "Payment method" : "Forma de pagamento"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                {isEnglish ? "Method" : "Método"}
              </span>

              <select
                className={selectClassName}
                disabled={!canUseCreditCard}
                name="payment_method"
                onChange={handlePaymentMethodChange}
                value={paymentMethod}
              >
                <option className={optionClassName} value="account">
                  {isEnglish ? "Bank account" : "Conta bancária"}
                </option>

                {canUseCreditCard ? (
                  <option className={optionClassName} value="card">
                    {isEnglish ? "Credit card" : "Cartão de crédito"}
                  </option>
                ) : null}
              </select>
            </label>

            {paymentMethod === "account" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-300">
                  {isEnglish ? "Account" : "Conta"}
                </span>

                <select
                  className={selectClassName}
                  name="account_id"
                  required
                >
                  <option className={optionClassName} value="">
                    {isEnglish ? "Select an account" : "Selecione a conta"}
                  </option>

                  {accounts.map((account) => (
                    <option
                      className={optionClassName}
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {isCreditCardPurchase ? (
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-slate-300">
                  {isEnglish ? "Credit card" : "Cartão de crédito"}
                </span>

                <select
                  className={selectClassName}
                  name="credit_card_id"
                  required
                >
                  <option className={optionClassName} value="">
                    {isEnglish ? "Select a credit card" : "Selecione o cartão"}
                  </option>

                  {cards.map((card) => {
                    const details = [
                      card.institution,
                      card.brand,
                      card.last_four ? `•••• ${card.last_four}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")

                    return (
                      <option
                        className={optionClassName}
                        key={card.id}
                        value={card.id}
                      >
                        {details ? `${card.name} — ${details}` : card.name}
                      </option>
                    )
                  })}
                </select>
              </label>
            ) : null}
          </div>

          {isCreditCardPurchase ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                  <CardIcon />
                </span>

                <div>
                  <p className="text-sm font-semibold text-amber-100">
                    {isEnglish
                      ? "Credit card purchase"
                      : "Compra no cartão de crédito"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-100/70">
                    {isEnglish
                      ? "This purchase is added to your credit card statement and does not reduce your bank account balance immediately."
                      : "Esta compra entra na fatura do cartão e não reduz o saldo da sua conta bancária imediatamente."}
                  </p>
                </div>
              </div>

              <input
                name="payment_status"
                type="hidden"
                value={paymentStatus}
              />

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    paymentStatus === "pending"
                      ? "border-amber-300/40 bg-amber-300/[0.1] text-amber-100"
                      : "border-white/[0.1] bg-white/[0.025] text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  <input
                    checked={paymentStatus === "pending"}
                    className="mt-0.5 accent-amber-300"
                    name="payment_status_option"
                    onChange={() => setPaymentStatus("pending")}
                    type="radio"
                    value="pending"
                  />

                  <span>
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <ClockIcon />
                      {isEnglish ? "Not paid yet" : "Ainda não pago"}
                    </span>

                    <span className="mt-1 block text-[11px] leading-4 opacity-75">
                      {isEnglish
                        ? "Keep this expense in the card statement until payment."
                        : "Mantém esta despesa na fatura até o pagamento."}
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    paymentStatus === "paid"
                      ? "border-emerald-300/40 bg-emerald-300/[0.1] text-emerald-100"
                      : "border-white/[0.1] bg-white/[0.025] text-slate-400 hover:bg-white/[0.05]"
                  }`}
                >
                  <input
                    checked={paymentStatus === "paid"}
                    className="mt-0.5 accent-emerald-300"
                    name="payment_status_option"
                    onChange={() => setPaymentStatus("paid")}
                    type="radio"
                    value="paid"
                  />

                  <span>
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <CheckIcon />
                      {isEnglish ? "Already paid" : "Já pago"}
                    </span>

                    <span className="mt-1 block text-[11px] leading-4 opacity-75">
                      {isEnglish
                        ? "Use this only when the expense has already been settled."
                        : "Use somente quando esta despesa já tiver sido quitada."}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <input name="payment_status" type="hidden" value="paid" />
          )}

          <p className="text-xs leading-5 text-slate-400">
            {isCreditCardPurchase
              ? isEnglish
                ? "The actual bank account withdrawal should be registered when you pay the credit card statement."
                : "A saída real da conta bancária deve ser registrada quando você pagar a fatura do cartão."
              : transactionType === "income"
                ? isEnglish
                  ? "The income will be credited directly to the selected account."
                  : "A receita será creditada diretamente na conta selecionada."
                : isEnglish
                  ? "The expense will be debited directly from the selected account."
                  : "A despesa será debitada diretamente da conta selecionada."}
          </p>
        </section>
      ) : null}

      {isTransfer ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {isEnglish
              ? "Transfer between accounts"
              : "Transferência entre contas"}
          </h2>

          <input name="payment_method" type="hidden" value="transfer" />
          <input name="payment_status" type="hidden" value="paid" />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                {isEnglish ? "Source account" : "Conta de origem"}
              </span>

              <select
                className={selectClassName}
                name="account_id"
                required
              >
                <option className={optionClassName} value="">
                  {isEnglish
                    ? "Select the source account"
                    : "Selecione a conta de origem"}
                </option>

                {accounts.map((account) => (
                  <option
                    className={optionClassName}
                    key={account.id}
                    value={account.id}
                  >
                    {account.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                {isEnglish ? "Destination account" : "Conta de destino"}
              </span>

              <select
                className={selectClassName}
                name="transfer_to_account_id"
                required
              >
                <option className={optionClassName} value="">
                  {isEnglish
                    ? "Select the destination account"
                    : "Selecione a conta de destino"}
                </option>

                {accounts.map((account) => (
                  <option
                    className={optionClassName}
                    key={account.id}
                    value={account.id}
                  >
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            {isEnglish
              ? "A transfer reduces the source account balance and increases the destination account balance. It is not income or expense."
              : "Uma transferência reduz o saldo da conta de origem e aumenta o saldo da conta de destino. Ela não é receita nem despesa."}
          </p>
        </section>
      ) : null}

      {!isTransfer ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {isEnglish
              ? "Recurrence and installments"
              : "Recorrência e parcelamento"}
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                checked={isRecurring}
                className="h-5 w-5 rounded border border-white/20 bg-white/[0.03] text-emerald-300 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={isInstallment}
                name="is_recurring"
                onChange={(event) =>
                  handleRecurringChange(event.target.checked)
                }
                type="checkbox"
              />

              <span className="text-sm font-medium text-slate-200">
                {isEnglish ? "Is recurring?" : "É recorrente?"}
              </span>
            </label>

            {isRecurring ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    {isEnglish ? "Frequency" : "Frequência"}
                  </span>

                  <select
                    className={selectClassName}
                    defaultValue="monthly"
                    name="frequency"
                    required
                  >
                    <option className={optionClassName} value="weekly">
                      {isEnglish ? "Weekly" : "Semanal"}
                    </option>
                    <option className={optionClassName} value="monthly">
                      {isEnglish ? "Monthly" : "Mensal"}
                    </option>
                    <option className={optionClassName} value="yearly">
                      {isEnglish ? "Yearly" : "Anual"}
                    </option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    {isEnglish
                      ? "End date (optional)"
                      : "Data final (opcional)"}
                  </span>

                  <input
                    className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                    name="end_date"
                    type="date"
                  />
                </label>
              </div>
            ) : null}

            {transactionType === "expense" ? (
              <>
                <label className="flex items-center gap-3">
                  <input
                    checked={isInstallment}
                    className="h-5 w-5 rounded border border-white/20 bg-white/[0.03] text-emerald-300 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isRecurring}
                    name="is_installment"
                    onChange={(event) =>
                      handleInstallmentChange(event.target.checked)
                    }
                    type="checkbox"
                  />

                  <span className="text-sm font-medium text-slate-200">
                    {isEnglish ? "Is installment based?" : "É parcelado?"}
                  </span>
                </label>

                {isInstallment ? (
                  <label className="flex max-w-xs flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-300">
                      {isEnglish
                        ? "Number of installments"
                        : "Número de parcelas"}
                    </span>

                    <input
                      className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                      defaultValue={2}
                      max={48}
                      min={2}
                      name="installments"
                      required
                      type="number"
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            <p className="text-xs leading-5 text-slate-400">
              {isCreditCardPurchase
                ? isEnglish
                  ? "Credit card purchases can be recurring or split into installments. A recurring purchase stays pending until its statement is paid."
                  : "Compras no cartão podem ser recorrentes ou parceladas. Uma compra recorrente permanece pendente até o pagamento da fatura."
                : isEnglish
                  ? "An expense cannot be recurring and installment based at the same time. Installments are created in consecutive months."
                  : "Uma despesa não pode ser recorrente e parcelada ao mesmo tempo. Parcelas serão lançadas em meses consecutivos."}
            </p>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {isEnglish ? "Notes" : "Observações"}
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Notes (optional)" : "Notas (opcional)"}
          </span>

          <textarea
            className="app-input rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:bg-white/[0.05]"
            maxLength={500}
            name="notes"
            placeholder={
              isEnglish
                ? "Additional information about this transaction..."
                : "Informações adicionais sobre este lançamento..."
            }
            rows={3}
          />
        </label>
      </section>

      <div className="flex items-center justify-end border-t border-white/10 pt-5">
        <button
          className="app-shine inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_10px_26px_rgba(52,211,153,0.16)] transition hover:bg-emerald-200"
          type="submit"
        >
          {isEnglish ? "Create transaction" : "Criar lançamento"}
        </button>
      </div>
    </form>
  )
}