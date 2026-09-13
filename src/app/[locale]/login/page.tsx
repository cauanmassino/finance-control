import Link from "next/link";
import {redirect} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {signIn} from "../auth/actions";

type LoginPageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{error?: string; message?: string}>;
};

export default async function LoginPage({
  params,
  searchParams
}: LoginPageProps) {
  const {locale} = await params;
  const {error, message} = await searchParams;

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
            {isEnglish ? "Welcome back" : "Bem-vindo de volta"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form action={signIn} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />

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
                autoComplete="current-password"
                required
              />
            </div>

            {message ? (
              <p className="rounded-md border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-300">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            >
              {isEnglish ? "Sign in" : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isEnglish ? "Don't have an account?" : "Ainda não possui uma conta?"}{" "}
            <Link
              className="font-medium text-emerald-400 hover:text-emerald-300"
              href={`/${locale}/register`}
            >
              {isEnglish ? "Create account" : "Criar conta"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}