"use client";

import Link from "next/link";
import {useActionState, useState} from "react";
import {createAccount} from "@/app/[locale]/(app)/accounts/actions";

type AccountFormProps = {
  locale: string;
};

type AccountType =
  | "cash"
  | "bank"
  | "credit_card"
  | "savings"
  | "investment";

type InstitutionValue =
  | "banco_do_brasil"
  | "bradesco"
  | "btg_pactual"
  | "c6"
  | "caixa"
  | "inter"
  | "itau"
  | "mercado_pago"
  | "neon"
  | "nomad"
  | "nubank"
  | "picpay"
  | "santander"
  | "sicoob"
  | "xp"
  | "cash"
  | "other";

type Institution = {
  value: InstitutionValue;
  labelPt: string;
  labelEn: string;
  logo: string | null;
  color: string;
  type: AccountType;
};

const accountTypes: {
  value: AccountType;
  pt: string;
  en: string;
}[] = [
  {
    value: "bank",
    pt: "Conta bancária",
    en: "Bank account",
  },
  {
    value: "credit_card",
    pt: "Cartão de crédito",
    en: "Credit card",
  },
  {
    value: "savings",
    pt: "Poupança",
    en: "Savings",
  },
  {
    value: "cash",
    pt: "Carteira / Dinheiro",
    en: "Cash",
  },
  {
    value: "investment",
    pt: "Investimento",
    en: "Investment",
  },
];

const institutions: Institution[] = [
  {
    value: "banco_do_brasil",
    labelPt: "Banco do Brasil",
    labelEn: "Banco do Brasil",
    logo: "/banks/banco-do-brasil.svg",
    color: "#f5c400",
    type: "bank",
  },
  {
    value: "bradesco",
    labelPt: "Bradesco",
    labelEn: "Bradesco",
    logo: "/banks/bradesco.svg",
    color: "#cc092f",
    type: "bank",
  },
  {
    value: "btg_pactual",
    labelPt: "BTG Pactual",
    labelEn: "BTG Pactual",
    logo: "/banks/btg-pactual.svg",
    color: "#1677ff",
    type: "bank",
  },
  {
    value: "c6",
    labelPt: "C6 Bank",
    labelEn: "C6 Bank",
    logo: "/banks/c6.svg",
    color: "#d9d9d9",
    type: "bank",
  },
  {
    value: "caixa",
    labelPt: "Caixa",
    labelEn: "Caixa",
    logo: "/banks/caixa.svg",
    color: "#0875c9",
    type: "bank",
  },
  {
    value: "inter",
    labelPt: "Inter",
    labelEn: "Inter",
    logo: "/banks/inter.svg",
    color: "#ff7a00",
    type: "bank",
  },
  {
    value: "itau",
    labelPt: "Itaú",
    labelEn: "Itaú",
    logo: "/banks/itau.svg",
    color: "#ec7000",
    type: "bank",
  },
  {
    value: "mercado_pago",
    labelPt: "Mercado Pago",
    labelEn: "Mercado Pago",
    logo: "/banks/mercado-pago.svg",
    color: "#009ee3",
    type: "bank",
  },
  {
    value: "neon",
    labelPt: "Neon",
    labelEn: "Neon",
    logo: "/banks/neon.svg",
    color: "#00d9f5",
    type: "bank",
  },
  {
    value: "nomad",
    labelPt: "Nomad",
    labelEn: "Nomad",
    logo: "/banks/nomad.svg",
    color: "#f5a623",
    type: "bank",
  },
  {
    value: "nubank",
    labelPt: "Nubank",
    labelEn: "Nubank",
    logo: "/banks/nubank.svg",
    color: "#820ad1",
    type: "bank",
  },
  {
    value: "picpay",
    labelPt: "PicPay",
    labelEn: "PicPay",
    logo: "/banks/picpay.svg",
    color: "#21c25e",
    type: "bank",
  },
  {
    value: "santander",
    labelPt: "Santander",
    labelEn: "Santander",
    logo: "/banks/santander.svg",
    color: "#ec0000",
    type: "bank",
  },
  {
    value: "sicoob",
    labelPt: "Sicoob",
    labelEn: "Sicoob",
    logo: "/banks/sicoob.svg",
    color: "#008d43",
    type: "bank",
  },
  {
    value: "xp",
    labelPt: "XP Investimentos",
    labelEn: "XP Investments",
    logo: "/banks/xp.svg",
    color: "#f5a800",
    type: "investment",
  },
  {
    value: "cash",
    labelPt: "Carteira",
    labelEn: "Cash wallet",
    logo: null,
    color: "#10b981",
    type: "cash",
  },
  {
    value: "other",
    labelPt: "Outra instituição",
    labelEn: "Other institution",
    logo: null,
    color: "#64748b",
    type: "bank",
  },
];

