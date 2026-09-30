"use client";

import {useActionState, useState} from "react";
import {
  type RecurringState,
  deleteRecurring,
  generateRecurringTransaction,
  toggleRecurring,
} from "@/app/[locale]/(app)/recurring/actions";

type RecurringActionsProps = {
  locale: string;
  recurringId: string;
  isActive: boolean;
};

const initialState: RecurringState = {
  error: undefined,
};

export function RecurringActions({
  locale,
  recurringId,
  isActive,
}: RecurringActionsProps) {
  const isEnglish = locale === "en";
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [generateState, generateAction, isGenerating] = useActionState(
    generateRecurringTransaction,
    initialState,
  );

  const [toggleState, toggleAction, isToggling] = useActionState(
    toggleRecurring,
    initialState,
  );

  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteRecurring,
    initialState,
  );

  if (isConfirmingDelete) {
    return (
      <form action={deleteAction} className="space-y-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="recurring_id" value={recurringId} />

        <p className="text-xs text-rose-200">
          {isEnglish
            ? "Delete this recurring item?"
            : "Excluir esta recorrência?"}
        </p>

        <div className="flex flex-wrap gap-2">
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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={generateAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="recurring_id" value={recurringId} />

          <button
            type="submit"
            disabled={!isActive || isGenerating}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-300 px-3 text-xs font-bold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating
              ? isEnglish
                ? "Generating..."
                : "Gerando..."
              : isEnglish
                ? "Generate entry"
                : "Gerar lançamento"}
          </button>
        </form>

        <form action={toggleAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="recurring_id" value={recurringId} />
          <input
            type="hidden"
            name="next_active"
            value={isActive ? "false" : "true"}
          />

          <button
            type="submit"
            disabled={isToggling}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isToggling
              ? isEnglish
                ? "Updating..."
                : "Atualizando..."
              : isActive
                ? isEnglish
                  ? "Pause"
                  : "Pausar"
                : isEnglish
                  ? "Resume"
                  : "Retomar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsConfirmingDelete(true)}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-300/30 bg-rose-300/[0.06] px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/[0.12]"
        >
          {isEnglish ? "Delete" : "Excluir"}
        </button>
      </div>

      {generateState.error ? (
        <p className="text-xs text-rose-300">{generateState.error}</p>
      ) : null}

      {toggleState.error ? (
        <p className="text-xs text-rose-300">{toggleState.error}</p>
      ) : null}
    </div>
  );
}