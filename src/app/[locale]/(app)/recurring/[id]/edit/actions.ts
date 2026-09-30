"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type RecurringType = "income" | "expense";
type RecurringFrequency = "weekly" | "monthly" | "yearly";

export type EditRecurringState = {
  error?: string;
};

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function isValidType(value: string): value is RecurringType {
  return value === "income" || value === "expense";
}

function isValidFrequency(value: string): value is RecurringFrequency {
  return (
    value === "weekly" ||
    value === "monthly" ||
    value === "yearly"
  );
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function revalidateRecurringPaths(locale: string, id: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/recurring`);
  revalidatePath(`/${locale}/recurring/${id}/edit`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/reports`);
}

export async function updateRecurringTransaction(
  _previousState: EditRecurringState,
  formData: FormData,
): Promise<EditRecurringState> {
  const locale = getText(formData, "locale");
  const recurringTransactionId = getText(
    formData,
    "recurring_transaction_id",
  );

  const description = getText(formData, "description");
  const amount = Number(getText(formData, "amount"));
  const type = getText(formData, "type");
  const accountId = getText(formData, "account_id") || null;
  const categoryId = getText(formData, "category_id") || null;
  const paymentMethod = getText(formData, "payment_method") || null;
  const notes = getText(formData, "notes") || null;
  const frequency = getText(formData, "frequency");
  const startDate = getText(formData, "start_date");
  const nextOccurrence = getText(formData, "next_occurrence");
  const endDate = getText(formData, "end_date") || null;
  const isActive = getText(formData, "is_active") === "true";

  if (!locale || !recurringTransactionId) {
    return {
      error: "Dados da recorrência inválidos.",
    };
  }

  if (!description) {
    return {
      error: "Informe uma descrição.",
    };
  }

  if (description.length > 120) {
    return {
      error: "A descrição deve ter no máximo 120 caracteres.",
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      error: "Informe um valor maior que zero.",
    };
  }

  if (!isValidType(type)) {
    return {
      error: "Tipo de recorrência inválido.",
    };
  }

  if (!isValidFrequency(frequency)) {
    return {
      error: "Escolha uma frequência válida.",
    };
  }

  if (!isValidDate(startDate)) {
    return {
      error: "Informe uma data inicial válida.",
    };
  }

  if (!isValidDate(nextOccurrence)) {
    return {
      error: "Informe a próxima ocorrência corretamente.",
    };
  }

  if (endDate && !isValidDate(endDate)) {
    return {
      error: "Informe uma data final válida.",
    };
  }

  if (endDate && endDate < startDate) {
    return {
      error: "A data final não pode ser anterior à data inicial.",
    };
  }

  if (notes && notes.length > 500) {
    return {
      error: "A observação deve ter no máximo 500 caracteres.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
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

  if (accountId) {
    const {data: account, error: accountError} = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (accountError || !account) {
      return {
        error: "A conta selecionada não é válida.",
      };
    }
  }

  if (categoryId) {
    const {data: category, error: categoryError} = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (categoryError || !category) {
      return {
        error: "A categoria selecionada não é válida.",
      };
    }

    if (category.type !== type) {
      return {
        error: "Escolha uma categoria do mesmo tipo da recorrência.",
      };
    }
  }

  const {error: updateError} = await supabase
    .from("recurring_transactions")
    .update({
      description,
      amount,
      type,
      account_id: accountId,
      category_id: categoryId,
      payment_method: paymentMethod,
      notes,
      frequency,
      start_date: startDate,
      next_occurrence: nextOccurrence,
      end_date: endDate,
      is_active: isActive,
    })
    .eq("id", recurrence.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Erro detalhado ao editar recorrência:", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });

    return {
      error: "Não foi possível atualizar a recorrência.",
    };
  }

  revalidateRecurringPaths(locale, recurringTransactionId);

  redirect(`/${locale}/recurring`);
}