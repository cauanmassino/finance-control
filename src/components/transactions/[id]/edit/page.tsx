import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {EditTransactionForm} from "@/components/transactions/edit-transaction-form";

type EditTransactionPageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

type SupportedLocale = "pt" | "en";

type TransactionType = "income" | "expense";

type TransactionStatus = "paid" | "pending";

type Account = {
  id: string;
  name: string;
  color: string;
};

type Category = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
};

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  account_id: string | null;
  category_id: string | null;
  occurred_on: string;
  payment_method: string | null;
  status: TransactionStatus;
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
        account_id,
        category_id,
        occurred_on,
        payment_method,
        status,
        notes
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("accounts")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),

    supabase
      .from("categories")
      .select("id, name, type, color, icon")
      .eq("user_id", user.id)
      .order("name", {ascending: true}),
  ]);

  if (transactionError) {
    console.error("Erro ao carregar lançamento:", transactionError);

    throw new Error("Não foi possível carregar o lançamento.");
  }

  if (!transaction) {
    notFound();
  }

  if (accountsError) {
    console.error("Erro ao carregar contas:", accountsError);

    throw new Error("Não foi possível carregar as contas.");
  }

  if (categoriesError) {
    console.error("Erro ao carregar categorias:", categoriesError);

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
          Atualize as informações deste lançamento.
        </p>
      </div>

      <EditTransactionForm
        locale={formLocale}
        transaction={transaction as Transaction}
        accounts={(accounts ?? []) as Account[]}
        categories={(categories ?? []) as Category[]}
      />
    </main>
  );
}