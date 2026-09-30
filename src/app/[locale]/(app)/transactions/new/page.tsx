import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {TransactionForm} from "@/components/transactions/transaction-form";
import type {Account, Category} from "@/types/database";
import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Novo lançamento",
  description: "Registre uma nova receita ou despesa.",
};

type NewTransactionPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type SupportedLocale = "pt" | "en";

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === "pt" || locale === "en";
}

export default async function NewTransactionPage({
  params,
}: NewTransactionPageProps) {
  const {locale} = await params;
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [
    {data: categories, error: categoriesError},
    {data: accounts, error: accountsError},
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, type, color, icon")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("accounts")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),
  ]);

  if (categoriesError) {
    console.error("Erro ao carregar categorias:", categoriesError);

    throw new Error("Não foi possível carregar as categorias.");
  }

  if (accountsError) {
    console.error("Erro ao carregar contas:", accountsError);

    throw new Error("Não foi possível carregar as contas.");
  }

  /*
   * Seu TransactionForm aceita apenas "pt" ou "en".
   * Se a rota ainda usar outro locale, tratamos como português.
   */
  const formLocale: SupportedLocale = isSupportedLocale(locale)
    ? locale
    : "pt";

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href={`/${locale}/transactions`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Voltar para lançamentos
      </Link>

      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Novo lançamento
        </h1>

        <p className="mt-2 text-muted-foreground">
          Registre uma receita ou uma despesa.
        </p>
      </div>

      <TransactionForm
        locale={formLocale}
        accounts={
          (accounts ?? []) as Pick<Account, "id" | "name" | "color">[]
        }
        categories={
          (categories ?? []) as Pick<
            Category,
            "id" | "name" | "type" | "color" | "icon"
          >[]
        }
      />
    </main>
  );
}