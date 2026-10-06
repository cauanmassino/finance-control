"use client"

import { useRouter, useSearchParams } from "next/navigation"

type CreditCardOption = {
  id: string
  name: string
  institution: string | null
  brand: string | null
  last_four: string | null
}

type TransactionFiltersProps = {
  locale: "pt" | "en"
  currentMonth: string
  currentType: string
  currentStatus: string
  currentCreditCard: string
  cards: CreditCardOption[]
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function getCardLabel(card: CreditCardOption) {
  const details = [
    card.institution,
    card.brand,
    card.last_four ? `•••• ${card.last_four}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return details ? `${card.name} — ${details}` : card.name
}

export function TransactionFilters({
  locale,
  currentMonth,
  currentType,
  currentStatus,
  currentCreditCard,
  cards,
}: TransactionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEnglish = locale === "en"

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(name, value)
    } else {
      params.delete(name)
    }

    const query = params.toString()

    router.push(`/${locale}/transactions${query ? `?${query}` : ""}`)
  }

  function clearFilters() {
    router.push(`/${locale}/transactions`)
  }

  const hasActiveFilters =
    currentMonth !== getCurrentMonth() ||
    currentType !== "" ||
    currentStatus !== "" ||
    currentCreditCard !== ""

  return (
    <section className="mb-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-400">
              {isEnglish ? "Month" : "Mês"}
            </span>

            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              onChange={(event) => updateFilter("month", event.target.value)}
              type="month"
              value={currentMonth}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-400">
              {isEnglish ? "Type" : "Tipo"}
            </span>

            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              onChange={(event) => updateFilter("type", event.target.value)}
              value={currentType}
            >
              <option className="bg-slate-950 text-white" value="">
                {isEnglish ? "All types" : "Todos os tipos"}
              </option>

              <option className="bg-slate-950 text-white" value="income">
                {isEnglish ? "Income" : "Receitas"}
              </option>

              <option className="bg-slate-950 text-white" value="expense">
                {isEnglish ? "Expense" : "Despesas"}
              </option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-400">
              {isEnglish ? "Status" : "Status"}
            </span>

            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              onChange={(event) => updateFilter("status", event.target.value)}
              value={currentStatus}
            >
              <option className="bg-slate-950 text-white" value="">
                {isEnglish ? "All statuses" : "Todos os status"}
              </option>

              <option className="bg-slate-950 text-white" value="paid">
                {isEnglish ? "Paid" : "Pago"}
              </option>

              <option className="bg-slate-950 text-white" value="pending">
                {isEnglish ? "Pending" : "Pendente"}
              </option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-400">
              {isEnglish ? "Credit card used" : "Cartão de crédito usado"}
            </span>

            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              onChange={(event) =>
                updateFilter("credit_card", event.target.value)
              }
              value={currentCreditCard}
            >
              <option className="bg-slate-950 text-white" value="">
                {isEnglish
                  ? "All credit cards"
                  : "Todos os cartões de crédito"}
              </option>

              {cards.map((card) => (
                <option
                  className="bg-slate-950 text-white"
                  key={card.id}
                  value={card.id}
                >
                  {getCardLabel(card)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters ? (
          <button
            className="self-start rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 lg:self-auto"
            onClick={clearFilters}
            type="button"
          >
            {isEnglish ? "Clear filters" : "Limpar filtros"}
          </button>
        ) : null}
      </div>
    </section>
  )
}