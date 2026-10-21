import type {Metadata} from "next";
import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {EditTransactionForm,type EditableTransaction,type EditAccount,type EditCategory,type EditCard} from "@/components/transactions/edit-transaction-form";
export const metadata:Metadata={title:"Editar lançamento",description:"Atualize os dados do lançamento existente."};
export default async function EditTransactionPage({params}:{params:Promise<{locale:string;id:string}>}) {
 const {locale:received,id}=await params;
 const locale=received==="en"?"en":"pt";
 const en=locale==="en";
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect(`/${locale}/auth/login`);
 const [transactionResult,accountResult,categoryResult,cardResult]=await Promise.all([
  supabase.from("transactions").select("id,description,amount,type,occurred_on,account_id,category_id,payment_method,notes,credit_card_id,credit_card_statement_id,status,updated_at,recurring_transaction_id,installment_plan_id,installment_number,total_installments").eq("id",id).eq("user_id",user.id).maybeSingle(),
  supabase.from("accounts").select("id,name").eq("user_id",user.id).order("name",{ascending:true}),
  supabase.from("categories").select("id,name,type,is_active").eq("user_id",user.id).order("name",{ascending:true}),
  supabase.from("credit_cards").select("id,name,institution,brand,last_four,is_active").eq("user_id",user.id).order("name",{ascending:true}),
 ]);
 const error=transactionResult.error??accountResult.error??categoryResult.error??cardResult.error;
 if(error){console.error("Falha ao carregar edição:",{code:error.code,message:error.message});throw new Error(en?"Could not load the editor.":"Não foi possível carregar os dados da edição.");}
 if(!transactionResult.data)notFound();
 if(!["expense","income"].includes(transactionResult.data.type??""))return <div className="space-y-4"><p>{en?"Use the transfer workflow for this record.":"Este registro deve ser tratado no fluxo de transferências."}</p><Link href={`/${locale}/transfers`} className="text-primary underline">{en?"Open transfers":"Abrir transferências"}</Link></div>;
 const transaction={...transactionResult.data,amount:Number(transactionResult.data.amount)} as EditableTransaction;
 return <div className="mx-auto max-w-3xl space-y-6 pb-8">
  <Link href={`/${locale}/transactions`} className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">← {en?"Back to transactions":"Voltar para lançamentos"}</Link>
  <header><h1 className="text-3xl font-semibold tracking-tight">{en?"Edit transaction":"Editar lançamento"}</h1><p className="mt-2 text-sm text-muted-foreground">{en?"Change only the fields you need. The existing data is already filled in.":"Altere somente o que precisar. Os campos já mostram os dados deste lançamento."}</p></header>
  <EditTransactionForm locale={locale} transaction={transaction} accounts={(accountResult.data??[]) as EditAccount[]} categories={(categoryResult.data??[]) as EditCategory[]} cards={(cardResult.data??[]) as EditCard[]}/>
 </div>;
}
