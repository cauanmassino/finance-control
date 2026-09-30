"use client";

import {useActionState, useState} from "react";
import {
  type BudgetState,
  deleteBudget,
  updateBudget,
} from "@/app/[locale]/(app)/budgets/actions";

type BudgetActionsProps = {
  locale: string;
  budgetId: string;
  amount: number;
};

const initialState: BudgetState = {
  error: undefined,
};

export function BudgetActions({
  locale,
  budgetId,
  amount,
}: BudgetActionsProps) {
  const isEnglish = locale === "en";

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [updateState, updateAction, isUpdating] = useActionState(
    updateBudget,
    initialState,
  );

  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteBudget,
    initialState,
  );

  if (isEditing) {
    return (
      <form action={updateAction} className="w-full space-y-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="budget_id" value={budgetId} />

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            defaultValue={amount.toFixed(2)}
            disabled={isUpdating}
            className="h-9 min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-slate-950/55 px-2.5 text-sm text-slate-100 outline-none focus:border-emerald-300/55 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-300 px-3 text-xs font-bold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUpdating
              ? isEnglish
                ? "Saving..."
                : "Salvando..."
              : isEnglish
                ? "Save"
                : "Salvar"}
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => setIsEditing(false)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            {isEnglish ? "Cancel" : "Cancelar"}
          </button>
        </div>

        {updateState.error ? (
          <p className="text-xs text-rose-300">{updateState.error}</p>
        ) : null}
      </form>
    );
  }

  if (isConfirmingDelete) {
    return (
      <form action={deleteAction} className="w-full space-y-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="budget_id" value={budgetId} />

        <p className="text-xs text-rose-200">
          {isEnglish
            ? "Delete this monthly budget?"
            : "Excluir este orçamento mensal?"}
        </p>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-400 px-3 text-xs font-bold text-rose-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting
              ? isEnglish
                ? "Deleting..."
                : "Excluindo..."
              : isEnglish
                ? "Delete"
                : "Excluir"}
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setIsConfirmingDelete(false)}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            {isEnglish ? "Cancel" : "Cancelar"}
          </button>
        </div>

        {deleteState.error ? (
          <p className="text-xs text-rose-300">{deleteState.error}</p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
      >
        {isEnglish ? "Edit" : "Editar"}
      </button>

      <button
        type="button"
        onClick={() => setIsConfirmingDelete(true)}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-300/30 bg-rose-300/[0.06] px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/[0.12]"
      >
        {isEnglish ? "Delete" : "Excluir"}
      </button>
    </div>
  );
}