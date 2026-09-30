"use client";

import {useActionState, useMemo, useState} from "react";
import {
  finishOnboarding,
  type OnboardingState,
} from "./actions";

type OnboardingFormProps = {
  locale: "pt" | "en";
  fullName: string | null;
  defaultCurrency: "BRL" | "USD" | "EUR";
};

const initialState: OnboardingState = {};

export function OnboardingForm({
  locale,
  fullName,
  defaultCurrency,
}: OnboardingFormProps) {
  const isEnglish = locale === "en";

  const [currency, setCurrency] = useState(defaultCurrency);
  const [accountType, setAccountType] = useState<
    "bank" | "cash" | "savings" | "investment"
  >("bank");

  const [state, formAction, isPending] = useActionState(
    finishOnboarding,
    initialState,
  );

  const currencySymbol = useMemo(() => {
    if (currency === "USD") {
      return "$";
    }

    if (currency === "EUR") {
      return "€";
    }

    return "R$";
  }, [currency]);

  const accountTypes = [
    {
      value: "bank",
      icon: "▣",
      pt: "Conta bancária",
      en: "Bank account",
    },
    {
      value: "cash",
      icon: "◈",
      pt: "Carteira",
      en: "Cash wallet",
    },
    {
      value: "savings",
      icon: "◎",
      pt: "Poupança",
      en: "Savings",
    },
    {
      value: "investment",
      icon: "↗",
      pt: "Investimento",
      en: "Investment",
    },
  ] as const;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-80 rounded-full bg-cyan-500/10 blur-3xl"
        />

        <div className="relative grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="app-kicker">
              {isEnglish ? "First setup" : "Primeira configuração"}
            </p>

            <h1 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? `Let's give your money a starting point${fullName ? `, ${fullName.split(" ")[0]}` : ""}.`
                : `Vamos dar um ponto de partida ao seu dinheiro${fullName ? `, ${fullName.split(" ")[0]}` : ""}.`}
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "Add one account and its current balance. You can add more accounts, cards, transactions, and budgets later."
                : "Adicione uma conta e o saldo atual dela. Depois você poderá incluir outras contas, cartões, lançamentos e orçamentos."}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-4">
                <span className="text-lg text-emerald-200">1</span>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {isEnglish ? "Choose your currency" : "Escolha sua moeda"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-4">
                <span className="text-lg text-emerald-200">2</span>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {isEnglish ? "Add your first account" : "Adicione sua primeira conta"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.09] bg-white/[0.04] p-4">
                <span className="text-lg text-emerald-200">3</span>
                <p className="mt-2 text-sm font-semibold text-slate-100">
                  {isEnglish ? "See your overview" : "Veja seu resumo"}
                </p>
              </div>
            </div>
          </div>

          <form
            action={formAction}
            className="rounded-[1.7rem] border border-white/[0.11] bg-slate-950/45 p-5 backdrop-blur sm:p-7"
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="currency_code" value={currency} />
            <input type="hidden" name="account_type" value={accountType} />

            <div>
              <p className="text-sm font-semibold text-emerald-200">
                {isEnglish ? "Set up your first account" : "Configure sua primeira conta"}
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
                {isEnglish ? "Where is your money today?" : "Onde está seu dinheiro hoje?"}
              </h2>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-slate-200">
                {isEnglish ? "Currency" : "Moeda"}
              </legend>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  {code: "BRL", label: "Real", symbol: "R$"},
                  {code: "USD", label: "Dollar", symbol: "$"},
                  {code: "EUR", label: "Euro", symbol: "€"},
                ].map((item) => {
                  const isSelected = currency === item.code;

                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() =>
                        setCurrency(item.code as "BRL" | "USD" | "EUR")
                      }
                      className={`rounded-xl border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                          : "border-white/10 bg-white/[0.035] text-slate-400 hover:border-white/20 hover:bg-white/[0.065]"
                      }`}
                    >
                      <span className="block text-sm font-bold">{item.symbol}</span>
                      <span className="mt-0.5 block text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6">
              <label
                htmlFor="account_name"
                className="text-sm font-semibold text-slate-200"
              >
                {isEnglish ? "Account name" : "Nome da conta"}
              </label>

              <input
                id="account_name"
                name="account_name"
                required
                maxLength={80}
                autoComplete="off"
                disabled={isPending}
                placeholder={
                  isEnglish
                    ? "e.g. Main checking account"
                    : "Ex.: Conta principal"
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-slate-200">
                {isEnglish ? "Account type" : "Tipo de conta"}
              </legend>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {accountTypes.map((item) => {
                  const isSelected = accountType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setAccountType(item.value)}
                      disabled={isPending}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${
                        isSelected
                          ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                          : "border-white/10 bg-white/[0.035] text-slate-400 hover:border-white/20 hover:bg-white/[0.065]"
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.07] text-base">
                        {item.icon}
                      </span>

                      {isEnglish ? item.en : item.pt}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6">
              <label
                htmlFor="initial_balance"
                className="text-sm font-semibold text-slate-200"
              >
                {isEnglish ? "Current balance" : "Saldo atual"}
              </label>

              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-semibold text-slate-400">
                  {currencySymbol}
                </span>

                <input
                  id="initial_balance"
                  name="initial_balance"
                  inputMode="decimal"
                  defaultValue="0"
                  disabled={isPending}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {isEnglish
                  ? "Use a negative amount if this account currently has a negative balance."
                  : "Use um valor negativo se esta conta estiver com saldo negativo."}
              </p>
            </div>

            {state.error ? (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-100"
              >
                {state.error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isPending}
              className="app-shine mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-emerald-950 shadow-[0_12px_28px_rgba(52,211,153,0.2)] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? isEnglish
                  ? "Preparing your overview..."
                  : "Preparando seu resumo..."
                : isEnglish
                  ? "Finish setup"
                  : "Concluir configuração"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              {isEnglish
                ? "You can update these details anytime from Accounts."
                : "Você poderá alterar estes dados a qualquer momento em Contas."}
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}