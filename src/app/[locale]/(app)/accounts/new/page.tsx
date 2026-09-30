import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {AccountForm} from "@/components/accounts/account-form";

export const metadata: Metadata = {
  title: "Nova conta",
  description: "Cadastre uma nova conta financeira.",
};

type NewAccountPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function NewAccountPage({
  params,
}: NewAccountPageProps) {
  const {locale} = await params;
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href={`/${locale}/accounts`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Voltar para contas
      </Link>

      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Nova conta
        </h1>

        <p className="mt-2 text-muted-foreground">
          Cadastre uma conta para organizar seus lançamentos financeiros.
        </p>
      </div>

      <AccountForm locale={locale} />
    </main>
  );
}