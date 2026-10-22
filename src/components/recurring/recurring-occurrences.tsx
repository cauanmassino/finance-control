import Link from "next/link";
import {createClient} from "@/lib/supabase/server";

type Props = {locale: string; recurringId: string};
type Occurrence = {id: string; description: string; amount: number | string; occurred_on: string; status: string; credit_card_id: string | null};

export async function RecurringOccurrences({locale, recurringId}: Props) {
  const en = locale === "en";
  const supabase = await createClient();
  const {data: {user}, error: authError} = await supabase.auth.getUser();
  if (authError || !user) return null;
  const {data, error} = await supabase.from("transactions")
    .select("id, description, amount, occurred_on, status, credit_card_id")
    .eq("user_id", user.id).eq("recurring_transaction_id", recurringId)
    .order("occurred_on", {ascending: false}).order("id", {ascending: false}).limit(20);
  if (error) {
    console.error("Erro ao carregar ocorrências", error);
    return <p role="alert" className="mt-4 text-xs text-rose-200">{en ? "Could not load occurrences." : "Não foi possível carregar as ocorrências."}</p>;
  }
  const rows = (data ?? []) as Occurrence[];
  return <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
    <summary className="cursor-pointer text-sm font-semibold text-slate-200">{en ? "Generated occurrences (up to 20 latest)" : "Ocorrências geradas (até 20 mais recentes)"}</summary>
    <p className="mt-2 text-xs leading-5 text-slate-400">{en ? "Editing affects only the selected transaction, not the series." : "A edição afeta somente o lançamento selecionado, não a série."}</p>
    {rows.length === 0 ? <p className="mt-3 text-xs text-slate-400">{en ? "No linked occurrences." : "Nenhuma ocorrência vinculada."}</p> : <ul className="mt-3 divide-y divide-white/10">
      {rows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="text-sm font-medium text-slate-200">{row.description}</p>
          <p className="mt-1 text-xs text-slate-400">{new Intl.DateTimeFormat(en ? "en-US" : "pt-BR").format(new Date(`${row.occurred_on}T12:00:00`))} · {row.status === "paid" ? (en ? "Paid" : "Pago") : (en ? "Pending" : "Pendente")}{row.credit_card_id ? (en ? " · Credit card" : " · Cartão de crédito") : ""}</p>
        </div>
        <div className="flex items-center gap-3"><span className="text-sm text-slate-200">{new Intl.NumberFormat(en ? "en-US" : "pt-BR", {style: "currency", currency: en ? "USD" : "BRL"}).format(Number(row.amount))}</span>
          <Link href={`/${locale}/transactions/${row.id}/edit`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-emerald-200">{en ? "Edit occurrence" : "Editar ocorrência"}</Link>
        </div>
      </li>)}
    </ul>}
  </details>;
}
