import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { LoginForm } from "./login-form"

type LoginPageProps = {
  params: Promise<{
    locale: string
  }>
}

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta do Finance Control.",
}

const ArrowLeftIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 12H5m6 6-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.4"
  >
    <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ShieldIcon = () => (
  <svg
    aria-hidden="true"
    className="h-7 w-7"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChartIcon = () => (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M4 19V5m0 14h16" strokeLinecap="round" />
    <path d="m7 15 4-4 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 7h3v3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const WalletIcon = () => (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M16 14h.01" strokeLinecap="round" strokeWidth="3" />
  </svg>
)

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params

  if (locale !== "pt" && locale !== "en") {
    redirect("/pt/auth/login")
  }

  const isEnglish = locale === "en"

  const copy = {
    back: isEnglish ? "Back to home" : "Voltar para o início",
    eyebrow: isEnglish ? "YOUR FINANCIAL SPACE" : "SEU ESPAÇO FINANCEIRO",
    title: isEnglish ? "Welcome back." : "Que bom ter você de volta.",
    description: isEnglish
      ? "Access your financial overview and continue making clearer decisions about your money."
      : "Acesse sua visão financeira e continue tomando decisões mais claras sobre o seu dinheiro.",
    securityTitle: isEnglish ? "Your space, your control." : "Seu espaço, seu controle.",
    securityDescription: isEnglish
      ? "Access your financial information in a personal and protected environment."
      : "Acesse suas informações financeiras em um ambiente pessoal e protegido.",
    benefits: isEnglish
      ? [
          "A clear view of accounts and balances",
          "Budgets and goals within reach",
          "Records organized in one place",
        ]
      : [
          "Visão clara de contas e saldos",
          "Orçamentos e metas ao seu alcance",
          "Lançamentos organizados em um só lugar",
        ],
    createAccount: isEnglish ? "Create free account" : "Criar conta grátis",
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d19] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.12] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/3 translate-y-1/3 rounded-full bg-cyan-400/[0.09] blur-3xl"
      />

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.03fr_0.97fr]">
        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-20">
          <div className="flex items-center justify-between gap-4">
            <Link
              aria-label={copy.back}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
              href={`/${locale}`}
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">{copy.back}</span>
            </Link>

            <Link aria-label="Finance Control" href={`/${locale}`}>
              <Image
                alt="Finance Control"
                className="h-auto w-[145px] object-contain sm:w-[160px]"
                height={48}
                priority
                src="/brand/finco-logo.png"
                width={260}
              />
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[490px] flex-1 items-center py-12 lg:py-16">
            <div className="w-full">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.95)]" />
                {copy.eyebrow}
              </div>

              <h1 className="mt-6 max-w-md font-[var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl">
                {isEnglish ? (
                  copy.title
                ) : (
                  <>
                    Que bom ter você
                    <span className="mt-1 block bg-gradient-to-r from-emerald-200 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
                      de volta.
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-400">
                {copy.description}
              </p>

              <div className="mt-8">
                <LoginForm locale={locale} />
              </div>

              <p className="mt-7 text-center text-xs leading-5 text-slate-500">
                <span className="mr-1.5 inline-flex h-4 w-4 translate-y-0.5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                  <CheckIcon />
                </span>
                {copy.securityDescription}
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 sm:text-left">
            © {new Date().getFullYear()} Finance Control.
          </p>
        </section>

        <aside className="relative hidden overflow-hidden border-l border-white/[0.06] bg-[#0a1120] lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-400/[0.13] blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/3 rounded-full bg-cyan-400/[0.1] blur-3xl"
          />

          <div className="relative max-w-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.1] text-emerald-200">
              <ShieldIcon />
            </div>

            <p className="mt-9 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Finance Control
            </p>

            <h2 className="mt-4 font-[var(--font-display)] text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-white xl:text-5xl">
              {isEnglish ? "Clarity for every decision." : "Clareza para cada decisão."}
            </h2>

            <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
              {isEnglish
                ? "Your financial routine becomes simpler when everything important is in one place."
                : "Sua rotina financeira fica mais simples quando tudo o que importa está em um só lugar."}
            </p>
          </div>

          <div className="relative my-12 rounded-[1.7rem] border border-white/[0.09] bg-gradient-to-br from-slate-800/75 to-slate-950/80 p-5 shadow-[0_28px_70px_rgba(0,0,0,0.28)] xl:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  {isEnglish ? "Your financial overview" : "Sua visão financeira"}
                </p>

                <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">
                  R$ 12.480,90
                </p>
              </div>

              <span className="rounded-xl bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300">
                +8,4%
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                  <ChartIcon />
                </span>

                <p className="mt-4 text-xs text-slate-400">
                  {isEnglish ? "Monthly income" : "Receitas do mês"}
                </p>

                <p className="mt-1 text-lg font-semibold text-emerald-200">R$ 8.260</p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                  <WalletIcon />
                </span>

                <p className="mt-4 text-xs text-slate-400">
                  {isEnglish ? "Active accounts" : "Contas ativas"}
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-100">04</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {isEnglish ? "Monthly planning" : "Planejamento mensal"}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {isEnglish ? "Your budget is on track." : "Seu orçamento está no caminho certo."}
                  </p>
                </div>

                <p className="text-sm font-bold text-emerald-300">75%</p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
              </div>
            </div>
          </div>

          <div className="relative">
            <p className="text-sm font-semibold text-slate-100">{copy.securityTitle}</p>

            <div className="mt-5 space-y-3">
              {copy.benefits.map((benefit) => (
                <div className="flex items-center gap-3 text-sm text-slate-400" key={benefit}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                    <CheckIcon />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>

            <Link
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-emerald-300 transition hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1120]"
              href={`/${locale}/register`}
            >
              {copy.createAccount}
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}