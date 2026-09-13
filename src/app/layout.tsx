import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Control",
  description: "Plataforma de gestão financeira pessoal"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}