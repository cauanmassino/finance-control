"use client";

import {useActionState} from "react";
import {
  type RecurringState,
  createRecurring,
} from "@/app/[locale]/(app)/recurring/actions";

type Account = {
  id: string;
  name: string;
  color: string | null;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
  icon: string | null;
};

type RecurringFormProps = {
  locale: string;
  accounts: Account[];
  categories: Category[];
  today: string;
};

const initialState: RecurringState = {
  error: undefined,
};

export function RecurringForm({
  locale,
  accounts,
  categories,
  today,
}: RecurringFormProps) {
  const [state, formAction, isPending] = useActionState(
    createRecurring,
    initialState,
  );

  const isEnglish = locale === "en";

  return (
    <form
      action={formAction}
      className="app-surface rounded-[1.7rem] p-5 sm:p-6"
    >
      <input type="hidden" name="locale" value={locale} />

      <div>
        <p className="app-kicker">
          {isEnglish ? "Automatic planning" : "Planejamento automático"}
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
          {isEnglish ? "New recurring item" : "Nova recorrência"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isEnglish
            ? "Set up income or expenses that repeat over time."
            : "Configure receitas ou despesas que se repetem ao longo do tempo."}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Description" : "Descrição"}
          </span>

          <input
            name="description"
            type="text"
            required
            maxLength={120}
            disabled={isPending}
            placeholder={isEnglish ? "e.g. Streaming subscription" : "Ex.: Assinatura de streaming"}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Type" : "Tipo"}
            </span>

            <select
              name="type"
              defaultValue="expense"
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Amount" : "Valor"}
            </span>

            <input
              name="amount"
              type="text"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              required
              disabled={isPending}
              placeholder={isEnglish ? "e.g. 5.60" : "Ex.: 5,60"}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Frequency" : "Frequência"}
            </span>

            <select
              name="frequency"
              defaultValue="monthly"
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Payment method" : "Método de pagamento"}
            </span>

            <input
              name="payment_method"
              type="text"
              maxLength={80}
              disabled={isPending}
              placeholder={isEnglish ? "e.g. Credit card" : "Ex.: Cartão de crédito"}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Account" : "Conta"}
          </span>

          <select
            name="account_id"
            defaultValue=""
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {isEnglish ? "No linked account" : "Sem conta vinculada"}
            </option>

            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Category" : "Categoria"}
          </span>

          <select
            name="category_id"
            defaultValue=""
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {isEnglish ? "No linked category" : "Sem categoria vinculada"}
            </option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}{" "}
                {category.type === "income"
                  ? isEnglish
                    ? "(income)"
                    : "(receita)"
                  : isEnglish
                    ? "(expense)"
                    : "(despesa)"}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Start date" : "Data inicial"}
            </span>

            <input
              name="start_date"
              type="date"
              required
              defaultValue={today}
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Next occurrence" : "Próxima ocorrência"}
            </span>

            <input
              name="next_occurrence"
              type="date"
              required
              defaultValue={today}
              disabled={isPending}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "End date (optional)" : "Data final (opcional)"}
          </span>

          <input
            name="end_date"
            type="date"
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Notes (optional)" : "Observações (opcional)"}
          </span>

          <textarea
            name="notes"
            rows={3}
            maxLength={500}
            disabled={isPending}
            placeholder={isEnglish ? "Add a note about this recurring item..." : "Adicione uma observação sobre esta recorrência..."}
            className="w-full resize-none rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>

      {state.error ? (
        <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="app-shine mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.18)] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? isEnglish
            ? "Creating recurring item..."
            : "Criando recorrência..."
          : isEnglish
            ? "Create recurring item"
            : "Criar recorrência"}
      </button>
    </form>
  );
}