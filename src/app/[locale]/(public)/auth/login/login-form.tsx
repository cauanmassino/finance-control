"use client";

import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

type LoginFormProps = {
  locale: "pt" | "en";
};

function getSafeNextPath(next: string | null, locale: string) {
  const fallback = `/${locale}/dashboard`;

  if (!next || !next.startsWith(`/${locale}/`)) {
    return fallback;
  }

  return next;
}

export function LoginForm({
  locale,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEnglish = locale === "en";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = getSafeNextPath(searchParams.get("next"), locale);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const {error: loginError} = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(
        loginError.message === "Invalid login credentials"
          ? isEnglish
            ? "Incorrect email or password."
            : "E-mail ou senha incorretos."
          : loginError.message,
      );

      setIsLoading(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          {isEnglish ? "Back to home" : "Voltar ao início"}
        </Link>

        <div className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            Finance Control
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-white">
            {isEnglish ? "Welcome back" : "Bem-vindo de volta"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Sign in to continue managing your finances."
              : "Acesse sua conta para continuar."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              {isEnglish ? "Password" : "Senha"}
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isLoading}
              placeholder={isEnglish ? "Your password" : "Sua senha"}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-300 px-4 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? isEnglish
                ? "Signing in..."
                : "Entrando..."
              : isEnglish
                ? "Sign in"
                : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isEnglish
            ? "Don't have an account yet?"
            : "Ainda não possui uma conta?"}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            {isEnglish ? "Create a free account" : "Criar conta grátis"}
          </Link>
        </p>
      </section>
    </main>
  );
}