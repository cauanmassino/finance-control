import type {ReactNode} from "react";
import AppNavigationClient from "./app-navigation-client";

type AppLayoutProps = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export default async function AppLayout({
  children,
  params,
}: AppLayoutProps) {
  const {locale} = await params;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#080d19]">
      <div
        aria-hidden="true"
        className="app-grid pointer-events-none fixed inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_72%)]"
      />
      <AppNavigationClient locale={locale} />
      <div className="lg:pl-[17.5rem]">
        <main className="mx-auto w-full max-w-[94rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}