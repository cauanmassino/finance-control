"use client";

import {AppNavigation} from "@/components/layouts/app-navigation";
import {useState} from "react";

type AppNavigationClientProps = {
  locale: string;
};

export default function AppNavigationClient({locale}: AppNavigationClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <AppNavigation 
        locale={locale} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      <style jsx global>{`
        @media (min-width: 1024px) {
          .lg\\:pl-\\[17\\.5rem\\] {
            padding-left: ${isCollapsed ? "5rem" : "17.5rem"} !important;
            transition: padding-left 0.3s ease;
          }
        }
      `}</style>
    </>
  );
}