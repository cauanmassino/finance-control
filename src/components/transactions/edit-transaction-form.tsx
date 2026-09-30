"use client";

import Link from "next/link";
import {useActionState, useMemo, useState} from "react";
import {
  updateTransaction,
  type EditTransactionState,
} from "@/app/[locale]/(app)/transactions/[id]/edit/actions";

type SupportedLocale = "pt" | "en";
type TransactionType = "income" | "expense";

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string | null;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  occurred_on: string;
  account_id: string | null;
  category_id: string | null;
  payment_method: string | null;
  notes: string | null;
};

type EditTransactionFormProps = {
  locale: SupportedLocale;
  accounts: Account[];
  categories: Category[];
  transaction: Transaction;
};

const initialState: EditTransactionState = {
  error: undefined,
  warning: undefined,
  requiresNegativeBalanceConfirmation: false,
};

function formatAmountForInput(amount: number) {
  return amount.toFixed(2).replace(".", ",");
}

export function EditTransactionForm({
  locale,
  accounts,
  categories,
  transaction,
}: EditTransactionFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateTransaction,
    initialState,
  );

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [confirmedNegativeBalance, setConfirmedNegativeBalance] =
    useState(false);

  const isEnglish = locale === "en";

  const compatibleCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  const hasNegativeBalanceWarning =
    Boolean(state.requiresNegativeBalanceConfirmation) &&
    Boolean(state.warning);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="transaction_id" value={transaction.id} />

      {confirmedNegativeBalance ? (
        <input
          type="hidden"
          name="confirm_negative_balance"
          value="true"
        />
      ) : null}

      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">
          {isEnglish ? "Edit transaction" : "Editar lançamento"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {isEnglish
            ? "Update the details of this transaction."
            : "Atualize as informações deste lançamento."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Type" : "Tipo"}
            </span>

            <select
              name="type"
              value={type}
              onChange={(event) => {
                setType(event.target.value as TransactionType);
                setConfirmedNegativeBalance(false);
              }}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="expense">
                {isEnglish ? "Expense" : "Despesa"}
              </option>

              <option value="income">
                {isEnglish ? "Income" : "Receita"}
              </option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Amount" : "Valor"}
            </span>

            <input
              name="amount"
              type="text"
              inputMode="decimal"
              required
              defaultValue={formatAmountForInput(transaction.amount)}
              disabled={isPending}
              onChange={() => setConfirmedNegativeBalance(false)}
              placeholder={isEnglish ? "e.g. 5.60" : "Ex.: 5,60"}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="text-xs text-slate-500">
              {isEnglish
                ? "You can enter 5.60 or 1,234.56."
                : "Você pode informar 5,60 ou 1.234,56."}
            </p>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Description" : "Descrição"}
          </span>

          <input
            name="description"
            type="text"
            required
            maxLength={120}
            defaultValue={transaction.description}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Date" : "Data"}
            </span>

            <input
              name="occurred_on"
              type="date"
              required
              defaultValue={transaction.occurred_on}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Account (optional)" : "Conta (opcional)"}
            </span>

            <select
              name="account_id"
              defaultValue={transaction.account_id ?? ""}
              disabled={isPending}
              onChange={() => setConfirmedNegativeBalance(false)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isEnglish ? "No account" : "Sem conta"}
              </option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Category (optional)" : "Categoria (opcional)"}
            </span>

            <select
              key={type}
              name="category_id"
              defaultValue={transaction.category_id ?? ""}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isEnglish ? "No category" : "Sem categoria"}
              </option>

              {compatibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Payment method" : "Método de pagamento"}
            </span>

            <select
              name="payment_method"
              defaultValue={transaction.payment_method ?? ""}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isEnglish ? "Not specified" : "Não informado"}
              </option>

              <option value="pix">Pix</option>

              <option value="debit_card">
                {isEnglish ? "Debit card" : "Cartão de débito"}
              </option>

              <option value="credit_card">
                {isEnglish ? "Credit card" : "Cartão de crédito"}
              </option>

              <option value="cash">
                {isEnglish ? "Cash" : "Dinheiro"}
              </option>

              <option value="bank_transfer">
                {isEnglish ? "Bank transfer" : "Transferência"}
              </option>

              <option value="boleto">Boleto</option>

              <option value="other">
                {isEnglish ? "Other" : "Outro"}
              </option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Notes (optional)" : "Observação (opcional)"}
          </span>

          <textarea
            name="notes"
            rows={3}
            maxLength={500}
            defaultValue={transaction.notes ?? ""}
            disabled={isPending}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </p>
      ) : null}

      {hasNegativeBalanceWarning ? (
        <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.08] p-4">
          <p className="text-sm font-semibold text-amber-100">
            {isEnglish
              ? "This update will leave the account with a negative balance."
              : "Esta alteração deixará a conta com saldo negativo."}
          </p>

          <p className="mt-1 text-sm leading-6 text-amber-100/75">
            {state.warning}
          </p>

          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmedNegativeBalance}
              onChange={(event) =>
                setConfirmedNegativeBalance(event.target.checked)
              }
              disabled={isPending}
              className="mt-0.5 h-4 w-4 rounded border-amber-300/60 bg-slate-950 text-amber-300 focus:ring-amber-300"
            />

            <span className="text-sm text-amber-100">
              {isEnglish
                ? "I understand and want to save this change anyway."
                : "Entendo o aviso e desejo salvar esta alteração mesmo assim."}
            </span>
          </label>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/${locale}/transactions`}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          {isEnglish ? "Cancel" : "Cancelar"}
        </Link>

        <button
          type="submit"
          disabled={
            isPending ||
            (hasNegativeBalanceWarning && !confirmedNegativeBalance)
          }
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? isEnglish
              ? "Saving..."
              : "Salvando..."
            : hasNegativeBalanceWarning && !confirmedNegativeBalance
              ? isEnglish
                ? "Confirm negative balance"
                : "Confirme o saldo negativo"
              : isEnglish
                ? "Save changes"
                : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}