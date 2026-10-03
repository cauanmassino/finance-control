import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    locale: string;
    cardId: string;
    statementId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

type StatementStatus = "open" | "closed" | "paid" | "overdue";

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "pt-BR", {
    style: "currency",
    currency: locale === "en" ? "USD" : "BRL",
  }).format(value);
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getStatusLabel(status: StatementStatus, isEnglish: boolean) {
  const labels = {
    open: isEnglish ? "Open" : "Aberta",
    closed: isEnglish ? "Closed" : "Fechada",
    paid: isEnglish ? "Paid" : "Paga",
    overdue: isEnglish ? "Overdue" : "Vencida",
  };

  return labels[status];
}

function getStatusClass(status: StatementStatus) {
  if (status === "paid") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  }

  if (status === "overdue") {
    return "border-rose-300/20 bg-rose-300/10 text-rose-200";
  }

  if (status === "closed") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }

  return "border-sky-300/20 bg-sky-300/10 text-sky-100";
}

export default async function StatementPage({
  params,
  searchParams,
}: PageProps) {
  const {
    locale: requestedLocale,
    cardId,
    statementId,
  } = await params;

  const {
    message: successMessage,
    error: errorMessage,
  } = await searchParams;

  const locale = requestedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

const [
  {data: statement, error: statementError},
  {data: transactions, error: transactionsError},
  {data: accounts, error: accountsError},
] = await Promise.all([
  supabase
    .from("credit_card_statements")
    .select(`
      id,
      credit_card_id,
      closing_date,
      due_date,
      status,
      total_amount,
      paid_amount
    `)
    .eq("id", statementId)
    .eq("user_id", user.id)
    .single(),

    supabase
      .from("transactions")
      .select(`
        id,
        type,
        amount,
        description,
        occurred_on,
        category_id,
        account_id
      `)
      .eq("credit_card_statement_id", statementId)
      .eq("type", "expense")
      .order("occurred_on", {ascending: false}),

    supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),
  ]);

  if (statementError || !statement) {
    throw new Error(
      isEnglish ? "Statement not found." : "Fatura não encontrada.",
    );
  }

  if (transactionsError) {
    throw new Error(
      isEnglish
        ? "Could not load statement transactions."
        : "Não foi possível carregar as compras da fatura.",
    );
  }

  if (accountsError) {
    throw new Error(
      isEnglish
        ? "Could not load accounts."
        : "Não foi possível carregar as contas.",
    );
  }

  const totalAmount = Number(statement.total_amount ?? 0);
  const paidAmount = Number(statement.paid_amount ?? 0);
  const outstanding = Math.max(totalAmount - paidAmount, 0);

  const statementIsPaid =
    statement.status === "paid" || outstanding <= 0;

  const statementPageHref =
    `/${locale}/cards/${cardId}/statements/${statementId}`;

  const paymentRouteHref =
    `${statementPageHref}/pay`;

  return (
    <main className="mx-auto max-w-5xl space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/20 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.24)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="app-kicker">
              {isEnglish ? "Credit card statement" : "Fatura do cartão"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">
              {isEnglish ? "Statement details" : "Detalhes da fatura"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "View purchases, pending balance, and statement payment details."
                : "Veja compras, saldo pendente e os detalhes do pagamento da fatura."}
            </p>
          </div>

          <Link
            href={`/${locale}/cards/${cardId}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-4 text-xs font-bold text-slate-200 transition hover:bg-white/[0.1] hover:text-white"
          >
            ← {isEnglish ? "Back to card" : "Voltar ao cartão"}
          </Link>
        </div>
      </section>

      {successMessage ? (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
          {successMessage}
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="app-surface rounded-[1.7rem] p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">
              {isEnglish ? "Purchases" : "Compras"}
            </h2>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClass(
                statement.status as StatementStatus,
              )}`}
            >
              {getStatusLabel(
                statement.status as StatementStatus,
                isEnglish,
              )}
            </span>
          </div>

          {(transactions ?? []).length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              {isEnglish
                ? "No purchases in this statement yet."
                : "Nenhuma compra nesta fatura ainda."}
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-white/[0.06]">
              {(transactions ?? []).map((transaction) => (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {transaction.description}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {formatDate(transaction.occurred_on, locale)}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-slate-100">
                    {formatCurrency(Number(transaction.amount), locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <aside className="space-y-5">
          <div className="app-surface rounded-[1.7rem] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">
              {isEnglish ? "Summary" : "Resumo"}
            </h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">
                  {isEnglish ? "Total" : "Total"}
                </dt>

                <dd className="text-base font-semibold text-slate-100">
                  {formatCurrency(totalAmount, locale)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">
                  {isEnglish ? "Paid" : "Pago"}
                </dt>

                <dd className="text-base font-semibold text-emerald-200">
                  {formatCurrency(paidAmount, locale)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                <dt className="text-slate-400">
                  {isEnglish ? "Outstanding" : "Pendente"}
                </dt>

                <dd
                  className={`text-base font-semibold ${
                    statementIsPaid
                      ? "text-emerald-200"
                      : "text-slate-100"
                  }`}
                >
                  {formatCurrency(outstanding, locale)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-xs text-slate-400">
              <p>
                {isEnglish
                  ? `Closes ${formatDate(
                      statement.closing_date,
                      locale,
                    )} · Due ${formatDate(statement.due_date, locale)}`
                  : `Fecha em ${formatDate(
                      statement.closing_date,
                      locale,
                    )} · Vence em ${formatDate(statement.due_date, locale)}`}
              </p>
            </div>
          </div>

          <div className="app-surface rounded-[1.7rem] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">
              {isEnglish ? "Pay statement" : "Pagar fatura"}
            </h2>

            {statementIsPaid ? (
              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="text-sm font-semibold text-emerald-100">
                  {isEnglish ? "This statement is paid." : "Esta fatura está paga."}
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-100/70">
                  {isEnglish
                    ? "The amount has already been debited from the selected payment account."
                    : "O valor já foi debitado da conta selecionada para pagamento."}
                </p>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {isEnglish
                    ? "Select the account that will be debited to pay the outstanding amount."
                    : "Selecione a conta que será debitada para pagar o valor pendente."}
                </p>

                <form
                  action={paymentRouteHref}
                  method="post"
                  className="mt-4 space-y-4"
                >
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-300">
                      {isEnglish ? "Payment account" : "Conta de pagamento"}
                    </span>

                    <select
                      name="account_id"
                      required
                      defaultValue=""
                      className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
                    >
                      <option value="" disabled>
                        {isEnglish ? "Select account" : "Selecione a conta"}
                      </option>

                      {(accounts ?? []).map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs text-slate-400">
                    {isEnglish
                      ? `The selected account will be debited by ${formatCurrency(
                          outstanding,
                          locale,
                        )}. This payment does not create a new expense because the card purchase was already recorded.`
                      : `A conta selecionada será debitada em ${formatCurrency(
                          outstanding,
                          locale,
                        )}. Este pagamento não gera uma nova despesa porque a compra no cartão já foi registrada.`}
                  </div>

                  <button
                    type="submit"
                    className="app-shine inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_10px_26px_rgba(52,211,153,0.16)] transition hover:bg-emerald-200"
                  >
                    {isEnglish
                      ? `Pay ${formatCurrency(outstanding, locale)}`
                      : `Pagar ${formatCurrency(outstanding, locale)}`}
                  </button>
                </form>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}