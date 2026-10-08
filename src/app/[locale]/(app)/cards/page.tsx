import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {DeleteCardButton} from "@/components/cards/delete-card-button";
import {ToggleCardActiveButton} from "@/components/cards/toggle-card-active-button";

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

function getBrandLabel(brand: string | null) {
  if (!brand) {
    return "CARD";
  }

  const labels: Record<string, string> = {
    visa: "VISA",
    mastercard: "mastercard",
    amex: "AMEX",
    elo: "elo",
    hipercard: "HIPERCARD",
    other: "CARD",
  };

  return labels[brand.toLowerCase()] ?? brand.toUpperCase();
}

function getTextColor(color: string) {
  const normalizedColor = color.replace("#", "");

  if (normalizedColor.length !== 6) {
    return "#ffffff";
  }

  const red = Number.parseInt(normalizedColor.slice(0, 2), 16);
  const green = Number.parseInt(normalizedColor.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedColor.slice(4, 6), 16);

  const luminance =
    (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.65 ? "#08111f" : "#ffffff";
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

  const totalCreditLimit = typedCards.reduce(
    (total, card) => total + Number(card.credit_limit ?? 0),
    0,
  );

  const totalOutstanding = typedCards.reduce((total, card) => {
    const statement = statementByCardId.get(card.id);
    const amount = Number(statement?.total_amount ?? 0);
    const paid = Number(statement?.paid_amount ?? 0);

    return total + Math.max(amount - paid, 0);
  }, 0);

  const totalAvailable = Math.max(totalCreditLimit - totalOutstanding, 0);

  const activeCardsCount = typedCards.filter(
    (card) => card.is_active,
  ).length;

  return (
    <main className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/95 to-cyan-950/35 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-96 rounded-full bg-violet-400/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="app-kicker">
              {isEnglish ? "Credit management" : "Gestão de crédito"}
            </p>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {isEnglish ? "Your cards, simplified." : "Seus cartões, mais simples."}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? "Track available credit, current statements, and payment dates in one place."
                : "Acompanhe limite disponível, faturas atuais e datas de pagamento em um só lugar."}
            </p>
          </div>

          <Link
            href={`/${locale}/cards/new`}
            className="app-shine inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-bold text-emerald-950 shadow-[0_10px_26px_rgba(52,211,153,0.16)] transition hover:-translate-y-0.5 hover:bg-emerald-200"
          >
            <span className="mr-2 text-lg leading-none">+</span>
            {isEnglish ? "Add card" : "Adicionar cartão"}
          </Link>
        </div>

        {typedCards.length > 0 ? (
          <div className="relative mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isEnglish ? "Active cards" : "Cartões ativos"}
              </p>

              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                {activeCardsCount}
                <span className="ml-1 text-sm font-medium text-slate-500">
                  / {typedCards.length}
                </span>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isEnglish ? "Total available" : "Total disponível"}
              </p>

              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-emerald-200">
                {formatCurrency(totalAvailable, locale)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {isEnglish ? "Open statements" : "Faturas em aberto"}
              </p>

              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-100">
                {formatCurrency(totalOutstanding, locale)}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {typedCards.length === 0 ? (
        <section className="relative overflow-hidden rounded-[1.7rem] border border-dashed border-white/15 bg-white/[0.025] p-8 text-center sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl"
          />

          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-cyan-300/20 bg-cyan-400/10 text-3xl text-cyan-200">
              ▣
            </span>

            <h2 className="mt-5 text-lg font-semibold text-slate-100">
              {isEnglish
                ? "No credit cards registered"
                : "Nenhum cartão cadastrado"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {isEnglish
                ? "Create your first card to follow its limit, statement closing date, due date, and purchases."
                : "Crie seu primeiro cartão para acompanhar limite, fechamento, vencimento e compras."}
            </p>

            <Link
              href={`/${locale}/cards/new`}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-300 px-4 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200"
            >
              {isEnglish ? "Create card" : "Criar cartão"}
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
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

            const cardColor = card.color || "#10B981";
            const cardTextColor = getTextColor(cardColor);
            const mutedCardTextColor =
              cardTextColor === "#ffffff"
                ? "rgba(255,255,255,0.68)"
                : "rgba(8,17,31,0.66)";

            const cardBackground = `
              radial-gradient(circle at 90% 8%, rgba(255,255,255,0.30), transparent 29%),
              radial-gradient(circle at 7% 100%, rgba(255,255,255,0.17), transparent 34%),
              linear-gradient(135deg, ${cardColor}, ${cardColor}bd 48%, #09111f 150%)
            `;

            return (
              <article
                key={card.id}
                className="app-surface group overflow-hidden rounded-[1.85rem] p-4 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:p-5"
              >
                <div
                  className="relative aspect-[1.586/1] overflow-hidden rounded-[1.45rem] border border-white/20 p-5 shadow-[0_20px_48px_rgba(0,0,0,0.27)] sm:p-6"
                  style={{
                    background: cardBackground,
                    color: cardTextColor,
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.22'/%3E%3C/svg%3E\")",
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/25 transition duration-700 group-hover:scale-125"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full border border-white/10"
                  />

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className="truncate text-[10px] font-semibold uppercase tracking-[0.2em]"
                          style={{color: mutedCardTextColor}}
                        >
                          {card.institution || "Finance control"}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold sm:text-base">
                          {card.name}
                        </p>
                      </div>

                      <span
                        className="shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                        style={{
                          borderColor: mutedCardTextColor,
                          backgroundColor:
                            cardTextColor === "#ffffff"
                              ? "rgba(255,255,255,0.10)"
                              : "rgba(8,17,31,0.10)",
                        }}
                      >
                        {card.is_active
                          ? isEnglish
                            ? "Active"
                            : "Ativo"
                          : isEnglish
                            ? "Paused"
                            : "Pausado"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        aria-label={isEnglish ? "Card chip" : "Chip do cartão"}
                        className="relative h-8 w-11 overflow-hidden rounded-lg border border-black/10 shadow-inner"
                        style={{
                          background:
                            "linear-gradient(135deg, #b78330 0%, #fff0ad 44%, #c0923e 100%)",
                        }}
                      >
                        <div className="absolute inset-y-0 left-1/2 w-px bg-black/20" />
                        <div className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
                        <div className="absolute inset-y-0 left-[25%] w-px bg-black/15" />
                        <div className="absolute inset-y-0 right-[25%] w-px bg-black/15" />
                      </div>

                      <span
                        aria-label={
                          isEnglish ? "Contactless payment" : "Pagamento por aproximação"
                        }
                        className="rotate-90 text-xl font-light tracking-[-0.3em] opacity-80"
                      >
                        )))
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className="font-mono text-sm tracking-[0.18em] sm:text-base"
                          style={{fontVariantNumeric: "tabular-nums"}}
                        >
                          •••• •••• •••• {card.last_four || "0000"}
                        </p>

                        <p
                          className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em]"
                          style={{color: mutedCardTextColor}}
                        >
                          {isEnglish
                            ? "Digital credit card"
                            : "Cartão de crédito digital"}
                        </p>
                      </div>

                      <p className="shrink-0 text-right text-lg font-black lowercase italic sm:text-xl">
                        {getBrandLabel(card.brand)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {isEnglish ? "Available" : "Disponível"}
                    </p>

                    <p className="mt-1.5 text-base font-semibold tabular-nums text-emerald-200">
                      {formatCurrency(available, locale)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3.5">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {isEnglish ? "Credit limit" : "Limite total"}
                    </p>

                    <p className="mt-1.5 text-base font-semibold tabular-nums text-slate-100">
                      {formatCurrency(creditLimit, locale)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-400">
                      {isEnglish ? "Statement usage" : "Uso da fatura"}
                    </span>

                    <span className="font-semibold tabular-nums text-slate-200">
                      {usedPercentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${usedPercentage}%`,
                        backgroundColor: cardColor,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
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
                      <p className="mt-3 text-xl font-semibold tabular-nums tracking-[-0.04em] text-white">
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

                <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-slate-400">
                  <span>
                    {isEnglish ? "Closes on day" : "Fecha dia"}{" "}
                    <strong className="text-slate-200">{card.closing_day}</strong>
                  </span>

                  <span>
                    {isEnglish ? "Due on day" : "Vence dia"}{" "}
                    <strong className="text-slate-200">{card.due_day}</strong>
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ToggleCardActiveButton
                    cardId={card.id}
                    isActive={card.is_active}
                  />

                  <Link
                    href={`/${locale}/cards/${card.id}/edit`}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    {isEnglish ? "Edit" : "Editar"}
                  </Link>

                  <DeleteCardButton
                    cardId={card.id}
                    cardName={card.name}
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