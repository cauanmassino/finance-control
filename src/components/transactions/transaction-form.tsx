"use client";

import Link from "next/link";
import {useActionState, useMemo, useState} from "react";
import {
  createTransaction,
  type TransactionState,
} from "@/app/[locale]/(app)/transactions/actions";

type SupportedLocale = "pt" | "en";
type TransactionType = "income" | "expense";

type Account = {
  id: string;
  name: string;
  color: string;
};

type Category = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
};

type TransactionFormProps = {
  locale: SupportedLocale;
  accounts: Account[];
  categories: Category[];
};

const initialState: TransactionState = {
  error: undefined,
  warning: undefined,
  requiresNegativeBalanceConfirmation: false,
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  locale,
  accounts,
  categories,
}: TransactionFormProps) {
  const [state, formAction, isPending] = useActionState(
    createTransaction,
    initialState,
  );

  const [type, setType] = useState<TransactionType>("expense");
  const [isRecurring, setIsRecurring] = useState(false);
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

      {confirmedNegativeBalance ? (
        <input
          type="hidden"
          name="confirm_negative_balance"
          value="true"
        />
      ) : null}

      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">
          {isEnglish ? "New transaction" : "Novo lançamento"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {isEnglish
            ? "Add income or expense to your personal finance."
            : "Adicione uma receita ou despesa ao seu controle financeiro."}
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
            disabled={isPending}
            placeholder={
              isEnglish
                ? "e.g. Grocery shopping"
                : "Ex.: Compras do mês"
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Date" : "Data"}
            </span>

            <input
              name="date"
              type="date"
              required
              defaultValue={getToday()}
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
              defaultValue=""
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
              defaultValue=""
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
              defaultValue=""
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
            disabled={isPending}
            placeholder={
              isEnglish
                ? "Add any relevant details."
                : "Adicione detalhes relevantes."
            }
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
          <div className="flex items-start gap-3">
            <input
              id="is_recurring"
              name="is_recurring"
              type="checkbox"
              checked={isRecurring}
              onChange={(event) => setIsRecurring(event.target.checked)}
              disabled={isPending}
              className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />

            <label htmlFor="is_recurring" className="flex-1">
              <p className="text-sm font-medium text-slate-200">
                {isEnglish
                  ? "Make this a recurring transaction"
                  : "Tornar este lançamento recorrente"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isEnglish
                  ? "This creates a recurring item you can manage in the Recurrences page."
                  : "Isso cria uma recorrência que você pode gerenciar na página de Recorrências."}
              </p>
            </label>
          </div>

          {isRecurring ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  {isEnglish ? "Frequency" : "Frequência"}
                </span>

                <select
                  name="frequency"
                  defaultValue="monthly"
                  disabled={isPending}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="weekly">
                    {isEnglish ? "Weekly" : "Semanal"}
                  </option>

                  <option value="monthly">
                    {isEnglish ? "Monthly" : "Mensal"}
                  </option>

                  <option value="yearly">
                    {isEnglish ? "Yearly" : "Anual"}
                  </option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">
                  {isEnglish
                    ? "End date (optional)"
                    : "Data final (opcional)"}
                </span>

                <input
                  name="end_date"
                  type="date"
                  disabled={isPending}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>
          ) : null}
        </div>
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
              ? "This expense will leave the account with a negative balance."
              : "Esta despesa deixará a conta com saldo negativo."}
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
                ? "I understand and want to save this transaction anyway."
                : "Entendo o aviso e desejo salvar este lançamento mesmo assim."}
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
                ? "Save transaction"
                : "Salvar lançamento"}
        </button>
      </div>
    </form>
  );
}