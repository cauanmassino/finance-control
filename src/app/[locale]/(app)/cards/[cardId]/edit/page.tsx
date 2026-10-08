import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {EditCreditCardForm} from "@/components/cards/edit-credit-card-form";

type PageProps = {
  params: Promise<{
    locale: string;
    cardId: string;
  }>;
};

type AccountOption = {
  id: string;
  name: string;
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
  payment_account_id: string | null;
  is_active: boolean;
};

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

export default async function EditCardPage({params}: PageProps) {
  const {locale: requestedLocale, cardId} = await params;
  const locale = requestedLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [{data: card, error: cardError}, {data: accounts, error: accountsError}] =
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
          payment_account_id,
          is_active
        `)
        .eq("id", cardId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name", {ascending: true}),
    ]);

  if (cardError) {
    console.error("Erro ao carregar cartão para edição:", cardError);

    throw new Error(
      isEnglish
        ? "Could not load the credit card."
        : "Não foi possível carregar o cartão.",
    );
  }

  if (!card) {
    notFound();
  }

  if (accountsError) {
    console.error("Erro ao carregar contas:", accountsError);

    throw new Error(
      isEnglish
        ? "Could not load accounts."
        : "Não foi possível carregar as contas.",
    );
  }

  const typedCard = card as CreditCard;
  const typedAccounts = (accounts ?? []) as AccountOption[];

  const cardColor = typedCard.color || "#10B981";
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
    <main className="mx-auto max-w-4xl space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/95 to-cyan-950/35 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.26)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/4 h-36 w-96 rounded-full bg-violet-400/10 blur-3xl"
        />

        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div>
            <Link
              href={`/${locale}/cards`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              <span aria-hidden="true">←</span>
              {isEnglish ? "Back to cards" : "Voltar para cartões"}
            </Link>

            <p className="app-kicker mt-6">
              {isEnglish ? "Credit management" : "Gestão de crédito"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">
                {isEnglish ? "Edit card" : "Editar cartão"}
              </h1>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                  typedCard.is_active
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-slate-400/20 bg-slate-400/10 text-slate-300"
                }`}
              >
                {typedCard.is_active
                  ? isEnglish
                    ? "Active"
                    : "Ativo"
                  : isEnglish
                    ? "Paused"
                    : "Pausado"}
              </span>
            </div>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              {isEnglish
                ? `Update the information for ${typedCard.name}.`
                : `Atualize as informações de ${typedCard.name}.`}
            </p>
          </div>

          <div
            className="relative aspect-[1.586/1] overflow-hidden rounded-[1.35rem] border border-white/20 p-4 shadow-[0_20px_48px_rgba(0,0,0,0.27)] sm:p-5"
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
              className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/25"
            />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="truncate text-[9px] font-semibold uppercase tracking-[0.18em]"
                    style={{color: mutedCardTextColor}}
                  >
                    {typedCard.institution || "Finance control"}
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold">
                    {typedCard.name}
                  </p>
                </div>

                <span
                  className="shrink-0 rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    borderColor: mutedCardTextColor,
                    backgroundColor:
                      cardTextColor === "#ffffff"
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(8,17,31,0.10)",
                  }}
                >
                  {typedCard.is_active
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
                  className="relative h-7 w-10 overflow-hidden rounded-md border border-black/10 shadow-inner"
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

                <span className="rotate-90 text-lg font-light tracking-[-0.3em] opacity-80">
                  )))
                </span>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="font-mono text-xs tracking-[0.16em] sm:text-sm"
                    style={{fontVariantNumeric: "tabular-nums"}}
                  >
                    •••• •••• •••• {typedCard.last_four || "0000"}
                  </p>

                  <p
                    className="mt-2 text-[8px] font-semibold uppercase tracking-[0.13em]"
                    style={{color: mutedCardTextColor}}
                  >
                    {isEnglish
                      ? "Digital credit card"
                      : "Cartão de crédito digital"}
                  </p>
                </div>

                <p className="shrink-0 text-right text-base font-black lowercase italic">
                  {getBrandLabel(typedCard.brand)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6 lg:p-7">
        <EditCreditCardForm
          locale={locale}
          card={typedCard}
          accounts={typedAccounts}
        />
      </section>
    </main>
  );
}