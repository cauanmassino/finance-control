import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CreditCardForm} from "@/components/cards/credit-card-form";

type PageProps = {
  params: Promise<{locale: string}>;
};

type AccountOption = {
  id: string;
  name: string;
};

export default async function NewCardPage({params}: PageProps) {
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

  const {data: accounts, error: accountsError} = await supabase
    .from("accounts")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", {ascending: true});

  if (accountsError) {
    console.error("Erro ao carregar contas para o cartão:", accountsError);
    throw new Error(
      isEnglish
        ? "Could not load accounts."
        : "Não foi possível carregar as contas.",
    );
  }

  const typedAccounts = (accounts ?? []) as AccountOption[];

  return (
    <main className="mx-auto max-w-3xl space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-cyan-950/20 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.24)] sm:px-7 sm:py-8 lg:px-9 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"
        />

        <div className="relative">
          <p className="app-kicker">
            {isEnglish ? "Credit management" : "Gestão de crédito"}
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">
            {isEnglish ? "Add credit card" : "Adicionar cartão"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            {isEnglish
              ? "Register a new card and link the account that will pay its statements."
              : "Cadastre um novo cartão e vincule a conta que pagará as faturas."}
          </p>
        </div>
      </section>

      <section className="app-surface rounded-[1.7rem] p-5 sm:p-6">
        <CreditCardForm locale={locale} accounts={typedAccounts} />
      </section>
    </main>
  );
}