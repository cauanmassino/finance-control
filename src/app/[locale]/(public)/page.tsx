import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"

type HomePageProps = {
  params: Promise<{
    locale: string
  }>
}

export const metadata: Metadata = {
  title: "Finance Control | Sua vida financeira sob controle",
  description:
    "Organize contas, receitas, despesas, orçamentos e recorrências em um só lugar.",
}

const ArrowUpRightIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M7 17 17 7M8 7h9v9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ArrowRightIcon = () => (
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
)

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
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

const TargetIcon = () => (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2" strokeLinecap="round" />
  </svg>
)

const RepeatIcon = () => (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" strokeLinecap="round" />
    <path d="m7 23-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" />
  </svg>
)

const TagIcon = () => (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M20.6 13.2 13.2 20.6a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 2.8 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.4 7.4a1.6 1.6 0 0 1 0 2.2Z"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
  </svg>
)

const ShieldIcon = () => (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
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

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div
        aria-hidden="true"
        className="absolute -inset-10 rounded-full bg-emerald-400/20 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d1728]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur sm:p-4">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <ChartIcon />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Finance Control
              </p>
              <p className="text-xs font-semibold text-slate-100">Visão financeira</p>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
            Atualizado agora
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-slate-800/90 to-slate-950 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-400">Saldo total</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  R$ 12.480,90
                </p>
              </div>
              <div className="rounded-xl bg-emerald-400/10 px-2.5 py-1.5 text-right">
                <p className="text-[10px] font-semibold text-emerald-300">+8,4%</p>
                <p className="mt-0.5 text-[9px] text-emerald-100/70">neste mês</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">Fluxo de caixa</p>
                <p className="text-[10px] text-slate-500">Últimos 6 meses</p>
              </div>

              <svg
                aria-label="Gráfico ilustrativo de fluxo de caixa"
                className="h-[116px] w-full overflow-visible"
                fill="none"
                role="img"
                viewBox="0 0 330 115"
              >
                <defs>
                  <linearGradient id="chartLine" x1="0" x2="1" y1="0" y2="0">
                    <stop stopColor="#34d399" />
                    <stop offset="1" stopColor="#67e8f9" />
                  </linearGradient>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#34d399" stopOpacity=".27" />
                    <stop offset="1" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M3 96 C30 87, 34 77, 55 79 S83 92, 106 64 S140 74, 161 53 S195 74, 217 43 S248 52, 272 26 S302 39, 327 10 V112 H3 Z"
                  fill="url(#chartFill)"
                />

                <path
                  d="M3 96 C30 87, 34 77, 55 79 S83 92, 106 64 S140 74, 161 53 S195 74, 217 43 S248 52, 272 26 S302 39, 327 10"
                  stroke="url(#chartLine)"
                  strokeLinecap="round"
                  strokeWidth="3"
                />

                <line
                  stroke="rgba(148,163,184,0.16)"
                  strokeDasharray="4 6"
                  x1="2"
                  x2="328"
                  y1="96"
                  y2="96"
                />
                <line
                  stroke="rgba(148,163,184,0.12)"
                  strokeDasharray="4 6"
                  x1="2"
                  x2="328"
                  y1="61"
                  y2="61"
                />
                <line
                  stroke="rgba(148,163,184,0.1)"
                  strokeDasharray="4 6"
                  x1="2"
                  x2="328"
                  y1="26"
                  y2="26"
                />

                <circle cx="327" cy="10" fill="#d1fae5" r="4.5" />
                <circle cx="327" cy="10" fill="#10b981" r="2.5" />
              </svg>

              <div className="mt-1 flex justify-between text-[9px] font-medium text-slate-500">
                <span>Mai</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Ago</span>
                <span>Set</span>
                <span>Out</span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">Receitas</p>
                <span className="rounded-lg bg-emerald-400/10 px-1.5 py-1 text-[10px] text-emerald-300">
                  ↑
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-emerald-200">R$ 8.260</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">Despesas</p>
                <span className="rounded-lg bg-rose-400/10 px-1.5 py-1 text-[10px] text-rose-300">
                  ↓
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold text-rose-200">R$ 3.480</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full w-[51%] rounded-full bg-gradient-to-r from-rose-400 to-orange-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-100">Últimos lançamentos</p>
              <span className="text-[10px] font-semibold text-emerald-300">Ver todos</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-xs">
                    💼
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-200">Recebimento mensal</p>
                    <p className="text-[9px] text-slate-500">Hoje</p>
                  </div>
                </div>
                <p className="shrink-0 text-[11px] font-bold text-emerald-300">+ R$ 5.200</p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-400/10 text-xs">
                    🛒
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-200">Mercado da semana</p>
                    <p className="text-[9px] text-slate-500">Ontem</p>
                  </div>
                </div>
                <p className="shrink-0 text-[11px] font-bold text-rose-300">− R$ 286</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-100">Orçamento mensal</p>
              <span className="text-sm">🎯</span>
            </div>
            <p className="mt-2 text-[11px] text-amber-100/70">Alimentação</p>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="text-base font-semibold text-white">R$ 842</p>
              <p className="text-[10px] text-amber-200">de R$ 1.200</p>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-amber-100/10">
              <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-amber-300 to-orange-300" />
            </div>
            <p className="mt-2 text-[9px] font-medium text-amber-200/80">70% do limite utilizado</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-white/10 bg-[#101a2d]/90 px-4 py-3 shadow-2xl backdrop-blur sm:block">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <CheckIcon />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-slate-100">Tudo sob controle</p>
            <p className="mt-0.5 text-[9px] text-slate-400">Seu mês está no caminho certo.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params

  if (locale !== "pt" && locale !== "en") {
    redirect("/pt")
  }

  const isEnglish = locale === "en"

  const copy = {
    nav: {
      resources: isEnglish ? "Features" : "Recursos",
      howItWorks: isEnglish ? "How it works" : "Como funciona",
      security: isEnglish ? "Security" : "Segurança",
      login: isEnglish ? "Sign in" : "Entrar",
      getStarted: isEnglish ? "Get started free" : "Começar grátis",
    },
    hero: {
      eyebrow: isEnglish ? "PERSONAL FINANCE CONTROL" : "CONTROLE FINANCEIRO PESSOAL",
      titleFirst: isEnglish ? "Your money organized." : "Seu dinheiro organizado.",
      titleSecond: isEnglish ? "Your decisions" : "Suas decisões",
      titleHighlight: isEnglish ? "clearer." : "mais claras.",
      description: isEnglish
        ? "Track accounts, income, expenses, budgets and recurring commitments in one place — with a simple view of what truly matters."
        : "Acompanhe contas, receitas, despesas, orçamentos e compromissos recorrentes em um só lugar — com uma visão simples do que realmente importa.",
      primary: isEnglish ? "Start for free" : "Começar gratuitamente",
      secondary: isEnglish ? "I already have an account" : "Já tenho uma conta",
      helper: isEnglish
        ? "Start in minutes. No credit card required."
        : "Comece em poucos minutos. Sem cartão de crédito.",
    },
    highlights: [
      isEnglish ? "A complete view of your finances" : "Visão completa das suas finanças",
      isEnglish ? "Clearer budgets and goals" : "Orçamentos e metas mais claros",
      isEnglish ? "Control on any device" : "Controle em qualquer dispositivo",
    ],
    features: {
      eyebrow: isEnglish ? "YOUR FINANCIAL ROUTINE, SIMPLER" : "SUA ROTINA FINANCEIRA, MAIS SIMPLES",
      title: isEnglish ? "Everything to take control." : "Tudo para você assumir o controle.",
      description: isEnglish
        ? "Essential tools to turn everyday transactions into financial clarity."
        : "Ferramentas essenciais para transformar movimentações do dia a dia em clareza financeira.",
      cards: [
        {
          title: isEnglish ? "Accounts in one place" : "Contas em um só lugar",
          description: isEnglish
            ? "Track balances and movements from every account without losing the big picture."
            : "Acompanhe saldos e movimentações de cada conta sem perder a visão do todo.",
          icon: <WalletIcon />,
          tone: "emerald",
        },
        {
          title: isEnglish ? "Income and expenses" : "Receitas e despesas",
          description: isEnglish
            ? "Record every transaction with ease and follow your monthly result."
            : "Registre cada lançamento de forma prática e acompanhe seu resultado mensal.",
          icon: <ChartIcon />,
          tone: "cyan",
        },
        {
          title: isEnglish ? "Smart categories" : "Categorias inteligentes",
          description: isEnglish
            ? "Understand where your money goes and identify spending habits."
            : "Entenda para onde o seu dinheiro vai e identifique hábitos de consumo.",
          icon: <TagIcon />,
          tone: "violet",
        },
        {
          title: isEnglish ? "Monthly budgets" : "Orçamentos mensais",
          description: isEnglish
            ? "Set category limits and track how much has already been used."
            : "Defina limites por categoria e acompanhe o quanto já foi utilizado.",
          icon: <TargetIcon />,
          tone: "amber",
        },
        {
          title: isEnglish ? "No missed recurring items" : "Recorrências sem esquecimento",
          description: isEnglish
            ? "Organize recurring income and expenses to plan the months ahead."
            : "Organize despesas e receitas recorrentes para planejar os próximos meses.",
          icon: <RepeatIcon />,
          tone: "sky",
        },
        {
          title: isEnglish ? "Insights and alerts" : "Visão e alertas",
          description: isEnglish
            ? "Use charts, summaries and alerts to decide with more confidence."
            : "Use gráficos, resumos e alertas para tomar decisões com mais confiança.",
          icon: <ShieldIcon />,
          tone: "rose",
        },
      ],
    },
    steps: {
      eyebrow: isEnglish ? "SIMPLE FROM THE START" : "SIMPLES DESDE O INÍCIO",
      title: isEnglish ? "Financial clarity in three steps." : "Clareza financeira em três passos.",
      description: isEnglish
        ? "A lighter routine to understand your present and plan your next moves."
        : "Uma rotina mais leve para entender o presente e planejar seus próximos passos.",
      items: [
        {
          number: "01",
          title: isEnglish ? "Create your account" : "Crie sua conta",
          description: isEnglish
            ? "Get started for free and have your own personal financial space."
            : "Comece gratuitamente e tenha seu espaço financeiro pessoal.",
        },
        {
          number: "02",
          title: isEnglish ? "Organize your transactions" : "Organize suas movimentações",
          description: isEnglish
            ? "Add accounts, income, expenses and recurring commitments."
            : "Cadastre contas, receitas, despesas e compromissos recorrentes.",
        },
        {
          number: "03",
          title: isEnglish ? "Decide with clarity" : "Decida com clareza",
          description: isEnglish
            ? "See your progress, follow budgets and adjust your plans."
            : "Visualize sua evolução, acompanhe orçamentos e ajuste seus planos.",
        },
      ],
    },
    security: {
      eyebrow: isEnglish ? "CONTROL WITH PEACE OF MIND" : "CONTROLE COM TRANQUILIDADE",
      title: isEnglish
        ? "Your financial life deserves privacy."
        : "Sua vida financeira merece privacidade.",
      description: isEnglish
        ? "Your data is organized in an individual account with protected authentication and access. You keep sight of what matters, without the complexity."
        : "Seus dados são organizados em uma conta individual, com autenticação e acesso protegido. Você mantém a visão do que importa, sem complicação.",
      items: isEnglish
        ? ["Account-based access", "Data separated by user", "Control in your hands"]
        : ["Acesso por conta", "Dados separados por usuário", "Controle sob suas mãos"],
    },
    cta: {
      title: isEnglish
        ? "Start taking better care of your money today."
        : "Comece a cuidar melhor do seu dinheiro hoje.",
      description: isEnglish
        ? "Turn your financial routine into calmer, more conscious decisions."
        : "Transforme sua rotina financeira em decisões mais tranquilas e conscientes.",
      primary: isEnglish ? "Create my free account" : "Criar minha conta grátis",
      secondary: isEnglish ? "I already have an account" : "Já tenho uma conta",
    },
    footer: {
      description: isEnglish
        ? "Finance Control — clarity for your financial life."
        : "Finance Control — clareza para sua vida financeira.",
      copyright: isEnglish ? "All rights reserved." : "Todos os direitos reservados.",
    },
  }

  const loginHref = `/${locale}/auth/login`
  const registerHref = `/${locale}/register`

  const featureToneClasses: Record<string, string> = {
    emerald: "bg-emerald-400/10 text-emerald-300 group-hover:bg-emerald-400/15",
    cyan: "bg-cyan-400/10 text-cyan-300 group-hover:bg-cyan-400/15",
    violet: "bg-violet-400/10 text-violet-300 group-hover:bg-violet-400/15",
    amber: "bg-amber-300/10 text-amber-200 group-hover:bg-amber-300/15",
    sky: "bg-sky-400/10 text-sky-300 group-hover:bg-sky-400/15",
    rose: "bg-rose-400/10 text-rose-300 group-hover:bg-rose-400/15",
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080d19] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-[580px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.13),transparent_58%)]"
      />

      <header className="relative z-20 border-b border-white/[0.06] bg-[#080d19]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-7 lg:px-8">
          <Link
            aria-label="Finance Control"
            className="flex shrink-0 items-center transition-opacity hover:opacity-85"
            href={`/${locale}`}
          >
            <Image
              alt="Finance Control"
              className="h-auto w-[145px] object-contain sm:w-[160px]"
              height={48}
              priority
              src="/brand/finco-logo.png"
              width={260}
            />
          </Link>

          <nav aria-label={isEnglish ? "Main navigation" : "Navegação principal"} className="hidden items-center gap-7 lg:flex">
            <a
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
              href="#recursos"
            >
              {copy.nav.resources}
            </a>
            <a
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
              href="#como-funciona"
            >
              {copy.nav.howItWorks}
            </a>
            <a
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
              href="#seguranca"
            >
              {copy.nav.security}
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] px-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19] sm:px-4"
              href={loginHref}
            >
              {copy.nav.login}
            </Link>
            <Link
              className="hidden h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-emerald-950 shadow-[0_10px_25px_rgba(16,185,129,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19] sm:inline-flex"
              href={registerHref}
            >
              {copy.nav.getStarted}
              <ArrowUpRightIcon />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-7 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.95)]" />
                {copy.hero.eyebrow}
              </div>

              <h1 className="mt-6 max-w-3xl text-[2.65rem] font-semibold leading-[0.99] tracking-[-0.055em] text-white sm:mt-7 sm:text-6xl lg:text-[4.3rem]">
                {copy.hero.titleFirst}
                <span className="mt-1 block">{copy.hero.titleSecond}</span>
                <span className="block bg-gradient-to-r from-emerald-300 via-emerald-200 to-cyan-200 bg-clip-text text-transparent">
                  {copy.hero.titleHighlight}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                {copy.hero.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-bold text-emerald-950 shadow-[0_14px_32px_rgba(16,185,129,0.2)] transition hover:-translate-y-0.5 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
                  href={registerHref}
                >
                  {copy.hero.primary}
                  <ArrowRightIcon />
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] px-5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d19]"
                  href={loginHref}
                >
                  {copy.hero.secondary}
                </Link>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                  <CheckIcon />
                </span>
                {copy.hero.helper}
              </div>
            </div>

            <DashboardPreview />
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-white/[0.018]">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-3 sm:px-7 lg:px-8">
            {copy.highlights.map((item, index) => (
              <div className="flex items-center gap-3 sm:justify-center" key={item}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] text-xs font-bold text-emerald-200">
                  0{index + 1}
                </span>
                <p className="text-sm font-medium text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-7 sm:py-28 lg:px-8" id="recursos">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-300">
              {copy.features.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
              {copy.features.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
              {copy.features.description}
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {copy.features.cards.map((feature) => (
              <article
                className="group rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.018] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/20 hover:bg-white/[0.055] sm:p-6"
                key={feature.title}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${featureToneClasses[feature.tone]}`}
                >
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-slate-100">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-400">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative border-y border-white/[0.06] bg-[#0a1120]" id="como-funciona">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-5xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.085),transparent_66%)]"
          />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-7 sm:py-28 lg:grid-cols-[0.93fr_1.07fr] lg:items-center lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-300">
                {copy.steps.eyebrow}
              </p>
              <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
                {copy.steps.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">{copy.steps.description}</p>

              <div className="mt-9 space-y-7">
                {copy.steps.items.map((step, index) => (
                  <div className="flex gap-4" key={step.number}>
                    <div className="relative flex w-9 shrink-0 justify-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.09] text-xs font-bold text-emerald-200">
                        {step.number}
                      </span>
                      {index !== copy.steps.items.length - 1 ? (
                        <span className="absolute top-11 h-[calc(100%+10px)] w-px bg-gradient-to-b from-emerald-300/30 to-transparent" />
                      ) : null}
                    </div>
                    <div className="pb-1">
                      <h3 className="text-base font-semibold text-slate-100">{step.title}</h3>
                      <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.09] bg-gradient-to-br from-slate-800/75 via-slate-900/85 to-[#0c1825] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.25)] sm:p-6">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-100">
                    {isEnglish ? "Your financial routine" : "Sua rotina financeira"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {isEnglish ? "A simple path to more clarity" : "Um caminho simples para mais clareza"}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                  {isEnglish ? "In progress" : "Em andamento"}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  isEnglish ? "Add your main accounts" : "Adicione suas principais contas",
                  isEnglish ? "Record this month's transactions" : "Registre as movimentações do mês",
                  isEnglish ? "Set your category budgets" : "Defina seus orçamentos por categoria",
                  isEnglish ? "Review your financial summary" : "Revise seu resumo financeiro",
                ].map((item, index) => (
                  <div
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"
                    key={item}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        index < 3
                          ? "bg-emerald-400/12 text-emerald-300"
                          : "border border-white/10 bg-white/[0.025] text-slate-500"
                      }`}
                    >
                      {index < 3 ? <CheckIcon /> : <span className="h-2 w-2 rounded-full bg-slate-600" />}
                    </span>
                    <p
                      className={`text-xs font-medium ${
                        index < 3 ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.07] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-100">
                      {isEnglish ? "Your organization is advancing" : "Sua organização está avançando"}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-emerald-100/65">
                      {isEnglish
                        ? "Keep your records updated to see a clearer picture."
                        : "Mantenha seus registros em dia para ter uma visão cada vez mais clara."}
                    </p>
                  </div>
                  <p className="shrink-0 text-xl font-semibold text-emerald-200">75%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950/30">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-7 sm:py-28 lg:px-8" id="seguranca">
          <div className="relative overflow-hidden rounded-[1.9rem] border border-emerald-300/15 bg-gradient-to-br from-emerald-400/[0.11] via-[#112534] to-[#0d1726] px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-1/4 h-52 w-72 rounded-full bg-cyan-300/10 blur-3xl"
            />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-emerald-200">
                  {copy.security.eyebrow}
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
                  {copy.security.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-300">{copy.security.description}</p>
              </div>

              <div className="grid gap-3">
                {copy.security.items.map((item) => (
                  <div
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#08111d]/45 p-4 backdrop-blur-sm"
                    key={item}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200">
                      <CheckIcon />
                    </span>
                    <p className="text-sm font-semibold text-slate-100">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-7 sm:pb-28 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-emerald-300 via-emerald-400 to-cyan-300 px-6 py-12 text-emerald-950 shadow-[0_25px_60px_rgba(16,185,129,0.18)] sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-80 rounded-full bg-cyan-950/15 blur-3xl"
            />

            <div className="relative max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{copy.cta.title}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-emerald-950/75">{copy.cta.description}</p>
            </div>

            <div className="relative mt-7 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(4,47,46,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-950 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-300"
                href={registerHref}
              >
                {copy.cta.primary}
                <ArrowRightIcon />
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl border border-emerald-950/15 bg-white/15 px-5 text-sm font-bold text-emerald-950 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-950 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-300"
                href={loginHref}
              >
                {copy.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] bg-[#070b14]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-7 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Link
                aria-label="Finance Control"
                className="inline-flex transition-opacity hover:opacity-85"
                href={`/${locale}`}
              >
                <Image
                  alt="Finance Control"
                  className="h-auto w-[145px] object-contain"
                  height={48}
                  src="/brand/finco-logo.png"
                  width={260}
                />
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">{copy.footer.description}</p>
            </div>

            <nav
              aria-label={isEnglish ? "Footer navigation" : "Navegação do rodapé"}
              className="flex flex-wrap gap-x-6 gap-y-3"
            >
              <a className="text-sm font-medium text-slate-400 transition hover:text-white" href="#recursos">
                {copy.nav.resources}
              </a>
              <a className="text-sm font-medium text-slate-400 transition hover:text-white" href="#como-funciona">
                {copy.nav.howItWorks}
              </a>
              <a className="text-sm font-medium text-slate-400 transition hover:text-white" href="#seguranca">
                {copy.nav.security}
              </a>
              <Link className="text-sm font-medium text-slate-400 transition hover:text-white" href={loginHref}>
                {copy.nav.login}
              </Link>
            </nav>
          </div>

          <div className="mt-10 border-t border-white/[0.06] pt-6 text-xs text-slate-600">
            © {new Date().getFullYear()} Finance Control. {copy.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  )
}