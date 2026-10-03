"use client";

import {useState} from "react";
import {AppNavigation} from "@/components/layouts/app-navigation";

type AppShellProps = {
  locale: string;
  children: React.ReactNode;
};

export function AppShell({
  locale,
  children,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-dvh bg-slate-950">
      <AppNavigation
        locale={locale}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div
        className={`min-h-dvh transition-[padding] duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20" : "lg:pl-[17.5rem]"
        }`}
      >
        <main className="min-h-dvh px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}