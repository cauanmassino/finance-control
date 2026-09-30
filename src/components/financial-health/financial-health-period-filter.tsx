"use client";

import {usePathname, useRouter, useSearchParams} from "next/navigation";

type PeriodValue = "3" | "6" | "12" | "all";

type FinancialHealthPeriodFilterProps = {
  locale: string;
  value: PeriodValue;
};

const periods: Array<{
  value: PeriodValue;
  labelPt: string;
  labelEn: string;
}> = [
  {
    value: "3",
    labelPt: "3 meses",
    labelEn: "3 months",
  },
  {
    value: "6",
    labelPt: "6 meses",
    labelEn: "6 months",
  },
  {
    value: "12",
    labelPt: "12 meses",
    labelEn: "12 months",
  },
  {
    value: "all",
    labelPt: "Tudo",
    labelEn: "All time",
  },
];

export function FinancialHealthPeriodFilter({
  locale,
  value,
}: FinancialHealthPeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEnglish = locale === "en";

  function handleChange(nextValue: PeriodValue) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "6") {
      params.delete("period");
    } else {
      params.set("period", nextValue);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div
      aria-label={isEnglish ? "Analysis period" : "Período de análise"}
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/35 p-1"
    >
      {periods.map((period) => {
        const isActive = period.value === value;

        return (
          <button
            key={period.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleChange(period.value)}
            className={`h-9 shrink-0 rounded-xl px-3 text-xs font-bold transition sm:px-3.5 ${
              isActive
                ? "bg-emerald-300 text-emerald-950 shadow-[0_7px_18px_rgba(52,211,153,0.18)]"
                : "text-slate-400 hover:bg-white/[0.07] hover:text-slate-100"
            }`}
          >
            {isEnglish ? period.labelEn : period.labelPt}
          </button>
        );
      })}
    </div>
  );
}
