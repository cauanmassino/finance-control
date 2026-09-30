import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {TransferActions} from "@/components/transfers/transfer-actions";

export const metadata: Metadata = {
  title: "Transferências",
  description: "Movimente valores entre suas contas.",
};

type TransfersPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type AccountRelation = {
  name: string;
  color: string | null;
};

type TransferQueryRow = {
  id: string;
  transfer_id: string;
  description: string;
  amount: number | string;
  occurred_on: string;
  from_account: AccountRelation[] | AccountRelation | null;
  to_account: AccountRelation[] | AccountRelation | null;
};

type TransferRow = {
  id: string;
  transfer_id: string;
  description: string;
  amount: number;
  occurred_on: string;
  from_account_name: string | null;
  from_account_color: string | null;
  to_account_name: string | null;
  to_account_color: string | null;
};

function getAccount(
  relation: AccountRelation[] | AccountRelation | null | undefined,
): AccountRelation | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default async function TransfersPage({
  params,
}: TransfersPageProps) {
  const {locale} = await params;
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data, error} = await supabase
    .from("transactions")
    .select(`
      id,
      transfer_id,
      description,
      amount,
      occurred_on,
      from_account:accounts!transactions_account_id_fkey(name, color),
      to_account:accounts!transactions_transfer_account_id_fkey(name, color)
    `)
    .eq("user_id", user.id)
    .eq("type", "transfer")
    .not("transfer_id", "is", null)
    .order("occurred_on", {ascending: false})
    .order("created_at", {ascending: false});

  if (error) {
    console.error("Erro ao carregar transferências:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  const transfers = (data ?? []) as unknown as TransferQueryRow[];
  const groupedTransfers = new Map<string, TransferRow>();

  transfers.forEach((transaction) => {
    if (!transaction.transfer_id) {
      return;
    }

    if (groupedTransfers.has(transaction.transfer_id)) {
      return;
    }

    const fromAccount = getAccount(transaction.from_account);
    const toAccount = getAccount(transaction.to_account);

    groupedTransfers.set(transaction.transfer_id, {
      id: transaction.id,
      transfer_id: transaction.transfer_id,
      description: transaction.description,
      amount: Number(transaction.amount),
      occurred_on: transaction.occurred_on,
      from_account_name: fromAccount?.name ?? null,
      from_account_color: fromAccount?.color ?? null,
      to_account_name: toAccount?.name ?? null,
      to_account_color: toAccount?.color ?? null,
    });
  });

  const rows = Array.from(groupedTransfers.values());

  const totalTransferred = rows.reduce(
    (total, transfer) => total + transfer.amount,
    0,
  );

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/74 to-sky-950/30 px-5 py-6 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-sky-400/18 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-44 w-80 rounded-full bg-indigo-400/12 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Internal movement" : "Movimentação interna"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish
                ? "Move money with clarity."
                : "Mova dinheiro com clareza."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "Transfer funds between your accounts without affecting income or expenses."
                : "Transfira valores entre suas contas sem afetar receitas ou despesas."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-300">
                {rows.length}{" "}
                {isEnglish
                  ? rows.length === 1
                    ? "transfer"
                    : "transfers"
                  : rows.length === 1
                    ? "transferência"
                    : "transferências"}
              </span>

              <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold text-sky-100">
                {isEnglish ? "No impact on result" : "Sem impacto no resultado"}
              </span>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] xl:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                {isEnglish ? "Transferred total" : "Total transferido"}
              </p>

              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.05em] text-sky-100">
                {formatCurrency(totalTransferred, locale)}
              </p>
            </div>

            <Link
              href={`/${locale}/transfers/new`}
              className="app-shine inline-flex min-h-[5.5rem] items-center justify-center rounded-2xl bg-sky-300 px-5 text-center text-sm font-bold text-sky-950 shadow-[0_16px_34px_rgba(56,189,248,0.2)] transition hover:-translate-y-0.5 hover:bg-sky-200"
            >
              <span className="mr-2 text-lg">⇄</span>
              {isEnglish ? "New transfer" : "Nova transferência"}
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {isEnglish
            ? "Transfers could not be loaded. Please refresh and try again."
            : "Não foi possível carregar as transferências. Atualize a página e tente novamente."}
        </section>
      ) : null}

      <section className="app-surface overflow-hidden rounded-[1.7rem]">
        <div className="flex flex-col gap-3 border-b border-white/[0.08] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Transfer history" : "Histórico de transferências"}
            </p>

            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[-0.045em] text-white">
              {isEnglish ? "Account movements" : "Movimentações entre contas"}
            </h2>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/[0.07] px-3 py-1.5 text-xs font-semibold text-sky-100">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.9)]" />
            {isEnglish
              ? "Transfers are grouped automatically"
              : "Transferências agrupadas automaticamente"}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 text-center sm:p-12">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-sky-300/[0.08] text-2xl text-sky-200">
              ⇄
            </span>

            <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.035em] text-white">
              {isEnglish
                ? "No transfers yet"
                : "Nenhuma transferência ainda"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Move money between your accounts while keeping your income and expense analysis accurate."
                : "Mova dinheiro entre suas contas mantendo suas análises de receitas e despesas precisas."}
            </p>

            <Link
              href={`/${locale}/transfers/new`}
              className="app-shine mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-sky-300 px-4 text-sm font-bold text-sky-950 shadow-[0_10px_24px_rgba(56,189,248,0.18)] transition hover:bg-sky-200"
            >
              <span className="mr-2 text-lg">⇄</span>
              {isEnglish ? "Create transfer" : "Criar transferência"}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {rows.map((row) => {
              const fromColor = row.from_account_color ?? "#fda4af";
              const toColor = row.to_account_color ?? "#7dd3fc";

              return (
                <article
                  key={row.transfer_id}
                  className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-white/[0.025] sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3.5">
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-300/[0.12] text-xl text-sky-200 transition-transform duration-200 group-hover:scale-105">
                      ⇄
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100 sm:text-base">
                        {row.description}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
                        <span
                          className="inline-flex items-center gap-1.5 font-medium"
                          style={{color: fromColor}}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: fromColor,
                              boxShadow: `0 0 12px ${fromColor}80`,
                            }}
                          />
                          {row.from_account_name ??
                            (isEnglish ? "Origin account" : "Conta de origem")}
                        </span>

                        <span
                          aria-hidden="true"
                          className="text-sm text-slate-500"
                        >
                          →
                        </span>

                        <span
                          className="inline-flex items-center gap-1.5 font-medium"
                          style={{color: toColor}}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: toColor,
                              boxShadow: `0 0 12px ${toColor}80`,
                            }}
                          />
                          {row.to_account_name ??
                            (isEnglish
                              ? "Destination account"
                              : "Conta de destino")}
                        </span>

                        <span
                          aria-hidden="true"
                          className="text-slate-600"
                        >
                          ·
                        </span>

                        <span className="text-slate-400">
                          {formatDate(row.occurred_on, locale)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                    <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.035em] text-sky-200">
                      ⇄ {formatCurrency(row.amount, locale)}
                    </p>

                    <div className="opacity-100 transition-opacity lg:opacity-75 lg:group-hover:opacity-100">
                      <TransferActions
                        locale={locale}
                        transferId={row.transfer_id}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}