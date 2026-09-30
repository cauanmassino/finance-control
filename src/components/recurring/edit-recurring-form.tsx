"use client";

import {useActionState, useMemo, useState} from "react";
import {
  updateRecurringTransaction,
  type EditRecurringState,
} from "@/app/[locale]/(app)/recurring/[id]/edit/actions";

type SupportedLocale = "pt" | "en";
type RecurringType = "income" | "expense";
type RecurringFrequency = "weekly" | "monthly" | "yearly";

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  type: RecurringType;
  icon: string | null;
};

type RecurringTransaction = {
  id: string;
  description: string;
  amount: number;
  type: RecurringType;
  account_id: string | null;
  category_id: string | null;
  payment_method: string | null;
  notes: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_occurrence: string;
  end_date: string | null;
  is_active: boolean;
};

type EditRecurringFormProps = {
  locale: SupportedLocale;
  accounts: Account[];
  categories: Category[];
  recurringTransaction: RecurringTransaction;
};

const initialState: EditRecurringState = {};

export function EditRecurringForm({
  locale,
  accounts,
  categories,
  recurringTransaction,
}: EditRecurringFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateRecurringTransaction,
    initialState,
  );

  const [type, setType] = useState<RecurringType>(
    recurringTransaction.type,
  );

  const isEnglish = locale === "en";

  const compatibleCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <input type="hidden" name="locale" value={locale} />

      <input
        type="hidden"
        name="recurring_transaction_id"
        value={recurringTransaction.id}
      />

      <input
        type="hidden"
        name="is_active"
        value={String(recurringTransaction.is_active)}
      />

      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">
          {isEnglish ? "Edit recurrence" : "Editar recorrência"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {isEnglish
            ? "Changes will apply to future automatic transactions."
            : "As alterações serão aplicadas aos próximos lançamentos automáticos."}
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
              onChange={(event) =>
                setType(event.target.value as RecurringType)
              }
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
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={recurringTransaction.amount}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
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
            defaultValue={recurringTransaction.description}
            disabled={isPending}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Frequency" : "Frequência"}
            </span>

            <select
              name="frequency"
              defaultValue={recurringTransaction.frequency}
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
              {isEnglish ? "Start date" : "Data de início"}
            </span>

            <input
              name="start_date"
              type="date"
              required
              defaultValue={recurringTransaction.start_date}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Next occurrence" : "Próxima ocorrência"}
            </span>

            <input
              name="next_occurrence"
              type="date"
              required
              defaultValue={recurringTransaction.next_occurrence}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "End date (optional)" : "Data final (opcional)"}
            </span>

            <input
              name="end_date"
              type="date"
              defaultValue={recurringTransaction.end_date ?? ""}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Account (optional)" : "Conta (opcional)"}
            </span>

            <select
              name="account_id"
              defaultValue={recurringTransaction.account_id ?? ""}
              disabled={isPending}
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

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Category (optional)" : "Categoria (opcional)"}
            </span>

            <select
              key={type}
              name="category_id"
              defaultValue={recurringTransaction.category_id ?? ""}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isEnglish ? "No category" : "Sem categoria"}
              </option>

              {compatibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon ? `${category.icon} ` : ""}
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Payment method" : "Método de pagamento"}
          </span>

          <select
            name="payment_method"
            defaultValue={recurringTransaction.payment_method ?? ""}
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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-300">
            {isEnglish ? "Notes (optional)" : "Observação (opcional)"}
          </span>

          <textarea
            name="notes"
            rows={3}
            maxLength={500}
            defaultValue={recurringTransaction.notes ?? ""}
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

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <a
          href={`/${locale}/recurring`}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          {isEnglish ? "Cancel" : "Cancelar"}
        </a>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? isEnglish
              ? "Saving..."
              : "Salvando..."
            : isEnglish
              ? "Save changes"
              : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}