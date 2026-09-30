"use client";

import {useActionState, useState} from "react";
import {
  type GoalState,
  createGoal,
} from "@/app/[locale]/(app)/goals/actions";
import {CategoryIcon} from "@/components/categories/category-icon";

type GoalIcon = {
  value: string;
  label: string;
};

const goalIcons: GoalIcon[] = [
  {value: "wallet", label: "Carteira"},
  {value: "landmark", label: "Reserva"},
  {value: "plane", label: "Viagem"},
  {value: "house", label: "Casa"},
  {value: "car", label: "Carro"},
  {value: "graduation", label: "Educação"},
  {value: "heart-pulse", label: "Saúde"},
  {value: "gift", label: "Presente"},
  {value: "rocket", label: "Projeto"},
  {value: "sparkles", label: "Outro"},
];

type GoalFormProps = {
  locale: string;
};

const initialState: GoalState = {
  error: undefined,
};

export function GoalForm({locale}: GoalFormProps) {
  const [state, formAction, isPending] = useActionState(
    createGoal,
    initialState,
  );

  const [icon, setIcon] = useState("wallet");
  const isEnglish = locale === "en";

  return (
    <form
      action={formAction}
      className="app-surface rounded-[1.7rem] p-5 sm:p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="icon" value={icon} />

      <div>
        <p className="app-kicker">
          {isEnglish ? "Future planning" : "Planejamento do futuro"}
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
          {isEnglish ? "Create a financial goal" : "Criar meta financeira"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isEnglish
            ? "Turn a financial objective into visible progress."
            : "Transforme um objetivo financeiro em progresso visível."}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Goal name" : "Nome da meta"}
          </span>

          <input
            name="name"
            type="text"
            required
            maxLength={100}
            disabled={isPending}
            placeholder={isEnglish ? "e.g. Emergency fund" : "Ex.: Reserva de emergência"}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-violet-300/55 focus:ring-2 focus:ring-violet-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Target amount" : "Valor alvo"}
            </span>

            <input
              name="target_amount"
              type="text"
              inputMode="decimal"
              required
              disabled={isPending}
              placeholder={isEnglish ? "e.g. 5000.00" : "Ex.: 5.000,00"}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-violet-300/55 focus:ring-2 focus:ring-violet-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {isEnglish ? "Already saved" : "Já guardado"}
            </span>

            <input
              name="current_amount"
              type="text"
              inputMode="decimal"
              defaultValue="0"
              disabled={isPending}
              placeholder={isEnglish ? "e.g. 500.00" : "Ex.: 500,00"}
              className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-violet-300/55 focus:ring-2 focus:ring-violet-300/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Target date (optional)" : "Data desejada (opcional)"}
          </span>

          <input
            name="target_date"
            type="date"
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none hover:border-white/[0.16] focus:border-violet-300/55 focus:ring-2 focus:ring-violet-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <div className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Goal icon" : "Ícone da meta"}
          </span>

          <div className="grid grid-cols-5 gap-2">
            {goalIcons.map((goalIcon) => {
              const isSelected = icon === goalIcon.value;

              return (
                <button
                  key={goalIcon.value}
                  type="button"
                  disabled={isPending}
                  title={goalIcon.label}
                  aria-label={goalIcon.label}
                  aria-pressed={isSelected}
                  onClick={() => setIcon(goalIcon.value)}
                  className={`flex h-11 items-center justify-center rounded-xl border transition ${
                    isSelected
                      ? "border-violet-300/50 bg-violet-300/15 text-violet-100"
                      : "border-white/[0.08] bg-white/[0.035] text-slate-400 hover:border-white/[0.14] hover:bg-white/[0.08] hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <CategoryIcon
                    name={goalIcon.value}
                    size={20}
                    strokeWidth={1.9}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Color" : "Cor"}
          </span>

          <div className="flex h-11 items-center gap-3 rounded-xl border border-white/[0.1] bg-slate-950/45 px-3">
            <input
              name="color"
              type="color"
              defaultValue="#a78bfa"
              disabled={isPending}
              className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              aria-label={isEnglish ? "Goal color" : "Cor da meta"}
            />

            <span className="text-sm text-slate-500">
              {isEnglish
                ? "Choose a color to identify this goal."
                : "Escolha uma cor para identificar esta meta."}
            </span>
          </div>
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
            placeholder={isEnglish ? "Why is this goal important?" : "Por que esta meta é importante?"}
            className="w-full resize-none rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/[0.16] focus:border-violet-300/55 focus:ring-2 focus:ring-violet-300/10 disabled:cursor-not-allowed disabled:opacity-60"
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
        className="app-shine mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-violet-300 px-4 text-sm font-bold text-violet-950 shadow-[0_10px_24px_rgba(167,139,250,0.18)] transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? isEnglish
            ? "Creating goal..."
            : "Criando meta..."
          : isEnglish
            ? "Create goal"
            : "Criar meta"}
      </button>
    </form>
  );
}