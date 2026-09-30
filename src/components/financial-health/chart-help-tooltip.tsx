"use client";

import {useEffect, useId, useRef, useState} from "react";

type ChartHelpTooltipProps = {
  title: string;
  description: string;
  example?: string;
};

export function ChartHelpTooltip({
  title,
  description,
  example,
}: ChartHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    function closeOnOutsidePress(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative z-20 inline-flex">
      <button
        type="button"
        aria-label={`Como funciona: ${title}`}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/[0.09] text-sm font-black text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/15 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 sm:h-7 sm:w-7 sm:text-xs"
      >
        !
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label="Fechar explicação"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[90] cursor-default bg-slate-950/45 backdrop-blur-[1px] sm:hidden"
          />

          <section
            id={tooltipId}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] max-h-[min(72dvh,36rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/[0.16] bg-[#07101f] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-left shadow-[0_-12px_55px_rgba(0,0,0,0.62)] sm:absolute sm:inset-auto sm:left-0 sm:top-9 sm:max-h-none sm:w-[20rem] sm:overflow-visible sm:rounded-2xl sm:border-white/[0.16] sm:bg-[#050a18] sm:p-4 sm:shadow-[0_22px_60px_rgba(0,0,0,0.62)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold leading-5 text-slate-100">
                {title}
              </p>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/50 sm:hidden"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300 sm:mt-2 sm:text-xs sm:leading-5">
              {description}
            </p>

            {example ? (
              <p className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-2.5 text-sm leading-6 text-cyan-50 sm:mt-3 sm:text-xs sm:leading-5">
                <span className="font-bold text-cyan-200">Exemplo: </span>
                {example}
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
