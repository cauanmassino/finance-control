"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {createPortal} from "react-dom";
import {GoalForm} from "@/components/goals/goal-form";

type GoalCreateModalProps = {
  locale: string;
  compact?: boolean;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function GoalCreateModal({
  locale,
  compact = false,
}: GoalCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const titleId = useId();
  const descriptionId = useId();

  const isEnglish = locale === "en";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : triggerRef.current;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const getFocusableElements = () => {
      const dialog = dialogRef.current;

      if (!dialog) {
        return [];
      }

      return Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          !element.closest("[hidden], [inert]"),
      );
    };

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const firstInput =
        dialog.querySelector<HTMLInputElement>(
          'input[name="name"]',
        );

      if (firstInput && !firstInput.disabled) {
        firstInput.focus({preventScroll: true});
      } else {
        dialog.focus({preventScroll: true});
      }
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({preventScroll: true});
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      const activeElement = document.activeElement;

      const isFocusOutside =
        !activeElement || !dialog.contains(activeElement);

      if (event.shiftKey) {
        if (
          activeElement === firstElement ||
          activeElement === dialog ||
          isFocusOutside
        ) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (
        activeElement === lastElement ||
        activeElement === dialog ||
        isFocusOutside
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const dialog = dialogRef.current;
      const target = event.target;

      if (
        !dialog ||
        !(target instanceof Node) ||
        dialog.contains(target)
      ) {
        return;
      }

      const firstElement = getFocusableElements()[0];

      if (firstElement) {
        firstElement.focus({preventScroll: true});
      } else {
        dialog.focus({preventScroll: true});
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      window.cancelAnimationFrame(focusFrame);

      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);

      document.body.style.overflow = originalBodyOverflow;

      document.documentElement.style.overflow =
        originalHtmlOverflow;

      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus({preventScroll: true});
      }
    };
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
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
          <path
            d="M12 5v14M5 12h14"
            strokeLinecap="round"
          />
        </svg>

        {isEnglish ? "New goal" : "Nova meta"}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[1000] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-950/75 p-3 backdrop-blur-md sm:p-6"
              onClick={(event) => {
                event.stopPropagation();

                if (event.target === event.currentTarget) {
                  closeModal();
                }
              }}
            >
              <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.1] bg-[#0b1020] shadow-[0_32px_100px_rgba(0,0,0,0.62)] outline-none sm:max-h-[calc(100dvh-3rem)]"
              >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/[0.08] px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="app-kicker">
                      {isEnglish
                        ? "New objective"
                        : "Novo objetivo"}
                    </p>

                    <h2
                      id={titleId}
                      className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.04em] text-white"
                    >
                      {isEnglish ? "Create goal" : "Criar meta"}
                    </h2>

                    <p
                      id={descriptionId}
                      className="mt-1 text-xs leading-5 text-slate-400"
                    >
                      {isEnglish
                        ? "Define your goal and start tracking your progress."
                        : "Defina seu objetivo e comece a acompanhar seu progresso."}
                    </p>
                  </div>

                  <button
                    aria-label={isEnglish ? "Close" : "Fechar"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                    onClick={closeModal}
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
                        d="M6 6l12 12M18 6 6 18"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </header>

                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6"
                  style={{
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <GoalForm
                    locale={locale}
                    onCancel={closeModal}
                  />
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}