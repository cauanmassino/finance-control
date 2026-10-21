"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type EditTransactionState = {
  error?: string; warning?: string; requiresNegativeBalanceConfirmation?: boolean;
};
const text = (form: FormData, key: string) => {
  const value = form.get(key); return typeof value === "string" ? value.trim() : "";
};
function amountValue(value: string) {
  let valueToParse = value.replace(/\s/g, "");
  if (valueToParse.includes(",") && valueToParse.includes(".")) {
    valueToParse = valueToParse.lastIndexOf(",") > valueToParse.lastIndexOf(".")
      ? valueToParse.replace(/\./g, "").replace(",", ".") : valueToParse.replace(/,/g, "");
  } else valueToParse = valueToParse.replace(",", ".");
  const parsed = Number(valueToParse);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
}
export async function updateTransaction(_previous: EditTransactionState, form: FormData): Promise<EditTransactionState> {
  const locale = text(form,"locale") === "en" ? "en" : "pt";
  const en = locale === "en";
  const id = text(form,"transaction_id");
  const method = text(form,"payment_method");
  const amount = amountValue(text(form,"amount"));
  const description = text(form,"description");
  const type = text(form,"type");
  const date = text(form,"occurred_on");
  const notes = text(form,"notes");
  if (!id || !amount || !description || description.length>120 || notes.length>500 || !["expense","income"].includes(type) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {error: en ? "Check the description, amount, date and transaction details." : "Confira descrição, valor, data e os dados do lançamento."};
  }
  const supabase = await createClient();
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);
  const {data,error} = await supabase.rpc("edit_finco_transaction_v1", {
    p_transaction_id:id,
    p_expected_updated_at:text(form,"expected_updated_at"),
    p_description:description,p_amount:amount,p_type:type,p_occurred_on:date,
    p_payment_method:method,
    p_account_id:method === "credit_card" ? null : text(form,"account_id") || null,
    p_credit_card_id:method === "credit_card" ? text(form,"credit_card_id") || null : null,
    p_category_id:text(form,"category_id") || null,p_notes:notes || null,
    p_confirm_negative_balance:text(form,"confirm_negative_balance") === "true",
  });
  if (error) {
    console.error("Erro ao editar lançamento:", {code:error.code,message:error.message});
    const messages: Record<string,[string,string]> = {
      TRANSACTION_CHANGED:["O lançamento foi alterado em outra operação. Recarregue a página antes de salvar.","This transaction changed. Reload the page before saving."],
      TRANSACTION_NOT_FOUND:["Lançamento não encontrado.","Transaction not found."],
      INVALID_CARD:["Selecione um cartão válido.","Select a valid credit card."],
      INACTIVE_CARD:["O novo cartão está inativo. Selecione outro cartão.","The new card is inactive. Select another card."],
      INVALID_CARD_DATES:["Confira os dias de fechamento e vencimento do cartão.","Check the card closing and due days."],
      INVALID_ACCOUNT:["Selecione uma conta válida.","Select a valid account."],
      INVALID_CATEGORY:["Selecione uma categoria compatível com o tipo do lançamento.","Select a category matching the transaction type."],
      INVALID_METHOD:["Selecione uma forma de pagamento válida.","Select a valid payment method."],
      SPECIAL_TRANSACTION:["Transferências precisam ser editadas no fluxo próprio de transferências.","Use the transfer workflow to edit transfers."],
      STATEMENT_PAYMENT:["Este registro é um pagamento de fatura e não pode ser convertido em compra.","This is a statement payment and cannot be converted to a purchase."],
      INCONSISTENT_ORIGIN:["O vínculo original com a fatura está inconsistente. Nenhuma alteração foi salva.","The original statement link is inconsistent. No changes were saved."],
      INCONSISTENT_STATEMENT_TOTAL:["O total atual da fatura precisa de conferência. Nenhuma alteração foi salva.","The current statement total needs review. No changes were saved."],
    };
    const key = Object.keys(messages).find((item) => error.message.includes(item));
    if (key) return {error:messages[key][en ? 1 : 0]};
    if (error.code === "PGRST202" || error.message.includes("edit_finco_transaction_v1")) {
      return {error:en ? "Install the included database migration before using this editor." : "Aplique a migração SQL incluída no pacote antes de usar esta edição."};
    }
    return {error:en ? "Could not save the transaction. Check the server logs. No partial save is expected from this operation." : "Não foi possível salvar. Confira o log do servidor; esta operação não deve deixar alterações parciais."};
  }
  const result = data as {ok?:boolean; requiresNegativeBalanceConfirmation?:boolean; accounts?:Array<{account:string;balance:number}>};
  if (result?.requiresNegativeBalanceConfirmation) {
    const currency = new Intl.NumberFormat(en ? "en-US" : "pt-BR",{style:"currency",currency:"BRL"});
    const balances = (result.accounts ?? []).map((item) => `${item.account}: ${currency.format(Number(item.balance))}`).join("; ");
    return {requiresNegativeBalanceConfirmation:true,warning:(en ? "Projected negative balance: " : "Saldo negativo previsto: ")+balances};
  }
  if (!result?.ok) return {error:en ? "The server did not confirm the update." : "O servidor não confirmou a alteração."};
  for (const route of ["dashboard","transactions","accounts","cards","reports","budgets","financial-health","recurring"]) revalidatePath(`/${locale}/${route}`);
  revalidatePath(`/${locale}/cards`,"layout");
  revalidatePath(`/${locale}/transactions/${id}/edit`);
  redirect(`/${locale}/transactions`);
}
