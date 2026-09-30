import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {TransferForm} from "@/components/transfers/transfer-form";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type Account = {
  id: string;
  name: string;
  color: string;
};

export default async function NewTransferPage({
  params,
}: PageProps) {
  const {locale} = await params;

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data, error} = await supabase
    .from("accounts")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name", {ascending: true});

  if (error) {
    console.error("Erro ao carregar contas para transferência:", error);
  }

  const accounts = (data ?? []) as Account[];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Movimentação interna
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white">
            Nova transferência
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Mova dinheiro entre suas contas sem registrar uma receita ou
            despesa.
          </p>
        </div>

        <Link
          href={`/${locale}/transfers`}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Voltar
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-900/70 bg-rose-950/40 p-4 text-sm text-rose-300">
          Não foi possível carregar as contas. Atualize a página e tente
          novamente.
        </div>
      ) : (
        <TransferForm
          locale={locale === "en" ? "en" : "pt"}
          accounts={accounts}
        />
      )}
    </div>
  );
}