"use client";
import Link from "next/link";
import {useActionState,useState,type ReactNode} from "react";
import {useFormStatus} from "react-dom";
import {createTransaction} from "@/app/[locale]/(app)/transactions/actions";
import {updateTransaction,type EditTransactionState} from "@/app/[locale]/(app)/transactions/[id]/edit/actions";
import type {AccountOption,CategoryOption,CardOption,EditableTransaction} from "@/components/transactions/transaction-form-types";

type Type="income"|"expense"|"transfer";
type Method="account"|"pix"|"debit_card"|"card";
type Common={locale:string;accounts:AccountOption[];categories:CategoryOption[];cards:CardOption[]};
type Props=Common&({mode?:"create";initialValues?:never}|{mode:"edit";initialValues:EditableTransaction});
const initialState:EditTransactionState={};
const control="app-input min-h-11 w-full rounded-xl border border-input bg-slate-950 px-3.5 py-2.5 text-base text-foreground outline-none transition-colors focus:border-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm";
function Field({label,children}:{label:string;children:ReactNode}){return <label className="flex min-w-0 flex-col gap-1.5"><span className="text-sm font-medium text-slate-300">{label}</span>{children}</label>;}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function cardData(t?:EditableTransaction){return Boolean(t&&(t.credit_card_id||["card","credit_card","creditcard"].includes(t.payment_method??"")));}
function methodFor(t?:EditableTransaction):Method{if(cardData(t))return "card";if(t?.payment_method==="pix")return "pix";if(["debit_card","debitcard"].includes(t?.payment_method??""))return "debit_card";return "account";}
function Submit({editing,en,blocked}:{editing:boolean;en:boolean;blocked:boolean}){
 const {pending}=useFormStatus();
 return <button type="submit" disabled={pending||blocked} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-300 px-5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50">{pending?(en?"Saving...":"Salvando..."):editing?(en?"Save changes":"Salvar alterações"):(en?"Create transaction":"Criar lançamento")}</button>;
}
export function TransactionForm(props:Props){
 const {locale,accounts,categories,cards}=props;
 const editing=props.mode==="edit";
 const original=props.mode==="edit"?props.initialValues:undefined;
 const en=locale==="en";
 const [state,editAction,editPending]=useActionState(updateTransaction,initialState);
 // In edit mode, the existing record initializes the actual input values.
 const [v,setV]=useState(()=>({
  type:(original?.type??"expense") as Type,
  amount:original?Number(original.amount).toFixed(2).replace(".",","):"",
  description:original?.description??"",
  date:original?.occurred_on.slice(0,10)??today(),
  category:original?.category_id??"",
  method:methodFor(original),
  account:original?.account_id??"",
  card:original?.credit_card_id??"",
  notes:original?.notes??"",
  destination:"",recurring:false,frequency:"monthly",endDate:"",installment:false,installments:"2",
 }));
 const [confirmed,setConfirmed]=useState(false);
 const [showWarning,setShowWarning]=useState(false);
 const transfer=v.type==="transfer";
 const credit=v.method==="card"&&v.type==="expense";
 const inconsistent=Boolean(original?.type==="income"&&(cardData(original)||original?.credit_card_statement_id));
 const warning=editing&&showWarning&&Boolean(state.requiresNegativeBalanceConfirmation&&state.warning);
 const available=categories.filter(c=>c.type===v.type&&(c.is_active!==false||c.id===original?.category_id));
 const selectedCardMissing=Boolean(credit&&v.card&&!cards.some(c=>c.id===v.card));
 const selectedAccountMissing=Boolean(!credit&&v.account&&!accounts.some(a=>a.id===v.account));
 const selectedCategoryMissing=Boolean(v.category&&!available.some(c=>c.id===v.category));
 const grouped=Boolean(original&&(original.recurring_transaction_id||original.installment_plan_id||original.installment_number||(original.total_installments&&original.total_installments>1)));
 function change<K extends keyof typeof v>(key:K,value:(typeof v)[K]){setV(old=>({...old,[key]:value}));setConfirmed(false);setShowWarning(false);}
 function typeChange(type:Type){setV(old=>({...old,type,method:type!=="expense"?"account":old.method,category:categories.some(c=>c.id===old.category&&c.type===type)?old.category:"",installment:type==="expense"?old.installment:false,recurring:type==="transfer"?false:old.recurring}));setConfirmed(false);setShowWarning(false);}
 return <form action={editing?editAction:createTransaction} onSubmit={()=>setShowWarning(true)} className="space-y-6">
  <input name="locale" type="hidden" value={locale}/>
  <input name="payment_method" type="hidden" value={transfer?"transfer":credit?"credit_card":v.method==="card"?"account":v.method}/>
  <input name="payment_status" type="hidden" value={credit?"pending":"paid"}/>
  {editing&&original?<><input name="transaction_id" type="hidden" value={original.id}/><input name="expected_updated_at" type="hidden" value={original.updated_at}/><input name="confirm_negative_balance" type="hidden" value={confirmed?"true":"false"}/></>:null}
  {inconsistent?<p role="alert" className="rounded-2xl bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">{en?"This saved record is income but has a card/statement link. Review its original data before saving.":"O registro salvo está como receita, mas possui vínculo com cartão/fatura. Precisamos conferir os dados originais antes de salvar."}</p>:null}
  <fieldset disabled={editing&&editPending} className="space-y-6">
   <section className="space-y-4">
    <h2 className="text-lg font-semibold text-white">{en?"Transaction details":"Dados do lançamento"}</h2>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label={en?"Type":"Tipo"}><select name="type" value={v.type} onChange={e=>typeChange(e.target.value as Type)} className={control}><option value="expense">{en?"Expense":"Despesa"}</option><option value="income">{en?"Income":"Receita"}</option>{!editing?<option value="transfer">{en?"Transfer":"Transferência"}</option>:null}</select></Field>
     <Field label={editing&&grouped?(en?"Amount of this occurrence":"Valor deste lançamento"):(en?"Total amount":"Valor total")}><input name="amount" type="text" inputMode="decimal" required value={v.amount} onChange={e=>change("amount",e.target.value)} className={control}/></Field>
    </div>
    <Field label={en?"Description":"Descrição"}><input name="description" type="text" required maxLength={120} value={v.description} onChange={e=>change("description",e.target.value)} className={control}/></Field>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label={en?"Category":"Categoria"}><select name="category_id" disabled={transfer} value={v.category} onChange={e=>change("category",e.target.value)} className={control}>
      <option value="">{transfer?(en?"Transfers do not use categories":"Transferência não usa categoria"):(en?"No category":"Sem categoria")}</option>
      {selectedCategoryMissing?<option value={v.category} disabled>{en?"Linked category unavailable":"Categoria vinculada indisponível"}</option>:null}
      {available.map(c=><option key={c.id} value={c.id}>{c.name}{c.is_active===false?(en?" (inactive)":" (inativa)"):""}</option>)}
     </select></Field>
     <Field label={en?"Date":"Data"}><input name={editing?"occurred_on":"date"} type="date" required value={v.date} onChange={e=>change("date",e.target.value)} className={control}/></Field>
    </div>
   </section>
   {!transfer?<section className="space-y-4">
    <h2 className="text-lg font-semibold text-white">{en?"Payment method":"Forma de pagamento"}</h2>
    <div className="grid gap-4 sm:grid-cols-2">
     <Field label={en?"Method":"Método"}><select value={v.method} onChange={e=>change("method",e.target.value as Method)} className={control}><option value="account">{en?"Bank account":"Conta bancária"}</option><option value="pix">Pix</option><option value="debit_card">{en?"Debit card":"Cartão de débito"}</option>{v.type==="expense"||v.method==="card"?<option value="card">{en?"Credit card":"Cartão de crédito"}</option>:null}</select></Field>
     {credit?<Field label={en?"Credit card":"Cartão de crédito"}><select name="credit_card_id" required value={v.card} onChange={e=>change("card",e.target.value)} className={control}>
      <option value="">{en?"Select a card":"Selecione o cartão"}</option>
      {selectedCardMissing?<option value={v.card} disabled>{en?"Linked card unavailable":"Cartão vinculado indisponível"}</option>:null}
      {cards.map(c=><option key={c.id} value={c.id} disabled={c.is_active===false&&(!editing||c.id!==original?.credit_card_id)}>{[c.name,c.institution,c.brand,c.last_four?`•••• ${c.last_four}`:null].filter(Boolean).join(" · ")}{c.is_active===false?(en?" (inactive)":" (inativo)"):""}</option>)}
     </select></Field>:<Field label={en?"Account":"Conta"}><select name="account_id" required value={v.account} onChange={e=>change("account",e.target.value)} className={control}>
      <option value="">{en?"Select an account":"Selecione a conta"}</option>
      {selectedAccountMissing?<option value={v.account} disabled>{en?"Linked account unavailable":"Conta vinculada indisponível"}</option>:null}
      {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
     </select></Field>}
    </div>
    <p className={`rounded-2xl p-4 text-xs leading-6 ${credit?"border border-amber-300/20 bg-amber-300/[0.06] text-amber-100":"bg-white/[0.03] text-slate-300"}`}>
     {credit?(en?"This expense belongs to the selected card statement, without direct debit from an account.":"Esta despesa fica na fatura do cartão selecionado, sem débito direto na conta."):v.type==="income"?(en?"The amount is credited to the selected account.":"O valor entra na conta selecionada."):(en?"The expense is debited from the selected account.":"A despesa sai diretamente da conta selecionada.")}
     {editing?(en?" Saving updates this transaction, without creating another one.":" Salvar atualiza este lançamento, sem criar outro."):""}
    </p>
   </section>:<section className="space-y-4">
    <h2 className="text-lg font-semibold text-white">{en?"Transfer between accounts":"Transferência entre contas"}</h2>
    <div className="grid gap-4 sm:grid-cols-2"><Field label={en?"Source account":"Conta de origem"}><select name="account_id" required value={v.account} onChange={e=>change("account",e.target.value)} className={control}><option value="">{en?"Select an account":"Selecione a conta"}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field><Field label={en?"Destination account":"Conta de destino"}><select name="transfer_to_account_id" required value={v.destination} onChange={e=>change("destination",e.target.value)} className={control}><option value="">{en?"Select an account":"Selecione a conta"}</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></Field></div>
   </section>}
   {!editing&&!transfer?<section className="space-y-4">
    <h2 className="text-lg font-semibold text-white">{en?"Recurrence and installments":"Recorrência e parcelamento"}</h2>
    <label className="flex min-h-11 items-center gap-3"><input name="is_recurring" type="checkbox" checked={v.recurring} disabled={v.installment} onChange={e=>setV(old=>({...old,recurring:e.target.checked,installment:e.target.checked?false:old.installment}))} className="h-5 w-5"/><span>{en?"Is recurring?":"É recorrente?"}</span></label>
    {v.recurring?<div className="grid gap-4 sm:grid-cols-2"><Field label={en?"Frequency":"Frequência"}><select name="frequency" value={v.frequency} onChange={e=>change("frequency",e.target.value)} className={control}><option value="weekly">{en?"Weekly":"Semanal"}</option><option value="monthly">{en?"Monthly":"Mensal"}</option><option value="yearly">{en?"Yearly":"Anual"}</option></select></Field><Field label={en?"End date (optional)":"Data final (opcional)"}><input name="end_date" type="date" value={v.endDate} onChange={e=>change("endDate",e.target.value)} className={control}/></Field></div>:null}
    {v.type==="expense"?<><label className="flex min-h-11 items-center gap-3"><input name="is_installment" type="checkbox" checked={v.installment} disabled={v.recurring} onChange={e=>setV(old=>({...old,installment:e.target.checked,recurring:e.target.checked?false:old.recurring}))} className="h-5 w-5"/><span>{en?"Is installment based?":"É parcelado?"}</span></label>{v.installment?<div className="max-w-xs"><Field label={en?"Number of installments":"Número de parcelas"}><input name="installments" type="number" min={2} max={48} step={1} required value={v.installments} onChange={e=>change("installments",e.target.value)} className={control}/></Field></div>:null}</>:null}
   </section>:null}
   {editing&&grouped?<p className="rounded-2xl bg-white/[0.03] p-4 text-xs leading-6 text-slate-300">{en?"Only this existing occurrence/installment is edited. The recurring template and other installments remain unchanged.":"A edição vale só para este lançamento/parcela. A recorrência e as outras parcelas não serão recriadas nem alteradas."}</p>:null}
   <section className="space-y-4"><h2 className="text-lg font-semibold text-white">{en?"Notes":"Observações"}</h2><Field label={en?"Notes (optional)":"Notas (opcional)"}><textarea name="notes" rows={3} maxLength={500} value={v.notes} onChange={e=>change("notes",e.target.value)} className={`${control} resize-y`}/></Field></section>
  </fieldset>
  {selectedCardMissing||selectedAccountMissing||selectedCategoryMissing?<p role="alert" className="text-sm leading-6 text-amber-100">{en?"A saved selection is not available in the loaded options. Review it before saving; it will not be silently replaced.":"Uma seleção salva não está disponível nas opções carregadas. Confira antes de salvar; ela não será substituída silenciosamente."}</p>:null}
  {editing&&state.error?<p role="alert" className="rounded-2xl bg-rose-300/10 p-4 text-sm text-rose-200">{state.error}</p>:null}
  {warning?<div role="status" className="rounded-2xl bg-amber-300/10 p-4 text-sm leading-6 text-amber-100"><p>{state.warning}</p><label className="mt-3 flex items-start gap-3"><input type="checkbox" checked={confirmed} disabled={editPending} onChange={e=>setConfirmed(e.target.checked)} className="mt-1 h-5 w-5 shrink-0"/><span>{en?"I understand and want to save even with a negative balance.":"Entendo e quero salvar mesmo com saldo negativo."}</span></label></div>:null}
  <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">{editing?<Link href={`/${locale}/transactions`} className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm text-slate-300 hover:bg-white/[0.04]">{en?"Cancel":"Cancelar"}</Link>:null}<Submit editing={editing} en={en} blocked={Boolean(inconsistent||selectedCardMissing||selectedAccountMissing||selectedCategoryMissing||(warning&&!confirmed))}/></div>
 </form>;
}
