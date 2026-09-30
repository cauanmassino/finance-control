import type {ReactNode} from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <main className="min-h-screen bg-[#080d19]">
      {children}
    </main>
  );
}