"use client";

import {useEffect, useState} from "react";
import {X} from "lucide-react";
import {GoalForm} from "@/components/goals/goal-form";

type CreateGoalModalProps = {
  locale: string;
};

export function GoalCreateModal({locale}: CreateGoalModalProps) {
  const [open, setOpen] = useState(false);

  const isEnglish = locale === "en";

  function closeModal() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="app-shine inline-flex h-11 items-center justify-center rounded-xl bg-violet-300 px-5 text-sm font-bold text-violet-950 shadow-[0_10px_26px_rgba(196,181,253,0.18)] transition hover:-translate-y-0.5 hover:bg-violet-200"
      >
        <span className="mr-2 text-lg leading-none">+</span>
        {isEnglish ? "Create goal" : "Criar meta"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-goal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.8rem] border border-white/10 bg-slate-950 shadow-[0_-20px_80px_rgba(0,0,0,0.45)] sm:max-h-[90dvh] sm:rounded-[1.8rem]">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                  {isEnglish ? "Financial planning" : "Planejamento financeiro"}
                </p>

                <h2
                  id="create-goal-title"
                  className="mt-1 text-xl font-semibold tracking-[-0.035em] text-white"
                >
                  {isEnglish ? "Create financial goal" : "Criar meta financeira"}
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {isEnglish
                    ? "Define a target and follow your progress."
                    : "Defina um objetivo e acompanhe seu progresso."}
                </p>
              </div>

              <button
                type="button"
                aria-label={isEnglish ? "Close modal" : "Fechar modal"}
                onClick={closeModal}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-slate-400 transition hover:bg-white/9 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <GoalForm
                locale={locale}
                onSuccess={closeModal}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}