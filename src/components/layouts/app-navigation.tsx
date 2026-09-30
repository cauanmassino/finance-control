"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";


type AppNavigationProps = {
  locale: string;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
};


type NavigationItem = {
  href: string;
  labelPt: string;
  labelEn: string;
  icon: string;
  matches: (pathname: string) => boolean;
};


export function AppNavigation({
  locale,
  isCollapsed,
  setIsCollapsed,
}: AppNavigationProps) {
  const pathname = usePathname();
  const isEnglish = locale === "en";


  const navigationItems: NavigationItem[] = [
    {
      href: `/${locale}/dashboard`,
      labelPt: "Visão geral",
      labelEn: "Overview",
      icon: "✦",
      matches: (path) => path === `/${locale}/dashboard`,
    },
    {
      href: `/${locale}/financial-health`,
      labelPt: "Saúde financeira",
      labelEn: "Financial health",
      icon: "◒",
      matches: (path) => path.startsWith(`/${locale}/financial-health`),
    },
    {
      href: `/${locale}/transactions`,
      labelPt: "Lançamentos",
      labelEn: "Transactions",
      icon: "↕",
      matches: (path) => path.startsWith(`/${locale}/transactions`),
    },
    {
      href: `/${locale}/transfers`,
      labelPt: "Transferências",
      labelEn: "Transfers",
      icon: "⇄",
      matches: (path) => path.startsWith(`/${locale}/transfers`),
    },
    {
      href: `/${locale}/accounts`,
      labelPt: "Contas",
      labelEn: "Accounts",
      icon: "◫",
      matches: (path) => path.startsWith(`/${locale}/accounts`),
    },
    {
      href: `/${locale}/categories`,
      labelPt: "Categorias",
      labelEn: "Categories",
      icon: "◉",
      matches: (path) => path.startsWith(`/${locale}/categories`),
    },
    {
      href: `/${locale}/recurring`,
      labelPt: "Recorrências",
      labelEn: "Recurring",
      icon: "↻",
      matches: (path) => path.startsWith(`/${locale}/recurring`),
    },
    {
      href: `/${locale}/reports`,
      labelPt: "Relatórios",
      labelEn: "Reports",
      icon: "⌁",
      matches: (path) => path.startsWith(`/${locale}/reports`),
    },
  ];


  const appPages = navigationItems.some((item) => item.matches(pathname));


  if (!appPages) {
    return null;
  }


  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/10 bg-slate-950/65 shadow-[20px_0_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition-all duration-300 lg:flex ${
        isCollapsed ? "w-20" : "w-[17.5rem]"
      }`}>
        <div className="border-b border-white/10 px-5 py-5">
          <Link
            href={`/${locale}/dashboard`}
            className={`group flex items-center gap-3 rounded-2xl p-1 transition-opacity hover:opacity-90 ${
              isCollapsed ? "justify-center" : ""
            }`}
            title={isCollapsed ? (isEnglish ? "Dashboard" : "Visão geral") : undefined}
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-300 via-emerald-400 to-cyan-500 text-lg font-black text-slate-950 shadow-[0_10px_28px_rgba(52,211,153,0.28)]">
              <span className="relative z-10">ƒ</span>
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.85),transparent_26%)]" />
            </span>


            {!isCollapsed && (
              <span>
                <span className="block font-[family-name:var(--font-display)] text-[1.05rem] font-semibold tracking-[-0.04em] text-white">
                  Finance Control
                </span>


                <span className="mt-0.5 block text-xs text-slate-400">
                  {isEnglish
                    ? "Your money, in focus."
                    : "Seu dinheiro, em foco."}
                </span>
              </span>
            )}
          </Link>


          {/* Botão de toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.055] hover:text-slate-200"
            title={isCollapsed 
              ? (isEnglish ? "Expand menu" : "Expandir menu") 
              : (isEnglish ? "Collapse menu" : "Minimizar menu")
            }
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>


        <nav
          aria-label={isEnglish ? "Main navigation" : "Navegação principal"}
          className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        >
          {!isCollapsed && (
            <p className="mb-3 px-3 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-500">
              {isEnglish ? "Workspace" : "Área financeira"}
            </p>
          )}


          {navigationItems.map((item) => {
            const isActive = item.matches(pathname);


            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-400/18 to-cyan-400/8 text-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_10px_28px_rgba(0,0,0,0.12)]"
                    : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"
                } ${
                  isCollapsed ? "justify-center" : ""
                }`}
                title={isCollapsed ? (isEnglish ? item.labelEn : item.labelPt) : undefined}
              >
                {isActive && !isCollapsed ? (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.95)]" />
                ) : null}


                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-emerald-300/14 text-emerald-200"
                      : "bg-white/[0.045] text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {item.icon}
                </span>


                {!isCollapsed && (isEnglish ? item.labelEn : item.labelPt)}
              </Link>
            );
          })}
        </nav>


        {!isCollapsed && (
          <div className="m-3 mt-0 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-4">
            <p className="text-xs font-semibold text-slate-200">
              {isEnglish ? "Your finances" : "Suas finanças"}
            </p>


            <p className="mt-1 text-xs leading-5 text-slate-400">
              {isEnglish
                ? "Small decisions, clearer future."
                : "Pequenas decisões, futuro mais claro."}
            </p>


            <Link
              href={`/${locale}/transactions/new`}
              className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-emerald-300 px-3 text-xs font-bold text-emerald-950 shadow-[0_8px_22px_rgba(52,211,153,0.18)] transition hover:bg-emerald-200"
            >
              <span className="mr-1.5 text-base leading-none">+</span>
              {isEnglish ? "New transaction" : "Novo lançamento"}
            </Link>


            <form action={`/${locale}/auth/signout`} method="post">
              <button
                type="submit"
                className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/[0.06] px-3 text-xs font-bold text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-500/[0.12] hover:text-rose-100"
              >
                <span className="mr-1.5 text-sm leading-none">↪</span>
                {isEnglish ? "Sign out" : "Sair da conta"}
              </button>
            </form>
          </div>
        )}


        {isCollapsed && (
          <div className="m-3 mt-0 flex flex-col items-center gap-2">
            <Link
              href={`/${locale}/transactions/new`}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300 text-lg font-bold text-emerald-950 shadow-[0_8px_22px_rgba(52,211,153,0.18)] transition hover:bg-emerald-200"
              title={isEnglish ? "New transaction" : "Novo lançamento"}
            >
              +
            </Link>


            <form action={`/${locale}/auth/signout`} method="post">
              <button
                type="submit"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/[0.06] text-sm font-bold text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-500/[0.12] hover:text-rose-100"
                title={isEnglish ? "Sign out" : "Sair da conta"}
              >
                ↪
              </button>
            </form>
          </div>
        )}
      </aside>


      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-cyan-500 font-black text-slate-950">
              ƒ
            </span>


            <span className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-[-0.04em] text-white">
              Finance Control
            </span>
          </Link>


          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/transactions/new`}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-300 px-3 text-sm font-bold text-emerald-950 shadow-[0_8px_22px_rgba(52,211,153,0.2)]"
            >
              <span className="mr-1 text-base leading-none">+</span>
              {isEnglish ? "Add" : "Adicionar"}
            </Link>


            <form action={`/${locale}/auth/signout`} method="post">
              <button
                type="submit"
                aria-label={isEnglish ? "Sign out" : "Sair da conta"}
                title={isEnglish ? "Sign out" : "Sair da conta"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/[0.06] text-sm font-bold text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-500/[0.12] hover:text-rose-100"
              >
                ↪
              </button>
            </form>
          </div>
        </div>


        <nav
          aria-label={isEnglish ? "Main navigation" : "Navegação principal"}
          className="flex gap-2 overflow-x-auto px-3 pb-3"
        >
          {navigationItems.map((item) => {
            const isActive = item.matches(pathname);


            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-emerald-300/35 bg-emerald-300/15 text-emerald-100"
                    : "border-white/10 bg-white/[0.045] text-slate-400 hover:bg-white/[0.08] hover:text-slate-100"
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {isEnglish ? item.labelEn : item.labelPt}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}