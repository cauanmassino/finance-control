import Link from "next/link";

type LandingPageProps = {
  params: Promise<{locale: string}>;
};

export default async function LandingPage({
  params,
}: LandingPageProps) {
  const {locale} = await params;
  const isEnglish = locale === "en";

  return (
    <main className="min-h-screen bg-[#080d19] px-5 py-6 text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <span className="text-lg font-bold">Finance Control</span>

        <Link
          href={`/${locale}/auth/login`}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm"
        >
          {isEnglish ? "Sign in" : "Entrar"}
        </Link>
      </header>

      <section className="mx-auto flex min-h-[75vh] w-full max-w-6xl flex-col justify-center py-16">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
          {isEnglish ? "Financial clarity" : "Clareza financeira"}
        </p>

        <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
          {isEnglish
            ? "Understand your money and make better decisions."
            : "Entenda seu dinheiro e tome decisões melhores."}
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          {isEnglish
            ? "Track expenses, accounts, recurring commitments and your financial health in one place."
            : "Acompanhe gastos, contas, compromissos recorrentes e sua saúde financeira em um só lugar."}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${locale}/register`}
            className="rounded-xl bg-emerald-400 px-5 py-3 text-center font-bold text-slate-950"
          >
            {isEnglish ? "Create free account" : "Criar conta grátis"}
          </Link>

          <Link
            href={`/${locale}/auth/login`}
            className="rounded-xl border border-white/10 px-5 py-3 text-center font-bold text-white"
          >
            {isEnglish ? "I already have an account" : "Já tenho uma conta"}
          </Link>
        </div>
      </section>
    </main>
  );
}