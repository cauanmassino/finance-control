"use client";

import {useRouter, useSearchParams} from "next/navigation";

type TransactionFiltersProps = {
  locale: "pt" | "en";
  currentMonth: string;
  currentType: string;
  currentStatus: string;
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function TransactionFilters({
  locale,
  currentMonth,
  currentType,
  currentStatus
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEnglish = locale === "en";

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    const query = params.toString();

    router.push(`/${locale}/transactions${query ? `?${query}` : ""}`);
  }

  function clearFilters() {
    router.push(`/${locale}/transactions`);
  }

  const hasActiveFilters =
    currentMonth !== getCurrentMonth() ||
    currentType !== "" ||
    currentStatus !== "";

  return (
    <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-400">
              {isEnglish ? "Month" : "Mês"}
            </span>

            <input
              type="month"
              value={currentMonth}
              onChange={(event) => updateFilter("month", event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-400">
              {isEnglish ? "Type" : "Tipo"}
            </span>

            <select
              value={currentType}
              onChange={(event) => updateFilter("type", event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="">
                {isEnglish ? "All types" : "Todos os tipos"}
              </option>

              <option value="income">
                {isEnglish ? "Income" : "Receitas"}
              </option>

              <option value="expense">
                {isEnglish ? "Expense" : "Despesas"}
              </option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-400">
              {isEnglish ? "Status" : "Status"}
            </span>

            <select
              value={currentStatus}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="">
                {isEnglish ? "All statuses" : "Todos os status"}
              </option>

              <option value="paid">
                {isEnglish ? "Paid" : "Pago"}
              </option>

              <option value="pending">
                {isEnglish ? "Pending" : "Pendente"}
              </option>
            </select>
          </label>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 lg:self-auto"
          >
            {isEnglish ? "Clear filters" : "Limpar filtros"}
          </button>
        ) : null}
      </div>
    </section>
  );
}