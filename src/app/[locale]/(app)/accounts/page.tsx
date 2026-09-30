import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {AccountActions} from "@/components/accounts/account-actions";

export const metadata: Metadata = {
  title: "Contas",
  description: "Gerencie suas contas e acompanhe seus saldos.",
};

type AccountsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type AccountType =
  | "cash"
  | "bank"
  | "credit_card"
  | "savings"
  | "investment";

type Institution =
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

type Account = {
  id: string;
  name: string;
  type: AccountType;
  institution: Institution | null;
  color: string | null;
  initial_balance: number | string;
};

type TransactionAmount = {
  account_id: string | null;
  transfer_account_id: string | null;
  amount: number | string;
  type: "income" | "expense" | "transfer";
};

type AccountSummary = Account & {
  balance: number;
  share: number;
};

type InstitutionMeta = {
  labelPt: string;
  labelEn: string;
  logo: string | null;
  color: string;
};

const institutionMeta: Record<Institution, InstitutionMeta> = {
  banco_do_brasil: {
    labelPt: "Banco do Brasil",
    labelEn: "Banco do Brasil",
    logo: "/banks/banco-do-brasil.svg",
    color: "#f5c400",
  },
  bradesco: {
    labelPt: "Bradesco",
    labelEn: "Bradesco",
    logo: "/banks/bradesco.svg",
    color: "#cc092f",
  },
  btg_pactual: {
    labelPt: "BTG Pactual",
    labelEn: "BTG Pactual",
    logo: "/banks/btg-pactual.svg",
    color: "#1677ff",
  },
  c6: {
    labelPt: "C6 Bank",
    labelEn: "C6 Bank",
    logo: "/banks/c6.svg",
    color: "#d9d9d9",
  },
  caixa: {
    labelPt: "Caixa",
    labelEn: "Caixa",
    logo: "/banks/caixa.svg",
    color: "#0875c9",
  },
  inter: {
    labelPt: "Inter",
    labelEn: "Inter",
    logo: "/banks/inter.svg",
    color: "#ff7a00",
  },
  itau: {
    labelPt: "Itaú",
    labelEn: "Itaú",
    logo: "/banks/itau.svg",
    color: "#ec7000",
  },
  mercado_pago: {
    labelPt: "Mercado Pago",
    labelEn: "Mercado Pago",
    logo: "/banks/mercado-pago.svg",
    color: "#009ee3",
  },
  neon: {
    labelPt: "Neon",
    labelEn: "Neon",
    logo: "/banks/neon.svg",
    color: "#00d9f5",
  },
  nomad: {
    labelPt: "Nomad",
    labelEn: "Nomad",
    logo: "/banks/nomad.svg",
    color: "#f5a623",
  },
  nubank: {
    labelPt: "Nubank",
    labelEn: "Nubank",
    logo: "/banks/nubank.svg",
    color: "#820ad1",
  },
  picpay: {
    labelPt: "PicPay",
    labelEn: "PicPay",
    logo: "/banks/picpay.svg",
    color: "#21c25e",
  },
  santander: {
    labelPt: "Santander",
    labelEn: "Santander",
    logo: "/banks/santander.svg",
    color: "#ec0000",
  },
  sicoob: {
    labelPt: "Sicoob",
    labelEn: "Sicoob",
    logo: "/banks/sicoob.svg",
    color: "#008d43",
  },
  xp: {
    labelPt: "XP Investimentos",
    labelEn: "XP Investments",
    logo: "/banks/xp.svg",
    color: "#f5a800",
  },
  cash: {
    labelPt: "Carteira",
    labelEn: "Cash wallet",
    logo: null,
    color: "#10b981",
  },
  other: {
    labelPt: "Outra instituição",
    labelEn: "Other institution",
    logo: null,
    color: "#64748b",
  },
};

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function getAccountTypeLabel(type: AccountType, locale: string) {
  const labels: Record<
    AccountType,
    {
      pt: string;
      en: string;
    }
  > = {
    cash: {
      pt: "Carteira",
      en: "Cash",
    },
    bank: {
      pt: "Conta bancária",
      en: "Bank account",
    },
    credit_card: {
      pt: "Cartão de crédito",
      en: "Credit card",
    },
    savings: {
      pt: "Poupança",
      en: "Savings",
    },
    investment: {
      pt: "Investimento",
      en: "Investment",
    },
  };

  return locale === "en" ? labels[type].en : labels[type].pt;
}

