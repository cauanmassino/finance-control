"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

type AppSidebarProps = {
  locale: string;
};

type NavItem = {
  title: string;
  url: string;
};

export function AppSidebar({locale}: AppSidebarProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      title: "Início",
      url: `/${locale}`,
    },
    {
      title: "Contas",
      url: `/${locale}/accounts`,
    },
    {
      title: "Lançamentos",
      url: `/${locale}/transactions`,
    },
    {
      title: "Categorias",
      url: `/${locale}/categories`,
    },
    {
      title: "Relatórios",
      url: `/${locale}/reports`,
  },
    {
      title: "Recorrências",
      url: `/${locale}/recurring`,
  },
  ];

  return (
    <aside className="w-full border-b bg-background md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:block md:px-5 md:py-6">
        <Link
          href={`/${locale}`}
          className="text-lg font-bold tracking-tight"
        >
          Finance Control
        </Link>

        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-1 overflow-x-auto md:mt-8 md:flex-col md:items-stretch md:gap-1"
        >
          {items.map((item) => {
            const isHome = item.url === `/${locale}`;

            const isActive = isHome
              ? pathname === item.url
              : pathname === item.url ||
                pathname.startsWith(`${item.url}/`);

            return (
              <Link
                key={item.url}
                href={item.url}
                className={[
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "md:block",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}