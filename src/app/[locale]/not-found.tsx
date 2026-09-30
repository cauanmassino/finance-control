import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Erro 404</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Página não encontrada
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          A página que você tentou acessar não existe ou foi movida.
        </p>

        <Link
          href="/pt/dashboard"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </main>
  );
}