"use client";

import {useState, type ChangeEvent} from "react";
import {createTransaction} from "@/app/[locale]/(app)/transactions/actions";

type CardOption = {
  id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  last_four: string | null;
};

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type TransactionFormProps = {
  locale: string;
  cards: CardOption[];
  accounts: AccountOption[];
  categories: CategoryOption[];
};

type TransactionType = "income" | "expense" | "transfer";
type PaymentMethod = "account" | "card";

const selectClassName =
  "app-input h-11 rounded-xl bg-slate-950 px-3.5 text-sm text-white outline-none focus:border-emerald-400 focus:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-45";

const optionClassName = "bg-slate-950 text-white";

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  );
}

export function TransactionForm({
  locale,
  cards,
  accounts,
  categories,
}: TransactionFormProps) {
  const [transactionType, setTransactionType] =
    useState<TransactionType>("expense");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("account");

  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);

  const isEnglish = locale === "en";
  const isTransfer = transactionType === "transfer";
  const canUseCreditCard = transactionType === "expense";

  const isCreditCardPurchase =
    transactionType === "expense" && paymentMethod === "card";

  const availableCategories = isTransfer
    ? []
    : categories.filter(
        (category) => category.type === transactionType,
      );

  function handleTransactionTypeChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const nextType = event.target.value as TransactionType;

    setTransactionType(nextType);

    if (nextType !== "expense") {
      setPaymentMethod("account");
      setIsInstallment(false);
    }

    if (nextType === "transfer") {
      setIsRecurring(false);
    }
  }

  function handlePaymentMethodChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setPaymentMethod(event.target.value as PaymentMethod);
  }

  function handleRecurringChange(checked: boolean) {
    setIsRecurring(checked);

    if (checked) {
      setIsInstallment(false);
    }
  }

  function handleInstallmentChange(checked: boolean) {
    setIsInstallment(checked);

    if (checked) {
      setIsRecurring(false);
    }
  }

  return (
    <form action={createTransaction} className="space-y-6">
      <input name="locale" type="hidden" value={locale} />

      <input
        name="payment_status"
        type="hidden"
        value={isCreditCardPurchase ? "pending" : "paid"}
      />

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
              key={transactionType}
              className={selectClassName}
              defaultValue=""
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

          {!canUseCreditCard ? (
            <input
              name="payment_method"
              type="hidden"
              value="account"
            />
          ) : null}

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

            {!isCreditCardPurchase ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-300">
                  {isEnglish ? "Account" : "Conta"}
                </span>

                <select
                  className={selectClassName}
                  defaultValue=""
                  name="account_id"
                  required
                >
                  <option className={optionClassName} value="">
                    {isEnglish
                      ? "Select an account"
                      : "Selecione a conta"}
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
                  defaultValue=""
                  name="credit_card_id"
                  required
                >
                  <option className={optionClassName} value="">
                    {isEnglish
                      ? "Select a credit card"
                      : "Selecione o cartão"}
                  </option>

                  {cards.map((card) => {
                    const details = [
                      card.institution,
                      card.brand,
                      card.last_four
                        ? `•••• ${card.last_four}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <option
                        className={optionClassName}
                        key={card.id}
                        value={card.id}
                      >
                        {details
                          ? `${card.name} — ${details}`
                          : card.name}
                      </option>
                    );
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

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-100">
                    {isEnglish
                      ? "This purchase will be added to your statement"
                      : "Esta compra será incluída na fatura"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-100/70">
                    {isInstallment
                      ? isEnglish
                        ? "Each installment will be added to the corresponding statement of the selected card. Register the statement payment under Cards when you pay it."
                        : "Cada parcela será incluída na fatura correspondente do cartão selecionado. Registre o pagamento da fatura na página de Cartões quando ela for paga."
                      : isEnglish
                        ? "The amount will be added to the statement of the selected card. Register the statement payment under Cards when you pay it."
                        : "O valor será incluído na fatura do cartão selecionado. Registre o pagamento da fatura na página de Cartões quando ela for paga."}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-amber-100/70">
                    {isEnglish
                      ? "Creating this purchase does not withdraw money from a bank account."
                      : "Cadastrar esta compra não retira dinheiro de uma conta bancária."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-5 text-slate-400">
              {transactionType === "income"
                ? isEnglish
                  ? "The income will be credited directly to the selected account."
                  : "A receita será creditada diretamente na conta selecionada."
                : isEnglish
                  ? "The expense will be debited directly from the selected account."
                  : "A despesa será debitada diretamente da conta selecionada."}
            </p>
          )}
        </section>
      ) : null}

      {isTransfer ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">
            {isEnglish
              ? "Transfer between accounts"
              : "Transferência entre contas"}
          </h2>

          <input
            name="payment_method"
            type="hidden"
            value="transfer"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                {isEnglish ? "Source account" : "Conta de origem"}
              </span>

              <select
                className={selectClassName}
                defaultValue=""
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
                {isEnglish
                  ? "Destination account"
                  : "Conta de destino"}
              </span>

              <select
                className={selectClassName}
                defaultValue=""
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
                    <option
                      className={optionClassName}
                      value="weekly"
                    >
                      {isEnglish ? "Weekly" : "Semanal"}
                    </option>

                    <option
                      className={optionClassName}
                      value="monthly"
                    >
                      {isEnglish ? "Monthly" : "Mensal"}
                    </option>

                    <option
                      className={optionClassName}
                      value="yearly"
                    >
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
                    {isEnglish
                      ? "Is installment based?"
                      : "É parcelado?"}
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
                      step={1}
                      type="number"
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            <p className="text-xs leading-5 text-slate-400">
              {isCreditCardPurchase
                ? isEnglish
                  ? "Credit card purchases can be recurring or split into installments, but not both. Each purchase is linked to its corresponding statement."
                  : "Compras no cartão podem ser recorrentes ou parceladas, mas não as duas coisas ao mesmo tempo. Cada compra é vinculada à sua fatura correspondente."
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
  );
}