import Link from "next/link";
import {redirect} from "next/navigation";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Landmark,
  Layers3,
  Plus,
  Tag,
  WalletCards
} from "lucide-react";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/server";

type TransactionsPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    message?: string;
  }>;
};

type Transaction = {
  id: string;
  kind: "income" | "expense" | "transfer";
  status: "paid" | "pending" | "scheduled" | "cancelled";
  amount: number | string;
  description: string;
  occurred_on: string;
  payment_method: string;
  installment_plan_id: string | null;
  installment_number: number | null;
  categories: {
    name: string;
    color: string;
  } | null;
  accounts: {
    name: string;
  } | null;
  credit_cards: {
    name: string;
    last_four: string | null;
  } | null;
  destination_accounts: {
    name: string;
  } | null;
};

type InstallmentPlan = {
  id: string;
  installments_count: number;
};

function formatCurrency(value: number, locale: "pt" | "en") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function formatDate(value: string, locale: "pt" | "en") {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function kindConfig(kind: Transaction["kind"], isEnglish: boolean) {
  if (kind === "income") {
    return {
      label: isEnglish ? "Income" : "Receita",
      icon: ArrowUpRight,
      classes: "bg-emerald-500/10 text-emerald-400",
      amountClasses: "text-emerald-400",
      prefix: "+"
    };
  }

  if (kind === "expense") {
    return {
      label: isEnglish ? "Expense" : "Despesa",
      icon: ArrowDownRight,
      classes: "bg-rose-500/10 text-rose-400",
      amountClasses: "text-rose-400",
      prefix: "-"
    };
  }

  return {
    label: isEnglish ? "Transfer" : "Transferência",
    icon: ArrowLeftRight,
    classes: "bg-sky-500/10 text-sky-400",
    amountClasses: "text-sky-400",
    prefix: ""
  };
}

function statusLabel(status: Transaction["status"], isEnglish: boolean) {
  const labels = {
    paid: isEnglish ? "Paid" : "Pago",
    pending: isEnglish ? "Pending" : "Pendente",
    scheduled: isEnglish ? "Scheduled" : "Agendado",
    cancelled: isEnglish ? "Cancelled" : "Cancelado"
  };

  return labels[status];
}

export default async function TransactionsPage({
  params,
  searchParams
}: TransactionsPageProps) {
  const {locale} = await params;
  const {message} = await searchParams;

  const safeLocale = locale === "en" ? "en" : "pt";
  const isEnglish = safeLocale === "en";

  const supabase = await createClient();

  const {
    data: {user}
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${safeLocale}/login`);
  }

  const {data: transactionsData, error: transactionsError} = await supabase
    .from("transactions")
    .select(`
      id,
      kind,
      status,
      amount,
      description,
      occurred_on,
      payment_method,
      installment_plan_id,
      installment_number,
      categories ( name, color ),
      accounts!transactions_account_id_fkey ( name ),
      credit_cards ( name, last_four ),
      destination_accounts:accounts!transactions_destination_account_id_fkey ( name )
    `)
    .eq("user_id", user.id)
    .order("occurred_on", {ascending: false})
    .order("created_at", {ascending: false});

  if (transactionsError) {
    console.error(
      "Could not load transactions:",
      transactionsError.message
    );
  }

  const transactions = (transactionsData ?? []) as unknown as Transaction[];

  const installmentPlanIds = Array.from(
    new Set(
      transactions
        .map((transaction) => transaction.installment_plan_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let installmentPlans: InstallmentPlan[] = [];

  if (installmentPlanIds.length > 0) {
    const {data: plansData, error: plansError} = await supabase
      .from("installment_plans")
      .select("id, installments_count")
      .in("id", installmentPlanIds)
      .eq("user_id", user.id);

    if (plansError) {
      console.error(
        "Could not load installment plans:",
        plansError.message
      );
    }

    installmentPlans = (plansData ?? []) as InstallmentPlan[];
  }

  const installmentCountByPlanId = new Map(
    installmentPlans.map((plan) => [plan.id, plan.installments_count])
  );

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/${safeLocale}/dashboard`}
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <WalletCards className="h-4 w-4" />
              {isEnglish ? "Back to dashboard" : "Voltar ao dashboard"}
            </Link>

            <p className="mt-5 text-sm font-medium text-emerald-400">
              {isEnglish ? "Financial history" : "Histórico financeiro"}
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {isEnglish ? "Transactions" : "Transações"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Track all money moving through your accounts and cards."
                : "Acompanhe toda movimentação de dinheiro entre suas contas e cartões."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${safeLocale}/transactions/installments/new`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-500/40 px-4 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10"
            >
              <Layers3 className="h-4 w-4" />
              {isEnglish ? "Installments" : "Parcelado"}
            </Link>

            <Link
              href={`/${safeLocale}/transactions/new`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" />
              {isEnglish ? "New transaction" : "Nova transação"}
            </Link>
          </div>
        </header>

        <Card className="mt-8 border-slate-800 bg-slate-900/70 text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {isEnglish ? "All transactions" : "Todas as transações"}
            </CardTitle>

            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
              {transactions.length}
            </span>
          </CardHeader>

          <CardContent>
            {message ? (
              <p className="mb-5 rounded-md border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}

            {transactions.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 p-8 text-center">
                <Landmark className="h-9 w-9 text-slate-600" />

                <h2 className="mt-4 text-sm font-medium text-slate-200">
                  {isEnglish ? "No transactions yet" : "Nenhuma transação ainda"}
                </h2>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {isEnglish
                    ? "Register your first income, expense, or transfer to begin building your financial history."
                    : "Registre sua primeira receita, despesa ou transferência para começar seu histórico financeiro."}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/${safeLocale}/transactions/installments/new`}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-500/40 px-4 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10"
                  >
                    <Layers3 className="h-4 w-4" />
                    {isEnglish ? "Installments" : "Compra parcelada"}
                  </Link>

                  <Link
                    href={`/${safeLocale}/transactions/new`}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-400"
                  >
                    <Plus className="h-4 w-4" />
                    {isEnglish ? "Create transaction" : "Criar transação"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 rounded-lg border border-slate-800">
                {transactions.map((transaction) => {
                  const config = kindConfig(transaction.kind, isEnglish);
                  const Icon = config.icon;

                  const installmentTotal = transaction.installment_plan_id
                    ? installmentCountByPlanId.get(
                        transaction.installment_plan_id
                      )
                    : null;

                  const installmentLabel =
                    transaction.installment_number && installmentTotal
                      ? `${transaction.installment_number}/${installmentTotal}`
                      : null;

                  const source =
                    transaction.kind === "transfer"
                      ? `${transaction.accounts?.name ?? "—"} → ${
                          transaction.destination_accounts?.name ?? "—"
                        }`
                      : transaction.credit_cards
                        ? `${transaction.credit_cards.name}${
                            transaction.credit_cards.last_four
                              ? ` · •••• ${transaction.credit_cards.last_four}`
                              : ""
                          }`
                        : transaction.accounts?.name ?? "—";

                  return (
                    <div
                      key={transaction.id}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                    >
                      <div
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          config.classes
                        ].join(" ")}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">
                            {transaction.description}
                          </p>

                          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                            {statusLabel(transaction.status, isEnglish)}
                          </span>

                          {installmentLabel ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                              <Layers3 className="h-3 w-3" />
                              {isEnglish
                                ? `Installment ${installmentLabel}`
                                : `Parcela ${installmentLabel}`}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(
                              transaction.occurred_on,
                              safeLocale
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5" />
                            {source}
                          </span>

                          {transaction.categories ? (
                            <span className="inline-flex items-center gap-1">
                              <Tag className="h-3.5 w-3.5" />

                              <span
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    transaction.categories.color
                                }}
                              />

                              {transaction.categories.name}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p
                          className={[
                            "text-sm font-semibold",
                            config.amountClasses
                          ].join(" ")}
                        >
                          {config.prefix}
                          {formatCurrency(
                            Number(transaction.amount),
                            safeLocale
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {config.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}