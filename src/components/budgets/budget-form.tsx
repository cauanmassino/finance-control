"use client";

import {useActionState} from "react";
import {
  type BudgetState,
  createBudget,
} from "@/app/[locale]/(app)/budgets/actions";

type ExpenseCategory = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
};

type BudgetFormProps = {
  locale: string;
  month: string;
  categories: ExpenseCategory[];
};

const initialState: BudgetState = {
  error: undefined,
};

export function BudgetForm({
  locale,
  month,
  categories,
}: BudgetFormProps) {
  const [state, formAction, isPending] = useActionState(
    createBudget,
    initialState,
  );

  const isEnglish = locale === "en";

  return (
    <form
      action={formAction}
      className="app-surface rounded-[1.7rem] p-5 sm:p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="month" value={month} />

      <div>
        <p className="app-kicker">
          {isEnglish ? "New monthly limit" : "Novo limite mensal"}
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
          {isEnglish ? "Create a budget" : "Criar orçamento"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isEnglish
            ? "Set how much you want to spend in an expense category during this month."
            : "Defina quanto você quer gastar em uma categoria de despesa neste mês."}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5">
          <p className="text-sm font-medium text-slate-200">
            {isEnglish
              ? "No expense categories available."
              : "Nenhuma categoria de despesa disponível."}
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Create an expense category before setting up a budget."
              : "Crie uma categoria de despesa antes de configurar um orçamento."}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Expense category" : "Categoria de despesa"}
            </span>

            <select
              name="category_id"
              required
              disabled={isPending}
              defaultValue=""
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" disabled>
                {isEnglish ? "Choose a category" : "Escolha uma categoria"}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Monthly limit" : "Limite mensal"}
            </span>

            <input
              name="amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              disabled={isPending}
              placeholder={isEnglish ? "e.g. 500.00" : "Ex.: 500,00"}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>
      )}

      {state.error ? (
        <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
          {state.error}
        </p>
      ) : null}

      {categories.length > 0 ? (
        <button
          type="submit"
          disabled={isPending}
          className="app-shine mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? isEnglish
              ? "Creating budget..."
              : "Criando orçamento..."
            : isEnglish
              ? "Create budget"
              : "Criar orçamento"}
        </button>
      ) : null}
    </form>
  );
}