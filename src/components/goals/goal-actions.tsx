"use client";

import {useActionState, useState} from "react";
import {
  type GoalState,
  addGoalContribution,
  deleteGoal,
  toggleGoalCompletion,
} from "@/app/[locale]/(app)/goals/actions";

type GoalActionsProps = {
  locale: string;
  goalId: string;
  isCompleted: boolean;
  today: string;
};

const initialState: GoalState = {
  error: undefined,
};

export function GoalActions({
  locale,
  goalId,
  isCompleted,
  today,
}: GoalActionsProps) {
  const isEnglish = locale === "en";

  const [isAddingContribution, setIsAddingContribution] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [contributionState, contributionAction, isContributing] =
    useActionState(addGoalContribution, initialState);

  const [completionState, completionAction, isUpdatingCompletion] =
    useActionState(toggleGoalCompletion, initialState);

  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteGoal,
    initialState,
  );

  if (isConfirmingDelete) {
    return (
      <form action={deleteAction} className="space-y-2">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="goal_id" value={goalId} />

        <p className="text-xs text-rose-200">
          {isEnglish ? "Delete this goal and its contributions?" : "Excluir esta meta e seus aportes?"}
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
      {isAddingContribution ? (
        <form action={contributionAction} className="space-y-2">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="goal_id" value={goalId} />

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              name="amount"
              type="text"
              inputMode="decimal"
              required
              disabled={isContributing}
              placeholder={isEnglish ? "e.g. 100.00" : "Ex.: 100,00"}
              className="h-9 min-w-0 rounded-lg border border-white/[0.1] bg-slate-950/55 px-2.5 text-sm text-slate-100 outline-none focus:border-violet-300/55 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <input
              name="occurred_on"
              type="date"
              required
              defaultValue={today}
              disabled={isContributing}
              className="h-9 rounded-lg border border-white/[0.1] bg-slate-950/55 px-2.5 text-xs text-slate-100 outline-none focus:border-violet-300/55 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <input
            name="notes"
            type="text"
            maxLength={250}
            disabled={isContributing}
            placeholder={isEnglish ? "Contribution note (optional)" : "Observação do aporte (opcional)"}
            className="h-9 w-full rounded-lg border border-white/[0.1] bg-slate-950/55 px-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-300/55 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isContributing}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-violet-300 px-3 text-xs font-bold text-violet-950 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isContributing
                ? isEnglish
                  ? "Saving..."
                  : "Salvando..."
                : isEnglish
                  ? "Save contribution"
                  : "Salvar aporte"}
            </button>

            <button
              type="button"
              disabled={isContributing}
              onClick={() => setIsAddingContribution(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              {isEnglish ? "Cancel" : "Cancelar"}
            </button>
          </div>

          {contributionState.error ? (
            <p className="text-xs text-rose-300">
              {contributionState.error}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {!isCompleted ? (
            <button
              type="button"
              onClick={() => setIsAddingContribution(true)}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-violet-300 px-3 text-xs font-bold text-violet-950 transition hover:bg-violet-200"
            >
              {isEnglish ? "Add contribution" : "Adicionar aporte"}
            </button>
          ) : null}

          <form action={completionAction}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="goal_id" value={goalId} />
            <input
              type="hidden"
              name="next_completed"
              value={isCompleted ? "false" : "true"}
            />

            <button
              type="submit"
              disabled={isUpdatingCompletion}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingCompletion
                ? isEnglish
                  ? "Updating..."
                  : "Atualizando..."
                : isCompleted
                  ? isEnglish
                    ? "Reopen"
                    : "Reabrir"
                  : isEnglish
                    ? "Mark complete"
                    : "Concluir"}
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
      )}

      {completionState.error ? (
        <p className="text-xs text-rose-300">{completionState.error}</p>
      ) : null}
    </div>
  );
}