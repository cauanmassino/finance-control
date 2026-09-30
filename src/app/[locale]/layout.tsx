import type {ReactNode} from "react";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  await params;

  return <>{children}</>;
}