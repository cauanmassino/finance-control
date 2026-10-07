"use client"

import { useEffect, useState } from "react"
import { GoalForm } from "@/components/goals/goal-form"

type GoalCreateModalProps = {
  locale: string
  compact?: boolean
}

export function GoalCreateModal({
  locale,
  compact = false,
}: GoalCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isEnglish = locale === "en"

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    const originalOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <button
        aria-haspopup="dialog"
        className={
          compact
            ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.035] px-3 text-xs font-semibold text-slate-300 transition hover:border-emerald-300/25 hover:bg-emerald-300/[0.08] hover:text-emerald-100"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/[0.13]"
        }
        onClick={() => setIsOpen(true)}
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
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>

        {isEnglish ? "New goal" : "Nova meta"}
      </button>

      {isOpen ? (
        <div
          aria-labelledby="goal-create-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false)
            }
          }}
          role="dialog"
        >
          <section className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white/[0.1] bg-[#0b1020] shadow-[0_32px_100px_rgba(0,0,0,0.62)]">
            <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
              <div>
                <p className="app-kicker">
                  {isEnglish ? "New objective" : "Novo objetivo"}
                </p>

                <h2
                  className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white"
                  id="goal-create-title"
                >
                  {isEnglish ? "Create goal" : "Criar meta"}
                </h2>
              </div>

              <button
                aria-label={isEnglish ? "Close" : "Fechar"}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
                onClick={() => setIsOpen(false)}
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
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto p-4 sm:p-6">
              <GoalForm locale={locale} />
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}