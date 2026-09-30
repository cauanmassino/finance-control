"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

type RecurringActionState = {
  error?: string;
};

function revalidateRecurringPaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/recurring`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/reports`);
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
    };
  }

  return {
    supabase,
    user,
  };
}

export async function toggleRecurringTransaction(
  _previousState: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const locale = String(formData.get("locale") ?? "").trim();

  const recurringTransactionId = String(
    formData.get("recurring_transaction_id") ?? "",
  ).trim();

  if (!locale || !recurringTransactionId) {
    return {
      error: "Dados da recorrência inválidos.",
    };
  }

  const {supabase, user} = await getAuthenticatedUser();

  if (!user) {
    return {
      error: "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const {data: recurrence, error: recurrenceError} = await supabase
    .from("recurring_transactions")
    .select("id, is_active")
    .eq("id", recurringTransactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (recurrenceError || !recurrence) {
    return {
      error: "Recorrência não encontrada.",
    };
  }

  const {error: updateError} = await supabase
    .from("recurring_transactions")
    .update({
      is_active: !recurrence.is_active,
    })
    .eq("id", recurrence.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Erro ao alterar status da recorrência:", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });

    return {
      error: "Não foi possível alterar o status da recorrência.",
    };
  }

  revalidateRecurringPaths(locale);

  return {};
}

export async function deleteRecurringTransaction(
  _previousState: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const locale = String(formData.get("locale") ?? "").trim();

  const recurringTransactionId = String(
    formData.get("recurring_transaction_id") ?? "",
  ).trim();

  if (!locale || !recurringTransactionId) {
    return {
      error: "Dados da recorrência inválidos.",
    };
  }

  const {supabase, user} = await getAuthenticatedUser();

  if (!user) {
    return {
      error: "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const {data: recurrence, error: recurrenceError} = await supabase
    .from("recurring_transactions")
    .select("id")
    .eq("id", recurringTransactionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (recurrenceError || !recurrence) {
    return {
      error: "Recorrência não encontrada.",
    };
  }

  const {error: deleteError} = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", recurrence.id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Erro ao excluir recorrência:", {
      code: deleteError.code,
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
    });

    return {
      error: "Não foi possível excluir a recorrência.",
    };
  }

  revalidateRecurringPaths(locale);

  return {};
}