export function AccountForm({locale}: AccountFormProps) {
  const [state, formAction, isPending] = useActionState(createAccount, {});

  const [institution, setInstitution] = useState<Institution>(
    institutions.find((item) => item.value === "nubank") ??
      institutions[0],
  );

  const [color, setColor] = useState(institution.color);
  const [accountType, setAccountType] = useState<AccountType>(
    institution.type,
  );

  const isEnglish = locale === "en";

  function handleInstitutionChange(selected: Institution) {
    setInstitution(selected);
    setColor(selected.color);
    setAccountType(selected.type);
  }

  return (
    <form
      action={formAction}
      className="app-surface rounded-[1.7rem] p-5 sm:p-6"
    >
      <input type="hidden" name="locale" value={locale} />

      <input
        type="hidden"
        name="institution"
        value={institution.value}
      />

      <div className="mb-6">
        <p className="app-kicker">
          {isEnglish ? "Account setup" : "Configuração da conta"}
        </p>

        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
          {isEnglish ? "Choose an institution" : "Escolha uma instituição"}
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
          {isEnglish
            ? "Select your bank, wallet, or investment platform."
            : "Selecione seu banco, carteira ou plataforma de investimento."}
        </p>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          {isEnglish ? "Institution" : "Instituição"}
        </legend>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {institutions.map((item) => {
            const isSelected = institution.value === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleInstitutionChange(item)}
                disabled={isPending}
                aria-pressed={isSelected}
                className={`group relative flex min-h-24 flex-col items-start justify-between overflow-hidden rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? "border-white/30 bg-white/[0.12] shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
                    : "border-white/[0.08] bg-white/[0.035] hover:border-white/[0.16] hover:bg-white/[0.07]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-5 -top-5 h-16 w-16 rounded-full opacity-20 blur-2xl"
                  style={{backgroundColor: item.color}}
                />

                <span
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl p-1.5"
                  style={{
                    backgroundColor: `${item.color}22`,
                    boxShadow: isSelected
                      ? `0 0 20px ${item.color}50`
                      : undefined,
                  }}
                >
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span
                      className="text-sm font-black"
                      style={{color: item.color}}
                    >
                      {item.value === "cash" ? "$" : "+"}
                    </span>
                  )}
                </span>

                <span className="relative mt-2 block text-xs font-semibold text-slate-200">
                  {isEnglish ? item.labelEn : item.labelPt}
                </span>

                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-black text-slate-950"
                    style={{backgroundColor: item.color}}
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Account name" : "Nome da conta"}
          </span>

          <input
            name="name"
            type="text"
            required
            maxLength={80}
            disabled={isPending}
            placeholder={
              isEnglish
                ? `e.g. ${institution.labelEn}`
                : `Ex.: ${institution.labelPt}`
            }
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Account type" : "Tipo de conta"}
          </span>

          <select
            name="type"
            value={accountType}
            onChange={(event) =>
              setAccountType(event.target.value as AccountType)
            }
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {accountTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {isEnglish ? item.en : item.pt}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Initial balance" : "Saldo inicial"}
          </span>

          <input
            name="initial_balance"
            type="text"
            inputMode="decimal"
            defaultValue="0"
            disabled={isPending}
            placeholder="0,00"
            className="h-11 w-full rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 hover:border-white/[0.16] focus:border-emerald-300/55 focus:ring-2 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {isEnglish ? "Account color" : "Cor da conta"}
          </span>

          <div className="flex h-11 items-center gap-3 rounded-xl border border-white/[0.1] bg-slate-950/45 px-3 transition hover:border-white/[0.16]">
            <input
              name="color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              disabled={isPending}
              className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              aria-label={isEnglish ? "Account color" : "Cor da conta"}
            />

            <span className="text-sm font-medium text-slate-300">
              {color.toUpperCase()}
            </span>

            <span className="ml-auto hidden text-xs text-slate-500 sm:block">
              {isEnglish ? "Customizable" : "Personalizável"}
            </span>
          </div>
        </label>
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl p-1.5"
            style={{
              backgroundColor: `${color}24`,
              boxShadow: `0 0 18px ${color}40`,
            }}
          >
            {institution.logo ? (
              <img
                src={institution.logo}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <span
                className="text-sm font-black"
                style={{color}}
              >
                {institution.value === "cash" ? "$" : "+"}
              </span>
            )}
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              {isEnglish ? "Preview" : "Prévia"}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-100">
              {isEnglish ? institution.labelEn : institution.labelPt}
            </p>
          </div>

          <span
            className="ml-auto h-3 w-3 rounded-full shadow-[0_0_14px_currentColor]"
            style={{
              backgroundColor: color,
              color,
            }}
          />
        </div>
      </div>

      {state.error ? (
        <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
          {state.error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/${locale}/accounts`}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.09] hover:text-white"
        >
          {isEnglish ? "Cancel" : "Cancelar"}
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="app-shine inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_12px_26px_rgba(16,185,129,0.18)] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? isEnglish
              ? "Saving account..."
              : "Salvando conta..."
            : isEnglish
              ? "Create account"
              : "Criar conta"}
        </button>
      </div>
    </form>
  );
}