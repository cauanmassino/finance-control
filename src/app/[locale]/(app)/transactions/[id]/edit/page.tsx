import type {Metadata} from "next";
import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {EditTransactionForm} from "@/components/transactions/edit-transaction-form";

export const metadata: Metadata = {
  title: "Editar lançamento",
  description: "Atualize uma receita ou despesa.",
};

type EditTransactionPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

type SupportedLocale = "pt" | "en";

type Account = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  occurred_on: string;
  account_id: string | null;
  category_id: string | null;
  payment_method: string | null;
  notes: string | null;
};

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === "pt" || locale === "en";
}

export default async function EditTransactionPage({
  params,
}: EditTransactionPageProps) {
  const {locale, id} = await params;
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [
    {data: transaction, error: transactionError},
    {data: accounts, error: accountsError},
    {data: categories, error: categoriesError},
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select(`
        id,
        description,
        amount,
        type,
        occurred_on,
        account_id,
        category_id,
        payment_method,
        notes
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("categories")
      .select("id, name, type, icon")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),
  ]);

  if (transactionError) {
    throw new Error("Não foi possível carregar o lançamento.");
  }

  if (!transaction) {
    notFound();
  }

  if (accountsError) {
    throw new Error("Não foi possível carregar as contas.");
  }

  if (categoriesError) {
    throw new Error("Não foi possível carregar as categorias.");
  }

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
          Editar lançamento
        </h1>

        <p className="mt-2 text-muted-foreground">
          Atualize as informações da sua receita ou despesa.
        </p>
      </div>

      <EditTransactionForm
        locale={formLocale}
        accounts={(accounts ?? []) as Account[]}
        categories={(categories ?? []) as Category[]}
        transaction={
          {
            ...transaction,
            amount: Number(transaction.amount),
          } as Transaction
        }
      />
    </main>
  );
}