import {AppShell} from "@/components/layout/app-shell";

type AppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function AppLayout({
  children,
  params,
}: AppLayoutProps) {
  const {locale} = await params;

  return (
    <AppShell locale={locale}>
      {children}
    </AppShell>
  );
}