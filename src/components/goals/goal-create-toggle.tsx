"use client"

import { useState } from "react"
import { GoalForm } from "@/components/goals/goal-form"

type GoalCreateToggleProps = {
  locale: string
}

export function GoalCreateToggle({
  locale,
}: GoalCreateToggleProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const isEnglish = locale === "en"

  if (!isFormOpen) {
    return (
      <article className="app-surface flex min-h-[15rem] flex-col justify-between rounded-[1.7rem] p-5 sm:p-6">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.1] text-emerald-200">
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M12 20V10M18 20V4M6 20v-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <p className="app-kicker mt-5">
            {isEnglish ? "New objective" : "Novo objetivo"}
          </p>

          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
            {isEnglish ? "Plan your next goal" : "Planeje sua próxima meta"}
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Set a destination for your money and follow your progress with clarity."
              : "Defina um destino para seu dinheiro e acompanhe sua evolução com clareza."}
          </p>
        </div>

        <button
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 text-sm font-bold text-slate-950 shadow-[0_12px_30px_rgba(52,211,153,0.18)] transition hover:brightness-105 active:scale-[0.99]"
          onClick={() => setIsFormOpen(true)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>

          {isEnglish ? "Create goal" : "Criar meta"}
        </button>
      </article>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {isEnglish ? "New objective" : "Novo objetivo"}
        </p>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white"
          onClick={() => setIsFormOpen(false)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="m15 18-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {isEnglish ? "Cancel" : "Cancelar"}
        </button>
      </div>

      <GoalForm locale={locale} />
    </div>
  )
}