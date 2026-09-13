import Link from "next/link";
import {redirect} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {signUp} from "../auth/actions";

type RegisterPageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string}>;
};

export default async function RegisterPage({
  params,
  searchParams
}: RegisterPageProps) {
  const {locale} = await params;
  const {error} = await searchParams;

  if (locale !== "pt" && locale !== "en") {
    redirect("/pt");
  }

  const isEnglish = locale === "en";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white">
        <CardHeader>
          <p className="text-sm font-medium text-emerald-400">Finance Control</p>
          <CardTitle className="text-2xl">
            {isEnglish ? "Create your account" : "Crie sua conta"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form action={signUp} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />

            <div className="space-y-2">
              <Label htmlFor="fullName">
                {isEnglish ? "Full name" : "Nome completo"}
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder={isEnglish ? "Your name" : "Seu nome"}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@email.com"
                autoComplete="email"
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
                minLength={8}
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-slate-400">
                {isEnglish
                  ? "Use at least 8 characters."
                  : "Use pelo menos 8 caracteres."}
              </p>
            </div>

            {error ? (
              <p className="rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {isEnglish ? "Create account" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isEnglish ? "Already have an account?" : "Já possui uma conta?"}{" "}
            <Link
              className="font-medium text-emerald-400 hover:text-emerald-300"
              href={`/${locale}/login`}
            >
              {isEnglish ? "Sign in" : "Entrar"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}