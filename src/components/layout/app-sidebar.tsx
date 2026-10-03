"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

type AppSidebarProps = {
  locale: string;
};

const navigationItems = [
  {
    href: "/dashboard",
    label: "Visão geral",
    labelEn: "Overview",
    icon: "✦",
  },
  {
    href: "/financial-health",
    label: "Saúde financeira",
    labelEn: "Financial health",
    icon: "◒",
  },
  {
    href: "/transactions",
    label: "Lançamentos",
    labelEn: "Transactions",
    icon: "⇅",
  },
  {
    href: "/transfers",
    label: "Transferências",
    labelEn: "Transfers",
    icon: "⇄",
  },
  {
    href: "/accounts",
    label: "Contas",
    labelEn: "Accounts",
    icon: "▣",
  },
  {
    href: "/cards",
    label: "Cartões",
    labelEn: "Cards",
    icon: "▤",
  },
  {
    href: "/categories",
    label: "Categorias",
    labelEn: "Categories",
    icon: "⊙",
  },
  {
    href: "/recurring",
    label: "Recorrências",
    labelEn: "Recurring",
    icon: "↻",
  },
  {
    href: "/reports",
    label: "Relatórios",
    labelEn: "Reports",
    icon: "⌁",
  },
];

export function AppSidebar({locale}: AppSidebarProps) {
  const pathname = usePathname();
  const currentLocale = locale === "en" ? "en" : "pt";
  const isEnglish = currentLocale === "en";

  return (
    <aside className="w-full shrink-0 border-b border-white/[0.08] bg-[#070d1e] md:w-72 md:border-b-0 md:border-r">
      <div className="flex h-16 items-center justify-between gap-4 border-b border-white/[0.08] px-5 sm:px-6">
        <Link
          href={`/${currentLocale}/dashboard`}
          className="flex items-center gap-3 text-sm font-bold tracking-tight text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-emerald-300 text-sm font-black text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.3)]">
            ƒ
          </span>

          <span>Finance Control</span>
        </Link>

        <Link
          href={`/${currentLocale}/transactions/new`}
          className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 text-xs font-bold text-slate-950 shadow-[0_10px_24px_rgba(45,212,191,0.16)] transition hover:-translate-y-0.5 hover:from-emerald-200 hover:to-cyan-200"
        >
          + {isEnglish ? "Add" : "Adicionar"}
        </Link>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:flex-col md:overflow-visible md:px-4 md:py-4">
        {navigationItems.map((item) => {
          const href = `/${currentLocale}${item.href}`;

          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.href}
              href={href}
              className={`group flex shrink-0 items-center gap-3 rounded-full border px-3.5 py-2.5 text-xs font-semibold transition md:rounded-xl md:text-sm ${
                isActive
                  ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.08)]"
                  : "border-transparent text-slate-400 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 items-center justify-center rounded-lg text-sm transition ${
                  isActive
                    ? "bg-emerald-300/15 text-emerald-200"
                    : "bg-white/[0.05] text-slate-500 group-hover:text-slate-200"
                }`}
              >
                {item.icon}
              </span>

              <span>{isEnglish ? item.labelEn : item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-white/[0.08] px-5 py-4 md:block">
        <p className="text-xs text-slate-500">
          {isEnglish
            ? "Personal financial control"
            : "Controle financeiro pessoal"}
        </p>
      </div>
    </aside>
  );
}