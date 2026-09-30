"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function revalidatePaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/transfers`);
  revalidatePath(`/${locale}/reports`);
}

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

export async function deleteTransaction(formData: FormData) {
  const locale = getText(formData, "locale");
  const transactionId = getText(formData, "transaction_id");

  if (!locale || !transactionId) {
    throw new Error("Dados do lançamento inválidos.");
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: transaction, error: findError} = await supabase
    .from("transactions")
    .select("id")
    .eq("id", transactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError) {
    console.error("Erro ao localizar lançamento:", findError);

    throw new Error(
      `Não foi possível localizar o lançamento: ${findError.message}`,
    );
  }

  if (!transaction) {
    throw new Error("Lançamento não encontrado.");
  }

  const {error: deleteError} = await supabase
    .from("transactions")
    .delete()
    .eq("id", transaction.id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Erro detalhado ao excluir lançamento:", {
      code: deleteError.code,
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
    });

    throw new Error(
      `Não foi possível excluir o lançamento: ${deleteError.message}`,
    );
  }

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/reports`);

  redirect(`/${locale}/transactions`);
}
export async function deleteTransfer(formData: FormData) {
  const locale = getText(formData, "locale");
  const transferId = getText(formData, "transfer_id");

  if (!locale || !transferId) {
    return;
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("transactions")
    .delete()
    .eq("transfer_id", transferId)
    .eq("user_id", user.id);

  revalidatePaths(locale);
}