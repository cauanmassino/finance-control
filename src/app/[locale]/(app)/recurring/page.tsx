import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryIcon} from "@/components/categories/category-icon";
import {RecurringActions} from "@/components/recurring/recurring-actions";

export const metadata: Metadata = {title: "Recorrências", description: "Sua rotina financeira, organizada."};
type Item = {id: string; description: string; amount: number | string; type: "income" | "expense"; frequency: "weekly" | "monthly" | "yearly"; next_occurrence: string; end_date: string | null; is_active: boolean; account_id: string | null; credit_card_id: string | null; category_id: string | null};
type Account = {id: string; name: string};
type Card = Account & {last_four: string | null; is_active: boolean};
type Category = Account & {color: string | null; icon: string | null};
type Props = {params: Promise<{locale: string}>; searchParams: Promise<{status?: string; q?: string}>};
const columns = "lg:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_2.75rem]";
function Mark({kind}: {kind: "repeat" | "income" | "expense"}) {
 return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{kind === "repeat" ? <><path d="M20 7h-9a5 5 0 0 0-5 5v1M4 17h9a5 5 0 0 0 5-5v-1"/><path d="m17 4 3 3-3 3M7 14l-3 3 3 3"/></> : kind === "income" ? <><path d="M6 17 18 5M7 5h11v11"/><path d="M5 21h14"/></> : <><path d="M6 5 18 17M7 17h11V6"/><path d="M5 21h14"/></>}</svg>;
}
export default async function RecurringPage({params, searchParams}: Props) {
 const locale = (await params).locale === "en" ? "en" : "pt";
 const en = locale === "en";
 const query = await searchParams;
 const status = query.status === "all" || query.status === "inactive" ? query.status : "active";
 const q = typeof query.q === "string" ? query.q.trim().slice(0,120) : "";
 const supabase = await createClient();
 const {data: {user}} = await supabase.auth.getUser();
 if (!user) redirect(`/${locale}/auth/login`);
 const [seriesResult, accountsResult, cardsResult, categoriesResult] = await Promise.all([
  supabase.from("recurring_transactions").select("id, description, amount, type, frequency, next_occurrence, end_date, is_active, account_id, credit_card_id, category_id").eq("user_id",user.id).order("next_occurrence").order("id"),
  supabase.from("accounts").select("id, name").eq("user_id",user.id),
  supabase.from("credit_cards").select("id, name, last_four, is_active").eq("user_id",user.id),
  supabase.from("categories").select("id, name, color, icon").eq("user_id",user.id),
 ]);
 const error = seriesResult.error || accountsResult.error || cardsResult.error || categoriesResult.error;
 if (error) {console.error("Erro ao carregar recorrências",error); throw new Error(en ? "Could not load recurring items." : "Não foi possível carregar as recorrências.");}
 const items = (seriesResult.data ?? []) as Item[];
 const accounts = new Map(((accountsResult.data ?? []) as Account[]).map(a => [a.id,a]));
 const cards = new Map(((cardsResult.data ?? []) as Card[]).map(c => [c.id,c]));
 const categories = new Map(((categoriesResult.data ?? []) as Category[]).map(c => [c.id,c]));
 const active = items.filter(i => i.is_active);
 const visible = items.filter(i => status === "all" || i.is_active === (status === "active")).filter(i => !q || i.description.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
 const money = (n: number) => new Intl.NumberFormat(en ? "en-US" : "pt-BR",{style:"currency",currency:en ? "USD" : "BRL"}).format(n);
 const date = (s: string) => new Intl.DateTimeFormat(en ? "en-US" : "pt-BR",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${s}T12:00:00`));
 const monthly = (type: string) => active.filter(i => i.type === type && i.frequency === "monthly").reduce((sum,i) => sum + Number(i.amount),0);
 const frequency = {weekly:en ? "Weekly" : "Semanal",monthly:en ? "Monthly" : "Mensal",yearly:en ? "Yearly" : "Anual"};
 const metrics = [{kind:"repeat" as const,label:en ? "Active series" : "Séries ativas",value:String(active.length),detail:en ? `${items.length-active.length} inactive` : `${items.length-active.length} inativas`,color:"text-emerald-200",bg:"bg-emerald-300/10"},{kind:"income" as const,label:en ? "Monthly income" : "Receitas mensais",value:money(monthly("income")),detail:en ? "Active monthly series only" : "Somente séries mensais ativas",color:"text-emerald-200",bg:"bg-emerald-300/10"},{kind:"expense" as const,label:en ? "Monthly expenses" : "Despesas mensais",value:money(monthly("expense")),detail:en ? "Active monthly series only" : "Somente séries mensais ativas",color:"text-rose-200",bg:"bg-rose-300/10"}];
 return <main className="mx-auto w-full max-w-[1440px] space-y-6 pb-10 lg:space-y-7">
  <header className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-emerald-950/20 p-6 sm:p-8">
   <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-28 -z-10 h-72 w-72 rounded-full bg-emerald-300/[0.08] blur-3xl"/>
   <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="app-kicker">{en ? "Your financial routine" : "Sua rotina financeira"}</p><h1 className="mt-2.5 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">{en ? "Recurring items" : "Recorrências"}</h1><p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">{en ? "Predictability for what repeats. Clarity for what comes next." : "Previsibilidade no que se repete. Clareza para o que vem."}</p></div><span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-3 py-2 text-xs font-medium text-emerald-200"><Mark kind="repeat"/>{en ? "Scheduled generation" : "Geração agendada"}</span></div>
  </header>
  <section aria-label={en ? "Recurring summary" : "Resumo das recorrências"} className="grid gap-3 sm:grid-cols-3 lg:gap-4">{metrics.map(k => <article key={k.kind} className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-slate-900/85 to-slate-900/40 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)] sm:p-6"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-slate-400">{k.label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${k.bg} ${k.color}`}><Mark kind={k.kind}/></span></div><p className={`mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.045em] tabular-nums ${k.kind === "repeat" ? "text-white" : k.color}`}>{k.value}</p><p className="mt-2 text-[11px] text-slate-500">{k.detail}</p></article>)}</section>
  <section className="rounded-[1.75rem] border border-white/[0.07] bg-slate-900/45">
   <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 xl:flex-row xl:items-center xl:justify-between sm:p-6"><div className="flex items-center gap-2.5"><h2 className="text-base font-semibold tracking-tight text-white">{en ? "Your recurring items" : "Suas recorrências"}</h2><span className="rounded-lg bg-white/[0.05] px-2 py-1 text-[11px] tabular-nums text-slate-400">{visible.length}</span></div><div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center"><nav aria-label={en ? "Status filter" : "Filtrar por status"} className="flex w-fit shrink-0 rounded-xl bg-slate-950/60 p-1">{([['active',en ? 'Active' : 'Ativas'],['inactive',en ? 'Inactive' : 'Inativas'],['all',en ? 'All' : 'Todas']] as const).map(([key,label]) => <Link key={key} href={`/${locale}/recurring?status=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} aria-current={status === key ? "page" : undefined} className={`rounded-lg px-3 py-2.5 text-xs font-medium transition ${status === key ? "bg-white/[0.08] text-emerald-100 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}>{label}</Link>)}</nav><form method="get" className="flex min-w-0 gap-2 sm:w-72"><input type="hidden" name="status" value={status}/><input name="q" type="search" defaultValue={q} aria-label={en ? "Search recurring items" : "Buscar recorrências"} placeholder={en ? "Search recurring items" : "Buscar recorrências"} className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-slate-950/45 px-3 text-xs text-slate-200 outline-none transition focus:border-emerald-300/40 focus:ring-2 focus:ring-emerald-300/5"/><button type="submit" className="rounded-xl border border-white/[0.07] px-3 text-xs text-slate-300 transition hover:bg-white/[0.04]">{en ? "Search" : "Buscar"}</button></form></div></div>
   <div className={`hidden items-center gap-4 border-b border-white/[0.05] px-6 py-3 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500 lg:grid ${columns}`}><span>{en ? "Recurring item" : "Recorrência"}</span><span>{en ? "Frequency" : "Frequência"}</span><span>{en ? "Next date" : "Próxima data"}</span><span>{en ? "Payment source" : "Conta / cartão"}</span><span className="text-right">{en ? "Amount" : "Valor"}</span><span className="sr-only">{en ? "Actions" : "Ações"}</span></div>
   {visible.length === 0 ? <div className="px-6 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/[0.07] text-emerald-200"><Mark kind="repeat"/></span><h3 className="mt-4 text-sm font-semibold text-slate-200">{en ? "No recurring items in this view" : "Nenhuma recorrência nesta visualização"}</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">{items.length ? (en ? "Try another filter or search term." : "Tente outro filtro ou termo de busca.") : (en ? "Recurring items registered in Transactions appear here." : "As recorrências cadastradas em Lançamentos aparecem aqui.")}</p></div> : <div className="divide-y divide-white/[0.05]">{visible.map(item => {
    const category = item.category_id ? categories.get(item.category_id) : null;
    const card = item.credit_card_id ? cards.get(item.credit_card_id) : null;
    const account = item.account_id ? accounts.get(item.account_id) : null;
    const color = category?.color && /^#[0-9a-fA-F]{6}$/.test(category.color) ? category.color : item.type === "income" ? "#6ee7b7" : "#94a3b8";
    const source = item.credit_card_id ? card?.name ?? (en ? "Card unavailable" : "Cartão indisponível") : account?.name ?? (en ? "No account linked" : "Sem conta vinculada");
    const sourceDetail = item.credit_card_id ? card ? `${en ? "Credit card" : "Cartão de crédito"}${card.last_four ? ` · •••• ${card.last_four}` : ""}${!card.is_active ? (en ? " · Inactive" : " · Inativo") : ""}` : (en ? "Review the card link" : "Confira o vínculo do cartão") : item.account_id && !account ? (en ? "Account not found in loaded data" : "Conta não encontrada nos dados carregados") : account ? (en ? "Bank account" : "Conta bancária") : (en ? "Review this series" : "Confira o cadastro da série");
    const ended = Boolean(item.end_date && item.next_occurrence > item.end_date);
    const state = item.is_active ? (en ? "Active" : "Ativa") : ended ? (en ? "Ended" : "Encerrada") : (en ? "Paused" : "Pausada");
    return <article key={item.id} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-4 p-5 transition-colors hover:bg-white/[0.018] lg:gap-y-0 lg:px-6 lg:py-5 ${columns}`}>
     <div className="order-1 flex min-w-0 items-center gap-3 lg:order-none"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{color,backgroundColor:`${color}16`}}>{category?.icon ? <CategoryIcon name={category.icon} size={19} strokeWidth={1.8}/> : <Mark kind="repeat"/>}</span><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-100" title={item.description}>{item.description}</h3><p className="mt-1 truncate text-[11px] text-slate-500">{category?.name ?? (en ? "No category" : "Sem categoria")}</p></div></div>
     <div className="order-3 min-w-0 lg:order-none"><p className="text-xs text-slate-300">{frequency[item.frequency]}</p><p className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] ${item.is_active ? "text-emerald-200/80" : "text-slate-500"}`}><span aria-hidden="true" className={`h-1 w-1 rounded-full ${item.is_active ? "bg-emerald-300" : "bg-slate-500"}`}/>{state}</p></div>
     <div className="order-5 min-w-0 lg:order-none"><p className="mb-1 text-[10px] text-slate-500 lg:hidden">{en ? "Next date" : "Próxima data"}</p><p className="text-xs tabular-nums text-slate-300">{date(item.next_occurrence)}</p></div>
     <div className="order-6 min-w-0 text-right lg:order-none lg:text-left"><p className="truncate text-xs text-slate-300" title={source}>{source}</p><p className="mt-1 truncate text-[10px] text-slate-500" title={sourceDetail}>{sourceDetail}</p></div>
     <p className={`order-2 text-right text-sm font-semibold tracking-tight tabular-nums lg:order-none ${item.type === "income" ? "text-emerald-200" : "text-rose-200"}`}>{item.type === "income" ? "+" : "−"}{money(Number(item.amount))}</p>
     <div className="order-4 justify-self-end lg:order-none"><RecurringActions locale={locale} recurringId={item.id} isActive={item.is_active}/></div>
    </article>;
   })}</div>}
  </section>
  <div className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-500"><span className="mt-0.5 shrink-0 text-emerald-300/50"><Mark kind="repeat"/></span><p>{en ? "Due entries are processed by the scheduled job. Pausing preserves existing transactions; resuming may process overdue dates." : "As ocorrências vencidas são processadas pelo agendamento. Pausar preserva o histórico; retomar pode processar datas atrasadas."}</p></div>
 </main>;
}
