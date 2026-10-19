import type {Metadata} from "next";
import {DM_Sans} from "next/font/google";
import "./globals.css";
import "./finco-refinements.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-finco",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Finance Control",
    template: "%s | Finance Control",
  },
  description:
    "Organize contas, receitas, despesas, orçamentos e recorrências em um só lugar.",
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="pt-BR">
      <body className={`${dmSans.variable} finco-refined font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
