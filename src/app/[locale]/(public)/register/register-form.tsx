"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createClient} from "@/lib/supabase/client";

type RegisterFormProps = {
  locale: "pt" | "en";
};

export function RegisterForm({
  locale,
}: RegisterFormProps) {
  const searchParams = useSearchParams();
  const isEnglish = locale === "en";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error"),
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError(
        isEnglish
          ? "Please enter your full name."
          : "Informe seu nome completo.",
      );
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError(
        isEnglish
          ? "Enter a valid email address."
          : "Informe um e-mail válido.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        isEnglish
          ? "Your password must contain at least 8 characters."
          : "A senha precisa ter pelo menos 8 caracteres.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        isEnglish
          ? "The passwords do not match."
          : "As senhas não coincidem.",
      );
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const {data, error: signUpError} = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(
        signUpError.message === "User already registered"
          ? isEnglish
            ? "An account with this email already exists. Sign in instead."
            : "Já existe uma conta com este e-mail. Entre na sua conta."
          : signUpError.message,
      );

      setIsLoading(false);
      return;
    }

    if (data.session) {
      window.location.assign(`/${locale}/dashboard`);
      return;
    }

    setSuccessMessage(
      isEnglish
        ? "Account created. Check your email to confirm your registration before signing in."
        : "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.",
    );

    setIsLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <Link
            href={`/${locale}`}
            className="mb-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            {isEnglish ? "Back to home" : "Voltar ao início"}
          </Link>

          <p className="text-sm font-medium text-emerald-400">
            Finance Control
          </p>

          <CardTitle className="text-2xl">
            {isEnglish ? "Create your account" : "Crie sua conta"}
          </CardTitle>

          <p className="text-sm leading-6 text-slate-400">
            {isEnglish
              ? "Start organizing your finances with more clarity."
              : "Comece a organizar suas finanças com mais clareza."}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                {isEnglish ? "Full name" : "Nome completo"}
              </Label>

              <Input
                id="fullName"
                name="full_name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={isEnglish ? "Your name" : "Seu nome"}
                autoComplete="name"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>

              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {isEnglish ? "Password" : "Senha"}
              </Label>

              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                disabled={isLoading}
                required
              />

              <p className="text-xs text-slate-400">
                {isEnglish
                  ? "Use at least 8 characters."
                  : "Use pelo menos 8 caracteres."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {isEnglish ? "Confirm password" : "Confirme sua senha"}
              </Label>

              <Input
                id="confirmPassword"
                name="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                disabled={isLoading}
                required
              />

              {confirmPassword && password !== confirmPassword ? (
                <p className="text-xs text-rose-300">
                  {isEnglish
                    ? "The passwords do not match."
                    : "As senhas não coincidem."}
                </p>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-300"
              >
                {error}
              </p>
            ) : null}

            {successMessage ? (
              <div className="rounded-md border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                <p>{successMessage}</p>

                <Link
                  href={`/${locale}/auth/login`}
                  className="mt-2 inline-flex font-semibold text-emerald-300 transition hover:text-emerald-200"
                >
                  {isEnglish ? "Go to sign in" : "Ir para o login"}
                </Link>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isLoading || Boolean(successMessage)}
              className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {isLoading
                ? isEnglish
                  ? "Creating account..."
                  : "Criando conta..."
                : isEnglish
                  ? "Create account"
                  : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isEnglish ? "Already have an account?" : "Já possui uma conta?"}{" "}
            <Link
              className="font-medium text-emerald-400 hover:text-emerald-300"
              href={`/${locale}/auth/login`}
            >
              {isEnglish ? "Sign in" : "Entrar"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}