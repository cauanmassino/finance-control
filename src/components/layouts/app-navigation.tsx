"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { usePathname } from "next/navigation"

type AppNavigationProps = {
  locale: string
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}

type NavigationItem = {
  href: string
  labelPt: string
  labelEn: string
  icon: string
  matches: (pathname: string) => boolean
}

type BrandLogoProps = {
  compact?: boolean
  className?: string
}

function BrandLogo({
  compact = false,
  className = "",
}: BrandLogoProps) {
  if (compact) {
    return (
      <span
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200/20 bg-gradient-to-br from-[#0d2943] via-[#0b1832] to-[#07201e] shadow-[0_12px_30px_rgba(0,0,0,0.28)] ${className}`}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.25),transparent_36%),radial-gradient(circle_at_75%_85%,rgba(52,211,153,0.22),transparent_34%)]"
        />

        <Image
          src="/brand/finco-simbolo.png"
          alt="FINCO"
          width={44}
          height={44}
          priority
          className="relative z-10 h-9 w-9 object-contain"
        />
      </span>
    )
  }

  return (
    <span
      className={`relative flex h-14 min-w-0 items-center overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-r from-white/[0.075] via-white/[0.035] to-emerald-300/[0.07] px-3 shadow-[0_12px_32px_rgba(0,0,0,0.18)] ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute -left-8 -top-10 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl"
      />

      <span
        aria-hidden="true"
        className="absolute -right-10 -bottom-12 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl"
      />

      <Image
        src="/brand/finco-logo.png"
        alt="FINCO"
        width={180}
        height={68}
        priority
        className="relative z-10 h-20 w-auto max-w-[10.5rem] object-contain object-left"
      />
    </span>
  )
}

function MobileBrandLogo() {
  return (
    <span className="flex min-w-0 items-center">
      <Image
        src="/brand/finco.png"
        alt="FINCO"
        width={149}
        height={44}
        priority
        className="h-9 w-auto max-w-[8.8rem] object-contain object-left"
      />
    </span>
  )
}

export function AppNavigation({
  locale,
  isCollapsed,
  setIsCollapsed,
}: AppNavigationProps) {
  const pathname = usePathname()
  const isEnglish = locale === "en"

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const mobileMenuId = useId()
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileMenuPanelRef = useRef<HTMLElement>(null)

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
      href: `/${locale}/cards`,
      labelPt: "Cartões",
      labelEn: "Cards",
      icon: "▤",
      matches: (path) => path.startsWith(`/${locale}/cards`),
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
      href: `/${locale}/goals`,
      labelPt: "Metas e objetivos",
      labelEn: "Goals",
      icon: "◎",
      matches: (path) => path.startsWith(`/${locale}/goals`),
    },
    {
      href: `/${locale}/reports`,
      labelPt: "Relatórios",
      labelEn: "Reports",
      icon: "⌁",
      matches: (path) => path.startsWith(`/${locale}/reports`),
    },
  ]

  const appPages = navigationItems.some((item) => item.matches(pathname))

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false)
        mobileMenuButtonRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    window.setTimeout(() => {
      const firstFocusableElement =
        mobileMenuPanelRef.current?.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

      firstFocusableElement?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMobileMenuOpen])

  if (!appPages) {
    return null
  }

  const getLabel = (item: NavigationItem) =>
    isEnglish ? item.labelEn : item.labelPt

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)

    window.setTimeout(() => {
      mobileMenuButtonRef.current?.focus()
    }, 0)
  }

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-white/[0.08] bg-[#050918] shadow-[24px_0_70px_rgba(0,0,0,0.28)] transition-[width] duration-300 ease-out lg:flex ${
          isCollapsed ? "w-20" : "w-[17.5rem]"
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_4%,rgba(34,211,238,0.11),transparent_24%),radial-gradient(circle_at_90%_26%,rgba(52,211,153,0.08),transparent_25%),linear-gradient(180deg,rgba(15,23,42,0.3),transparent_42%)]"
        />

        <div
          className={`relative border-b border-white/[0.08] ${
            isCollapsed ? "px-3 py-4" : "px-4 py-5"
          }`}
        >
          <Link
            href={`/${locale}/dashboard`}
            className={`group flex min-h-14 rounded-2xl transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
              isCollapsed
                ? "justify-center"
                : "items-center gap-3 pr-11"
            }`}
            title={
              isCollapsed
                ? isEnglish
                  ? "Dashboard"
                  : "Visão geral"
                : undefined
            }
          >
            <BrandLogo compact={isCollapsed} />
          </Link>

          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              aria-label={
                isEnglish ? "Expand sidebar" : "Expandir menu lateral"
              }
              title={isEnglish ? "Expand menu" : "Expandir menu"}
              className="mx-auto mt-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.045] text-slate-400 transition hover:border-emerald-300/30 hover:bg-emerald-300/[0.1] hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ☰
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              aria-label={
                isEnglish ? "Collapse sidebar" : "Recolher menu lateral"
              }
              title={isEnglish ? "Collapse menu" : "Recolher menu"}
              className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-500 transition hover:border-white/[0.08] hover:bg-white/[0.055] hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ☰
              </span>
            </button>
          )}
        </div>

        <nav
          aria-label={isEnglish ? "Main navigation" : "Navegação principal"}
          className="relative flex-1 space-y-1 overflow-y-auto px-3 py-6"
        >
          {!isCollapsed ? (
            <div className="mb-4 flex items-center gap-2 px-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.95)]" />

              <p className="font-[family-name:var(--font-display)] text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                {isEnglish ? "Financial workspace" : "Área financeira"}
              </p>
            </div>
          ) : null}

          {navigationItems.map((item) => {
            const isActive = item.matches(pathname)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? getLabel(item) : undefined}
                className={`group relative flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                  isCollapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-300/[0.18] via-cyan-300/[0.09] to-transparent text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_12px_30px_rgba(16,185,129,0.08)]"
                    : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"
                }`}
              >
                {isActive ? (
                  <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-gradient-to-b from-cyan-300 via-emerald-300 to-emerald-400 shadow-[0_0_16px_rgba(110,231,183,0.95)]" />
                ) : null}

                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-300/[0.16] text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.12)]"
                      : "bg-white/[0.045] text-slate-500 group-hover:bg-white/[0.075] group-hover:text-slate-200"
                  }`}
                >
                  {item.icon}
                </span>

                {!isCollapsed ? (
                  <span className="truncate">{getLabel(item)}</span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {!isCollapsed ? (
          <div className="relative border-t border-white/[0.08] p-3">
            <div className="relative overflow-hidden rounded-[1.4rem] border border-white/[0.1] bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-emerald-300/[0.055] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.2)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl"
              />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xs font-semibold tracking-[-0.02em] text-white">
                    {isEnglish ? "Your financial space" : "Seu espaço financeiro"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {isEnglish
                      ? "Make each choice count."
                      : "Faça cada escolha valer."}
                  </p>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-sm text-emerald-200">
                  ✦
                </span>
              </div>

              <Link
                href={`/${locale}/transactions/new`}
                className="relative mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 via-emerald-300 to-cyan-300 px-3 text-xs font-extrabold text-slate-950 shadow-[0_10px_24px_rgba(52,211,153,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
              >
                <span className="mr-1.5 text-base leading-none">+</span>
                {isEnglish ? "New transaction" : "Novo lançamento"}
              </Link>

              <form action={`/${locale}/auth/signout`} method="post">
                <button
                  type="submit"
                  className="relative mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-300/[0.18] bg-rose-400/[0.045] px-3 text-xs font-semibold text-rose-200 transition hover:border-rose-300/[0.35] hover:bg-rose-400/[0.1] hover:text-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                  <span className="mr-1.5 text-sm leading-none">↪</span>
                  {isEnglish ? "Sign out" : "Sair da conta"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-2 border-t border-white/[0.08] p-3">
            <Link
              href={`/${locale}/transactions/new`}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 text-lg font-bold text-slate-950 shadow-[0_8px_22px_rgba(52,211,153,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
              title={isEnglish ? "New transaction" : "Novo lançamento"}
              aria-label={isEnglish ? "New transaction" : "Novo lançamento"}
            >
              +
            </Link>

            <form action={`/${locale}/auth/signout`} method="post">
              <button
                type="submit"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-300/[0.18] bg-rose-400/[0.045] text-sm font-bold text-rose-200 transition hover:border-rose-300/[0.35] hover:bg-rose-400/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                title={isEnglish ? "Sign out" : "Sair da conta"}
                aria-label={isEnglish ? "Sign out" : "Sair da conta"}
              >
                ↪
              </button>
            </form>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#050918]/95 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            aria-label={isEnglish ? "Open navigation menu" : "Abrir menu"}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.045] text-lg text-slate-100 transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <Link
            href={`/${locale}/dashboard`}
            className="flex min-w-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <MobileBrandLogo />
          </Link>

          <Link
            href={`/${locale}/transactions/new`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-3 text-sm font-extrabold text-slate-950 shadow-[0_8px_22px_rgba(52,211,153,0.2)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
          >
            <span className="mr-1 text-base leading-none">+</span>
            {isEnglish ? "Add" : "Adicionar"}
          </Link>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={isEnglish ? "Close navigation menu" : "Fechar menu"}
            onClick={closeMobileMenu}
            className="absolute inset-0 cursor-default bg-slate-950/80 backdrop-blur-sm"
          />

          <aside
            id={mobileMenuId}
            ref={mobileMenuPanelRef}
            aria-label={isEnglish ? "Main navigation" : "Navegação principal"}
            className="relative flex h-full w-[min(21rem,calc(100vw-2.5rem))] flex-col overflow-hidden border-r border-white/[0.1] bg-[#050918] shadow-[24px_0_70px_rgba(0,0,0,0.5)]"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_94%_30%,rgba(52,211,153,0.09),transparent_26%)]"
            />

            <div className="relative flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
              <Link
                href={`/${locale}/dashboard`}
                onClick={closeMobileMenu}
                className="flex min-w-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <MobileBrandLogo />
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label={isEnglish ? "Close navigation menu" : "Fechar menu"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.045] text-lg text-slate-200 transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <nav
              aria-label={isEnglish ? "Main navigation" : "Navegação principal"}
              className="relative flex-1 overflow-y-auto px-3 py-6"
            >
              <div className="mb-4 flex items-center gap-2 px-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.95)]" />

                <p className="font-[family-name:var(--font-display)] text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {isEnglish ? "Financial workspace" : "Área financeira"}
                </p>
              </div>

              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = item.matches(pathname)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      aria-current={isActive ? "page" : undefined}
                      className={`group relative flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-300/[0.18] via-cyan-300/[0.09] to-transparent text-emerald-100"
                          : "text-slate-300 hover:bg-white/[0.055] hover:text-white"
                      }`}
                    >
                      {isActive ? (
                        <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-gradient-to-b from-cyan-300 via-emerald-300 to-emerald-400 shadow-[0_0_16px_rgba(110,231,183,0.95)]" />
                      ) : null}

                      <span
                        aria-hidden="true"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base ${
                          isActive
                            ? "bg-emerald-300/[0.16] text-emerald-100"
                            : "bg-white/[0.045] text-slate-400"
                        }`}
                      >
                        {item.icon}
                      </span>

                      {getLabel(item)}
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="relative border-t border-white/[0.08] p-4">
              <Link
                href={`/${locale}/transactions/new`}
                onClick={closeMobileMenu}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 text-sm font-extrabold text-slate-950 shadow-[0_8px_22px_rgba(52,211,153,0.2)] transition hover:brightness-105"
              >
                <span className="mr-2 text-lg leading-none">+</span>
                {isEnglish ? "New transaction" : "Novo lançamento"}
              </Link>

              <form action={`/${locale}/auth/signout`} method="post">
                <button
                  type="submit"
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-rose-300/[0.18] bg-rose-400/[0.045] px-4 text-sm font-semibold text-rose-200 transition hover:border-rose-300/[0.35] hover:bg-rose-400/[0.1] hover:text-rose-100"
                >
                  <span className="mr-2 text-base leading-none">↪</span>
                  {isEnglish ? "Sign out" : "Sair da conta"}
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}