"use client";

import Link from "next/link";
import {useEffect} from "react";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
};

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps) {
  useEffect(() => {
    console.error("Erro não tratado na área autenticada:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold text-red-600">
          Algo deu errado
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Não foi possível carregar esta página
        </h1>

        <p className="mt-3 text-muted-foreground">
          Tente novamente. Se o problema continuar, volte para a visão geral.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>

          <Link
            href="/pt"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Voltar para início
          </Link>
        </div>
      </section>
    </main>
  );
}