import type {Metadata} from "next";
import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {EditAccountForm} from "@/components/accounts/edit-account-form";

export const metadata: Metadata = {
  title: "Editar conta",
  description: "Atualize as informações da conta.",
};

type EditAccountPageProps = {
  params: Promise<{
    locale: string;
    accountId: string;
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
  color: string;
  initial_balance: number | string;
};

export default async function EditAccountPage({
  params,
}: EditAccountPageProps) {
  const {locale, accountId} = await params;
  const isEnglish = locale === "en";

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: account, error} = await supabase
    .from("accounts")
    .select("id, name, type, institution, color, initial_balance")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro detalhado ao carregar conta:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Não foi possível carregar a conta.");
  }

  if (!account) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl">
      <Link
        href={`/${locale}/accounts`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <span aria-hidden="true">←</span>
        {isEnglish ? "Back to accounts" : "Voltar para contas"}
      </Link>

      <section className="relative mt-5 overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/75 to-violet-950/25 px-5 py-6 shadow-[0_22px_60px_rgba(0,0,0,0.22)] sm:px-7 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-400/16 blur-3xl"
        />

        <div className="relative">
          <p className="app-kicker">
            {isEnglish ? "Account settings" : "Configurações da conta"}
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">
            {isEnglish ? "Refine your account." : "Ajuste sua conta."}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            {isEnglish
              ? "Update the name, institution, color, initial balance, and account type."
              : "Atualize o nome, instituição, cor, saldo inicial e tipo da conta."}
          </p>
        </div>
      </section>

      <div className="mt-6">
        <EditAccountForm
          locale={locale}
          account={account as Account}
        />
      </div>
    </main>
  );
}