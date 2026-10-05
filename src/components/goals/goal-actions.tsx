"use client"

import { useActionState, useEffect, useState } from "react"
import {
  type GoalState,
  addGoalContribution,
  deleteGoal,
  toggleGoalCompletion,
} from "@/app/[locale]/(app)/goals/actions"

type GoalActionsProps = {
  locale: string
  goalId: string
  isCompleted: boolean
  today: string
}

type ContributionType = "contribution" | "withdrawal"

const initialState: GoalState = {
  error: undefined,
  success: undefined,
}

const quickAmounts = [50, 100, 200]

function formatQuickAmount(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 0,
  }).format(amount)
}

const PlusIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.3"
  >
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
)

const MinusIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.3"
  >
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
)

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrashIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m-9 0 1 13h10l1-13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ArrowRightIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function GoalActions({
  locale,
  goalId,
  isCompleted,
  today,
}: GoalActionsProps) {
  const isEnglish = locale === "en"

  const [isAddingContribution, setIsAddingContribution] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [contributionType, setContributionType] =
    useState<ContributionType>("contribution")
  const [selectedAmount, setSelectedAmount] = useState("")
  const [showWithdrawal, setShowWithdrawal] = useState(false)

  const [contributionState, contributionAction, isContributing] =
    useActionState(addGoalContribution, initialState)

  const [completionState, completionAction, isUpdatingCompletion] =
    useActionState(toggleGoalCompletion, initialState)

  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteGoal,
    initialState,
  )

  useEffect(() => {
    if (contributionState.success) {
      setSelectedAmount("")
      setIsAddingContribution(false)
      setContributionType("contribution")
      setShowWithdrawal(false)
    }
  }, [contributionState.success])

  function openContributionForm(
    type: ContributionType = "contribution",
    amount = "",
  ) {
    setContributionType(type)
    setSelectedAmount(amount)
    setIsAddingContribution(true)
    setIsConfirmingDelete(false)
  }

  function closeContributionForm() {
    if (isContributing) {
      return
    }

    setIsAddingContribution(false)
    setContributionType("contribution")
    setSelectedAmount("")
  }

  if (isConfirmingDelete) {
    return (
      <form
        action={deleteAction}
        className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-4"
      >
        <input name="locale" type="hidden" value={locale} />
        <input name="goal_id" type="hidden" value={goalId} />

        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-300/10 text-rose-200">
            <TrashIcon />
          </span>

          <div>
            <p className="text-sm font-bold text-rose-100">
              {isEnglish ? "Delete this goal?" : "Excluir esta meta?"}
            </p>

            <p className="mt-1 text-xs leading-5 text-rose-100/70">
              {isEnglish
                ? "This action removes the goal and all contributions recorded for it."
                : "Essa ação remove a meta e todos os aportes registrados nela."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-rose-400 px-3.5 text-xs font-bold text-rose-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
            type="submit"
          >
            <TrashIcon />
            {isDeleting
              ? isEnglish
                ? "Deleting..."
                : "Excluindo..."
              : isEnglish
                ? "Delete goal"
                : "Excluir meta"}
          </button>

          <button
            className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
            onClick={() => setIsConfirmingDelete(false)}
            type="button"
          >
            {isEnglish ? "Cancel" : "Cancelar"}
          </button>
        </div>

        {deleteState.error ? (
          <p className="mt-3 text-xs text-rose-200">{deleteState.error}</p>
        ) : null}
      </form>
    )
  }

  if (isAddingContribution) {
    const isWithdrawal = contributionType === "withdrawal"

    return (
      <form
        action={contributionAction}
        className="rounded-2xl border border-white/[0.1] bg-slate-950/40 p-4"
      >
        <input name="locale" type="hidden" value={locale} />
        <input name="goal_id" type="hidden" value={goalId} />
        <input name="contribution_type" type="hidden" value={contributionType} />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-100">
                {isWithdrawal
                  ? isEnglish
                    ? "Withdraw from this goal"
                    : "Resgatar desta meta"
                  : isEnglish
                    ? "Add to this goal"
                    : "Adicionar à meta"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isWithdrawal
                  ? isEnglish
                    ? "Record an amount removed from this objective."
                    : "Registre um valor retirado deste objetivo."
                  : isEnglish
                    ? "Every contribution brings this goal closer."
                    : "Cada aporte aproxima você deste objetivo."}
              </p>
            </div>

            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isWithdrawal
                  ? "bg-rose-400/10 text-rose-300"
                  : "bg-emerald-400/10 text-emerald-300"
              }`}
            >
              {isWithdrawal ? <MinusIcon /> : <PlusIcon />}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] p-1">
            <button
              className={`h-9 rounded-lg text-xs font-bold transition ${
                contributionType === "contribution"
                  ? "bg-emerald-400 text-emerald-950 shadow-[0_4px_14px_rgba(16,185,129,0.16)]"
                  : "text-slate-400 hover:text-white"
              }`}
              disabled={isContributing}
              onClick={() => setContributionType("contribution")}
              type="button"
            >
              {isEnglish ? "Contribution" : "Aporte"}
            </button>

            <button
              className={`h-9 rounded-lg text-xs font-bold transition ${
                contributionType === "withdrawal"
                  ? "bg-rose-400 text-rose-950 shadow-[0_4px_14px_rgba(251,113,133,0.16)]"
                  : "text-slate-400 hover:text-white"
              }`}
              disabled={isContributing}
              onClick={() => setContributionType("withdrawal")}
              type="button"
            >
              {isEnglish ? "Withdrawal" : "Resgate"}
            </button>
          </div>

          {!isWithdrawal ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                {isEnglish ? "Quick amount" : "Aporte rápido"}
              </p>

              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-bold transition ${
                      selectedAmount === String(amount)
                        ? "border-emerald-300/35 bg-emerald-300/[0.12] text-emerald-200"
                        : "border-white/[0.1] bg-white/[0.025] text-slate-400 hover:border-emerald-300/25 hover:text-emerald-200"
                    }`}
                    disabled={isContributing}
                    key={amount}
                    onClick={() => setSelectedAmount(String(amount))}
                    type="button"
                  >
                    + {formatQuickAmount(amount, locale)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">
                {isEnglish ? "Amount" : "Valor"}
              </span>

              <input
                className={`h-10 w-full min-w-0 rounded-xl border bg-slate-950/55 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isWithdrawal
                    ? "border-rose-300/20 focus:border-rose-300/55"
                    : "border-white/[0.1] focus:border-emerald-300/55"
                }`}
                disabled={isContributing}
                inputMode="decimal"
                name="amount"
                onChange={(event) => setSelectedAmount(event.target.value)}
                placeholder={isEnglish ? "e.g. 100.00" : "Ex.: 100,00"}
                required
                type="text"
                value={selectedAmount}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">
                {isEnglish ? "Date" : "Data"}
              </span>

              <input
                className={`h-10 rounded-xl border bg-slate-950/55 px-3 text-xs text-slate-100 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isWithdrawal
                    ? "border-rose-300/20 focus:border-rose-300/55"
                    : "border-white/[0.1] focus:border-emerald-300/55"
                }`}
                defaultValue={today}
                disabled={isContributing}
                name="occurred_on"
                required
                type="date"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-300">
              {isEnglish ? "Note" : "Observação"}
              <span className="ml-1 font-normal text-slate-500">
                {isEnglish ? "(optional)" : "(opcional)"}
              </span>
            </span>

            <input
              className={`h-10 w-full rounded-xl border bg-slate-950/55 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 ${
                isWithdrawal
                  ? "border-rose-300/20 focus:border-rose-300/55"
                  : "border-white/[0.1] focus:border-emerald-300/55"
              }`}
              disabled={isContributing}
              maxLength={250}
              name="notes"
              placeholder={
                isWithdrawal
                  ? isEnglish
                    ? "Why are you withdrawing this amount?"
                    : "Por que você está resgatando este valor?"
                  : isEnglish
                    ? "e.g. Monthly savings"
                    : "Ex.: Reserva mensal"
              }
              type="text"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isWithdrawal
                  ? "bg-rose-400 text-rose-950 hover:bg-rose-300"
                  : "bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
              }`}
              disabled={isContributing}
              type="submit"
            >
              {isContributing ? (
                isEnglish ? (
                  "Saving..."
                ) : (
                  "Salvando..."
                )
              ) : isWithdrawal ? (
                <>
                  <MinusIcon />
                  {isEnglish ? "Record withdrawal" : "Registrar resgate"}
                </>
              ) : (
                <>
                  <PlusIcon />
                  {isEnglish ? "Save contribution" : "Salvar aporte"}
                </>
              )}
            </button>

            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isContributing}
              onClick={closeContributionForm}
              type="button"
            >
              {isEnglish ? "Cancel" : "Cancelar"}
            </button>
          </div>

          {contributionState.error ? (
            <p className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-3 py-2.5 text-xs leading-5 text-rose-200">
              {contributionState.error}
            </p>
          ) : null}

          {contributionState.success ? (
            <p className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2.5 text-xs leading-5 text-emerald-200">
              {contributionState.success}
            </p>
          ) : null}
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-3">
      {!isCompleted ? (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">
            {isEnglish ? "Quick contribution" : "Aporte rápido"}
          </p>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <button
                className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] px-3 text-xs font-bold text-emerald-200 transition hover:-translate-y-0.5 hover:border-emerald-300/35 hover:bg-emerald-300/[0.14]"
                key={amount}
                onClick={() => openContributionForm("contribution", String(amount))}
                type="button"
              >
                + {formatQuickAmount(amount, locale)}
              </button>
            ))}

            <button
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 text-xs font-bold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              onClick={() => openContributionForm("contribution")}
              type="button"
            >
              <PlusIcon />
              {isEnglish ? "Other amount" : "Outro valor"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
        {!isCompleted ? (
          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/[0.12]"
            onClick={() => {
              setShowWithdrawal((current) => !current)
              setIsConfirmingDelete(false)
            }}
            type="button"
          >
            <MinusIcon />
            {isEnglish ? "Withdraw" : "Resgatar"}
          </button>
        ) : null}

        <form action={completionAction}>
          <input name="locale" type="hidden" value={locale} />
          <input name="goal_id" type="hidden" value={goalId} />
          <input
            name="next_completed"
            type="hidden"
            value={isCompleted ? "false" : "true"}
          />

          <button
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUpdatingCompletion}
            type="submit"
          >
            <CheckIcon />
            {isUpdatingCompletion
              ? isEnglish
                ? "Updating..."
                : "Atualizando..."
              : isCompleted
                ? isEnglish
                  ? "Reopen goal"
                  : "Reabrir meta"
                : isEnglish
                  ? "Mark complete"
                  : "Concluir meta"}
          </button>
        </form>

        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/[0.12]"
          onClick={() => {
            setIsConfirmingDelete(true)
            setShowWithdrawal(false)
          }}
          type="button"
        >
          <TrashIcon />
          {isEnglish ? "Delete" : "Excluir"}
        </button>
      </div>

      {showWithdrawal ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-rose-100">
                {isEnglish ? "Need to use this money?" : "Precisa usar esse dinheiro?"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-rose-100/65">
                {isEnglish
                  ? "Record a withdrawal to keep your goal balance accurate."
                  : "Registre um resgate para manter o saldo da meta correto."}
              </p>
            </div>

            <button
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-rose-400 px-3 text-xs font-bold text-rose-950 transition hover:bg-rose-300"
              onClick={() => openContributionForm("withdrawal")}
              type="button"
            >
              <ArrowRightIcon />
              {isEnglish ? "Continue" : "Continuar"}
            </button>
          </div>
        </div>
      ) : null}

      {completionState.error ? (
        <p className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] px-3 py-2.5 text-xs text-rose-200">
          {completionState.error}
        </p>
      ) : null}
    </div>
  )
}