function getAccountIcon(type: AccountType) {
  const icons: Record<AccountType, string> = {
    cash: "◈",
    bank: "▣",
    credit_card: "▰",
    savings: "◎",
    investment: "↗",
  };

  return icons[type];
}

function getInstitutionMeta(institution: Institution | null) {
  if (!institution) {
    return null;
  }

  return institutionMeta[institution] ?? null;
}

export default async function AccountsPage({
  params,
}: AccountsPageProps) {
  const {locale} = await params;
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [
    {data: accounts, error: accountsError},
    {data: transactions, error: transactionsError},
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, institution, color, initial_balance")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("transactions")
      .select("account_id, transfer_account_id, amount, type")
      .eq("user_id", user.id),
  ]);

  if (accountsError) {
    console.error("Erro detalhado ao carregar contas:", {
      code: accountsError.code,
      message: accountsError.message,
      details: accountsError.details,
      hint: accountsError.hint,
    });

    throw new Error("Não foi possível carregar as contas.");
  }

  if (transactionsError) {
    console.error("Erro detalhado ao carregar lançamentos das contas:", {
      code: transactionsError.code,
      message: transactionsError.message,
      details: transactionsError.details,
      hint: transactionsError.hint,
    });

    throw new Error("Não foi possível calcular os saldos das contas.");
  }

  const typedAccounts = (accounts ?? []) as Account[];
  const typedTransactions = (transactions ?? []) as TransactionAmount[];

  const accountBalances = new Map<string, number>();

  typedAccounts.forEach((account) => {
    accountBalances.set(account.id, Number(account.initial_balance));
  });

  typedTransactions.forEach((transaction) => {
    const amount = Number(transaction.amount);

    if (transaction.type === "income" && transaction.account_id) {
      const currentBalance = accountBalances.get(transaction.account_id);

      if (currentBalance !== undefined) {
        accountBalances.set(
          transaction.account_id,
          currentBalance + amount,
        );
      }

      return;
    }

    if (transaction.type === "expense" && transaction.account_id) {
      const currentBalance = accountBalances.get(transaction.account_id);

      if (currentBalance !== undefined) {
        accountBalances.set(
          transaction.account_id,
          currentBalance - amount,
        );
      }

      return;
    }

    if (transaction.type === "transfer") {
      if (transaction.account_id) {
        const sourceBalance = accountBalances.get(transaction.account_id);

        if (sourceBalance !== undefined) {
          accountBalances.set(
            transaction.account_id,
            sourceBalance - amount,
          );
        }
      }

      if (transaction.transfer_account_id) {
        const destinationBalance = accountBalances.get(
          transaction.transfer_account_id,
        );

        if (destinationBalance !== undefined) {
          accountBalances.set(
            transaction.transfer_account_id,
            destinationBalance + amount,
          );
        }
      }
    }
  });

  const totalBalance = Array.from(accountBalances.values()).reduce(
    (total, balance) => total + balance,
    0,
  );

  const accountSummaries: AccountSummary[] = typedAccounts
    .map((account) => {
      const balance =
        accountBalances.get(account.id) ?? Number(account.initial_balance);

      return {
        ...account,
        balance,
        share:
          totalBalance > 0
            ? Math.max((balance / totalBalance) * 100, 0)
            : 0,
      };
    })
    .sort((first, second) => second.balance - first.balance);

  const positiveAccounts = accountSummaries.filter(
    (account) => account.balance >= 0,
  ).length;

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-violet-950/28 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-violet-400/18 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-44 w-80 rounded-full bg-emerald-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Your structure" : "Sua estrutura"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? "Every account, in one view."
                : "Todas as contas, em uma visão."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "Track where your money is and manage every financial source with precision."
                : "Acompanhe onde está seu dinheiro e gerencie cada fonte financeira com precisão."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300">
                {typedAccounts.length}{" "}
                {isEnglish
                  ? typedAccounts.length === 1
                    ? "account"
                    : "accounts"
                  : typedAccounts.length === 1
                    ? "conta"
                    : "contas"}
              </span>

              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                {positiveAccounts}{" "}
                {isEnglish
                  ? positiveAccounts === 1
                    ? "positive balance"
                    : "positive balances"
                  : positiveAccounts === 1
                    ? "saldo positivo"
                    : "saldos positivos"}
              </span>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] xl:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                {isEnglish ? "Total balance" : "Saldo total"}
              </p>

              <p
                className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.05em] ${
                  totalBalance >= 0 ? "text-white" : "text-rose-300"
                }`}
              >
                {formatCurrency(totalBalance, locale)}
              </p>
            </div>

            <Link
              href={`/${locale}/accounts/new`}
              className="app-shine inline-flex min-h-[5.5rem] items-center justify-center rounded-2xl bg-violet-300 px-5 text-center text-sm font-bold text-violet-950 shadow-[0_16px_34px_rgba(167,139,250,0.19)] transition hover:-translate-y-0.5 hover:bg-violet-200"
            >
              <span className="mr-2 text-lg leading-none">+</span>
              {isEnglish ? "New account" : "Nova conta"}
            </Link>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Consolidated position" : "Posição consolidada"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish
                ? "Your financial base"
                : "Sua base financeira"}
            </h2>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Balances include the initial amount, income, expenses, and internal transfers."
              : "Os saldos incluem o valor inicial, receitas, despesas e transferências internas."}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {isEnglish ? "Total accounts" : "Total de contas"}
            </p>

            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {typedAccounts.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {isEnglish ? "Positive balances" : "Saldos positivos"}
            </p>

            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-emerald-200">
              {positiveAccounts}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {isEnglish ? "Current total" : "Total atual"}
            </p>

            <p
              className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] ${
                totalBalance >= 0 ? "text-slate-100" : "text-rose-300"
              }`}
            >
              {formatCurrency(totalBalance, locale)}
            </p>
          </div>
        </div>
      </section>

      {typedAccounts.length === 0 ? (
        <section className="app-surface rounded-[1.7rem] p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-violet-300/[0.1] text-2xl text-violet-200">
            ◫
          </span>

          <h2 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
            {isEnglish ? "No accounts yet" : "Nenhuma conta cadastrada"}
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Create an account to start organizing your balance, transactions, and internal transfers."
              : "Crie uma conta para começar a organizar seus saldos, lançamentos e transferências internas."}
          </p>

          <Link
            href={`/${locale}/accounts/new`}
            className="app-shine mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-violet-300 px-4 text-sm font-bold text-violet-950 shadow-[0_10px_24px_rgba(167,139,250,0.18)] transition hover:bg-violet-200"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            {isEnglish ? "Create first account" : "Criar primeira conta"}
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accountSummaries.map((account) => {
            const institution = getInstitutionMeta(account.institution);
            const color = account.color ?? institution?.color ?? "#a78bfa";
            const typeLabel = getAccountTypeLabel(account.type, locale);
            const institutionLabel = institution
              ? isEnglish
                ? institution.labelEn
                : institution.labelPt
              : null;

            return (
              <article
                key={account.id}
                className="app-surface app-surface-hover group relative overflow-hidden rounded-[1.7rem] p-5 sm:p-6"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full blur-3xl"
                  style={{
                    backgroundColor: `${color}24`,
                  }}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl p-1.5 shadow-[0_0_24px_currentColor]"
                      style={{
                        backgroundColor: `${color}1f`,
                        color,
                      }}
                    >
                      {institution?.logo ? (
                        <img
                          src={institution.logo}
                          alt={
                            institutionLabel
                              ? `${institutionLabel} logo`
                              : ""
                          }
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-lg">
                          {getAccountIcon(account.type)}
                        </span>
                      )}
                    </span>

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-100">
                        {account.name}
                      </h2>

                      <p className="mt-1 truncate text-xs font-medium text-slate-400">
                        {institutionLabel ?? typeLabel}
                      </p>
                    </div>
                  </div>

                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_14px_currentColor]"
                    style={{
                      backgroundColor: color,
                      color,
                    }}
                  />
                </div>

                <div className="relative mt-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                    {isEnglish ? "Current balance" : "Saldo atual"}
                  </p>

                  <p
                    className={`mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.06em] ${
                      account.balance >= 0
                        ? "text-slate-100"
                        : "text-rose-300"
                    }`}
                  >
                    {formatCurrency(account.balance, locale)}
                  </p>

                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${account.share}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 14px ${color}80`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {isEnglish ? "Balance share" : "Participação no saldo"}
                    </span>

                    <span className="font-semibold text-slate-300">
                      {account.share.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="relative mt-6 border-t border-white/[0.08] pt-4">
                  <AccountActions
                    locale={locale}
                    accountId={account.id}
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}