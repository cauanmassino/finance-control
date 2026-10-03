import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{locale: string}>;
};

type CreditCard = {
  id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  last_four: string | null;
  credit_limit: number | string | null;
  closing_day: number;
  due_day: number;
  color: string;
  is_active: boolean;
};

type Statement = {
  id: string;
  credit_card_id: string;
  due_date: string;
  closing_date: string;
  status: "open" | "closed" | "paid" | "overdue";
  total_amount: number | string;
  paid_amount: number | string;
};

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

function getStatusLabel(
  status: Statement["status"] | null,
  isEnglish: boolean,
) {
  const labels = {
    open: isEnglish ? "Open" : "Aberta",
    closed: isEnglish ? "Closed" : "Fechada",
    paid: isEnglish ? "Paid" : "Paga",
    overdue: isEnglish ? "Overdue" : "Vencida",
  };

  return status ? labels[status] : isEnglish ? "No statement" : "Sem fatura";
}

function getStatusClass(status: Statement["status"] | null) {
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

export default async function CardsPage({params}: PageProps) {
  const {locale: requestedLocale} = await params;
  const locale = requestedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [{data: cards, error: cardsError}, {data: statements, error: statementsError}] =
    await Promise.all([
      supabase
        .from("credit_cards")
        .select(`
          id,
          name,
          institution,
          brand,
          last_four,
          credit_limit,
          closing_day,
          due_day,
          color,
          is_active
        `)
        .eq("user_id", user.id)
        .order("is_active", {ascending: false})
        .order("name", {ascending: true}),
      supabase
        .from("credit_card_statements")
        .select(`
          id,
          credit_card_id,
          due_date,
          closing_date,
          status,
          total_amount,
          paid_amount
        `)
        .eq("user_id", user.id)
        .in("status", ["open", "closed", "overdue"])
        .order("closing_date", {ascending: false}),
    ]);

  if (cardsError) {
    console.error("Erro ao carregar cartões:", cardsError);
    throw new Error(
      isEnglish
        ? "Could not load your credit cards."
        : "Não foi possível carregar seus cartões.",
    );
  }

  // Se der erro em statements, apenas loga e segue sem faturas
  if (statementsError) {
    console.error("Erro ao carregar faturas (ignorado):", statementsError);
  }

  const typedCards = (cards ?? []) as CreditCard[];
  const typedStatements = (statements ?? []) as Statement[];

  const statementByCardId = new Map<string, Statement>();

  for (const statement of typedStatements) {
    if (!statementByCardId.has(statement.credit_card_id)) {
      statementByCardId.set(statement.credit_card_id, statement);
    }
  }

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/20 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.24)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Credit management" : "Gestão de crédito"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">
              {isEnglish ? "Your credit cards" : "Seus cartões de crédito"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "Track limits, closing dates, due dates, and each card's open statement."
                : "Acompanhe limites, dias de fechamento, vencimentos e a fatura aberta de cada cartão."}
            </p>
          </div>

          <Link
            href={`/${locale}/cards/new`}
            className="app-shine inline-flex h-11 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_10px_26px_rgba(52,211,153,0.16)] transition hover:bg-emerald-200"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            {isEnglish ? "Add card" : "Adicionar cartão"}
          </Link>
        </div>
      </section>

      {typedCards.length === 0 ? (
        <section className="rounded-[1.7rem] border border-dashed border-white/15 bg-white/[0.025] p-8 text-center sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-200">
            ▣
          </span>

          <h2 className="mt-5 text-lg font-semibold text-slate-100">
            {isEnglish
              ? "No credit cards registered"
              : "Nenhum cartão cadastrado"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Create your first card to track its limit, statement closing day, due date, and purchases."
              : "Crie seu primeiro cartão para acompanhar limite, fechamento, vencimento e compras."}
          </p>

          <Link
            href={`/${locale}/cards/new`}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200"
          >
            {isEnglish ? "Create card" : "Criar cartão"}
          </Link>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {typedCards.map((card) => {
            const statement = statementByCardId.get(card.id) ?? null;

            const creditLimit = Number(card.credit_limit ?? 0);
            const totalAmount = Number(statement?.total_amount ?? 0);
            const paidAmount = Number(statement?.paid_amount ?? 0);
            const outstanding = Math.max(totalAmount - paidAmount, 0);
            const available = Math.max(creditLimit - outstanding, 0);
            const usedPercentage =
              creditLimit > 0
                ? Math.min((outstanding / creditLimit) * 100, 100)
                : 0;

            return (
              <article
                key={card.id}
                className="app-surface overflow-hidden rounded-[1.7rem] p-5 sm:p-6"
              >
                <div
                  className="h-1.5 rounded-full"
                  style={{backgroundColor: card.color}}
                />

                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">
                      {card.name}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-400">
                      {[card.institution, card.brand, card.last_four ? `•••• ${card.last_four}` : null]
                        .filter(Boolean)
                        .join(" · ") ||
                        (isEnglish ? "Credit card" : "Cartão de crédito")}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
                      card.is_active
                        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                        : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                    }`}
                  >
                    {card.is_active
                      ? isEnglish
                        ? "Active"
                        : "Ativo"
                      : isEnglish
                        ? "Inactive"
                        : "Inativo"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      {isEnglish ? "Available" : "Disponível"}
                    </p>

                    <p className="mt-2 text-lg font-semibold text-emerald-200">
                      {formatCurrency(available, locale)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      {isEnglish ? "Limit" : "Limite"}
                    </p>

                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      {formatCurrency(creditLimit, locale)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-400">
                      {isEnglish ? "Statement usage" : "Uso da fatura"}
                    </span>

                    <span className="font-semibold text-slate-200">
                      {usedPercentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${usedPercentage}%`,
                        backgroundColor: card.color,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">
                      {isEnglish ? "Current statement" : "Fatura atual"}
                    </p>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClass(
                        statement?.status ?? null,
                      )}`}
                    >
                      {getStatusLabel(statement?.status ?? null, isEnglish)}
                    </span>
                  </div>

                  {statement ? (
                    <>
                      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                        {formatCurrency(outstanding, locale)}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        {isEnglish
                          ? `Closes ${formatDate(statement.closing_date, locale)} · Due ${formatDate(statement.due_date, locale)}`
                          : `Fecha em ${formatDate(statement.closing_date, locale)} · Vence em ${formatDate(statement.due_date, locale)}`}
                      </p>

                      <Link
                        href={`/${locale}/cards/${card.id}/statements/${statement.id}`}
                        className="mt-4 inline-flex text-xs font-bold text-emerald-300 transition hover:text-emerald-200"
                      >
                        {isEnglish ? "View statement →" : "Ver fatura →"}
                      </Link>
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      {isEnglish
                        ? "No open statement has been generated yet."
                        : "Nenhuma fatura aberta foi gerada ainda."}
                    </p>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-5 text-xs text-slate-400">
                  <span>
                    {isEnglish ? "Closes on day" : "Fecha dia"}{" "}
                    <strong className="text-slate-200">{card.closing_day}</strong>
                  </span>

                  <span className="text-right">
                    {isEnglish ? "Due on day" : "Vence dia"}{" "}
                    <strong className="text-slate-200">{card.due_day}</strong>
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}