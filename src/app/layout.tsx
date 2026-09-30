import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Finance Control",
    template: "%s | Finance Control",
  },
  description:
    "Aplicativo para organizar contas, categorias, lançamentos e relatórios financeiros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}