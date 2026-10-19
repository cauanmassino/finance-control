"use client";

import {useState} from "react";
import {usePathname} from "next/navigation";
import {AppNavigation} from "@/components/layouts/app-navigation";
import {CopilotPanel} from "../copilot/copilot-panel";

type AppShellProps = {
  locale: string;
  children: React.ReactNode;
};

export function AppShell({locale, children}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const page = pathname?.split("/").filter(Boolean)[1] ?? "";

  return (
    <div className="finco-app min-h-dvh bg-slate-950" data-finco-page={page}>
      <AppNavigation
        locale={locale}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div
        className={`min-h-dvh transition-[padding] duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20" : "lg:pl-70"
        }`}
      >
        <main className="min-h-dvh px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">
          {children}
        </main>
      </div>
      <CopilotPanel locale={locale} />
    </div>
  );
}
