"use client";

import {useActionState} from "react";
import {
  createTransfer,
  type TransferState,
} from "@/app/[locale]/(app)/transfers/actions";

type SupportedLocale = "pt" | "en";

type Account = {
  id: string;
  name: string;
  color: string;
};

type TransferFormProps = {
  locale: SupportedLocale;
  accounts: Account[];
};

const initialState: TransferState = {};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function TransferForm({
  locale,
  accounts,
}: TransferFormProps) {
  const [state, formAction, isPending] = useActionState(
    createTransfer,
    initialState,
  );

  const isEnglish = locale === "en";

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-4">
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
                ? "e.g. Move money to savings"
                : "Ex.: Transferência para poupança"
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
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
              disabled={isPending}
              placeholder="0,00"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "Date" : "Data"}
            </span>

            <input
              name="occurred_on"
              type="date"
              required
              defaultValue={getToday()}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">
              {isEnglish ? "From account" : "Conta de origem"}
            </span>

            <select
              name="from_account_id"
              required
              defaultValue=""
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isEnglish ? "Select account" : "Selecione uma conta"}
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
              {isEnglish ? "To account" : "Conta de destino"}
            </span>

            <select
              name="to_account_id"
              required
              defaultValue=""
              disabled={isPending}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isEnglish ? "Select account" : "Selecione uma conta"}
              </option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
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
      </div>

      {state.error ? (
        <p className="mt-4 rounded-lg border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">
          {state.error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <a
          href={`/${locale}/transactions`}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          {isEnglish ? "Cancel" : "Cancelar"}
        </a>

        <button
          type="submit"
          disabled={isPending || accounts.length < 2}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? isEnglish
              ? "Transferring..."
              : "Transferindo..."
            : isEnglish
              ? "Create transfer"
              : "Criar transferência"}
        </button>
      </div>

      {accounts.length < 2 ? (
        <p className="mt-4 text-sm text-amber-400">
          {isEnglish
            ? "Create at least two accounts before making a transfer."
            : "Crie pelo menos duas contas antes de fazer uma transferência."}
        </p>
      ) : null}
    </form>
  );
}