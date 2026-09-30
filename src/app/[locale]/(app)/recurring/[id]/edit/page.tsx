import type {Metadata} from "next";
import Link from "next/link";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {EditRecurringForm} from "@/components/recurring/edit-recurring-form";

export const metadata: Metadata = {
  title: "Editar recorrência",
  description: "Atualize uma receita ou despesa recorrente.",
};

type EditRecurringPageProps = {
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

type RecurringTransaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  account_id: string | null;
  category_id: string | null;
  payment_method: string | null;
  notes: string | null;
  frequency: "weekly" | "monthly" | "yearly";
  start_date: string;
  next_occurrence: string;
  end_date: string | null;
  is_active: boolean;
};

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locale === "pt" || locale === "en";
}

export default async function EditRecurringPage({
  params,
}: EditRecurringPageProps) {
  const {locale, id} = await params;
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const [
    {data: recurringTransaction, error: recurringError},
    {data: accounts, error: accountsError},
    {data: categories, error: categoriesError},
  ] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select(`
        id,
        description,
        amount,
        type,
        account_id,
        category_id,
        payment_method,
        notes,
        frequency,
        start_date,
        next_occurrence,
        end_date,
        is_active
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

  if (recurringError) {
    throw new Error("Não foi possível carregar a recorrência.");
  }

  if (!recurringTransaction) {
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
        href={`/${locale}/recurring`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Voltar para recorrências
      </Link>

      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Editar recorrência
        </h1>

        <p className="mt-2 text-muted-foreground">
          Atualize as informações que serão usadas nos próximos lançamentos
          automáticos.
        </p>
      </div>

      <EditRecurringForm
        locale={formLocale}
        accounts={(accounts ?? []) as Account[]}
        categories={(categories ?? []) as Category[]}
        recurringTransaction={
          {
            ...recurringTransaction,
            amount: Number(recurringTransaction.amount),
          } as RecurringTransaction
        }
      />
    </main>
  );
}