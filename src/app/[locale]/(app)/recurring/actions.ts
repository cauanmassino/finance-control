"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type RecurringState = {
  error?: string;
};

type RecurringType = "income" | "expense";
type Frequency = "weekly" | "monthly" | "yearly";

function getLocale(value: FormDataEntryValue | null) {
  return value === "en" ? "en" : "pt";
}

function getString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function getOptionalString(value: FormDataEntryValue | null) {
  const normalizedValue = getString(value);

  return normalizedValue || null;
}

function getValidAmount(value: FormDataEntryValue | null) {
  const rawValue = getString(value).trim();

  if (!rawValue) {
    return null;
  }

  let normalizedValue = rawValue.replace(/\s/g, "");

  const hasComma = normalizedValue.includes(",");
  const hasDot = normalizedValue.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalizedValue.lastIndexOf(",");
    const lastDot = normalizedValue.lastIndexOf(".");

    if (lastComma > lastDot) {
      // Formato brasileiro: 1.234,56
      normalizedValue = normalizedValue
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      // Formato americano: 1,234.56
      normalizedValue = normalizedValue.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Formato brasileiro simples: 5,60
    normalizedValue = normalizedValue.replace(",", ".");
  } else {
    // Formato HTML number: 5.60
    // Mantém o ponto decimal.
    normalizedValue = normalizedValue;
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function getValidType(value: FormDataEntryValue | null): RecurringType | null {
  const type = getString(value);

  if (type === "income" || type === "expense") {
    return type;
  }

  return null;
}

function getValidFrequency(
  value: FormDataEntryValue | null,
): Frequency | null {
  const frequency = getString(value);

  if (
    frequency === "weekly" ||
    frequency === "monthly" ||
    frequency === "yearly"
  ) {
    return frequency;
  }

  return null;
}

function getValidDate(value: FormDataEntryValue | null) {
  const date = getString(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return date;
}

function getNextOccurrence(
  currentDate: string,
  frequency: Frequency,
) {
  const [yearText, monthText, dayText] = currentDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const day = Number(dayText);

  const date = new Date(year, month, day);

  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  }

  if (frequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
  }

  if (frequency === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  }

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

async function validateReferences({
  supabase,
  userId,
  accountId,
  categoryId,
  type,
  locale,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  type: RecurringType;
  locale: string;
}): Promise<RecurringState | null> {
  if (accountId) {
    const {data: account, error: accountError} = await supabase
      .from("accounts")
      .select("id")
      .eq("id", accountId)
      .eq("user_id", userId)
      .single();

    if (accountError || !account) {
      return {
        error:
          locale === "en"
            ? "The selected account was not found."
            : "A conta selecionada não foi encontrada.",
      };
    }
  }

  if (categoryId) {
    const {data: category, error: categoryError} = await supabase
      .from("categories")
      .select("id, type")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .single();

    if (categoryError || !category) {
      return {
        error:
          locale === "en"
            ? "The selected category was not found."
            : "A categoria selecionada não foi encontrada.",
      };
    }

    if (category.type !== type) {
      return {
        error:
          locale === "en"
            ? "Choose a category with the same type as this recurring item."
            : "Escolha uma categoria com o mesmo tipo desta recorrência.",
      };
    }
  }

  return null;
}

export async function createRecurring(
  _: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const locale = getLocale(formData.get("locale"));
  const description = getString(formData.get("description"));
  const amount = getValidAmount(formData.get("amount"));
  const type = getValidType(formData.get("type"));
  const frequency = getValidFrequency(formData.get("frequency"));
  const startDate = getValidDate(formData.get("start_date"));
  const nextOccurrence = getValidDate(formData.get("next_occurrence"));
  const endDate = getOptionalString(formData.get("end_date"));
  const accountId = getOptionalString(formData.get("account_id"));
  const categoryId = getOptionalString(formData.get("category_id"));
  const paymentMethod = getOptionalString(formData.get("payment_method"));
  const notes = getOptionalString(formData.get("notes"));

  if (!description || !amount || !type || !frequency || !startDate || !nextOccurrence) {
    return {
      error:
        locale === "en"
          ? "Fill in description, amount, type, frequency, start date, and next occurrence."
          : "Preencha descrição, valor, tipo, frequência, data inicial e próxima ocorrência.",
    };
  }

  if (endDate && !getValidDate(endDate)) {
    return {
      error:
        locale === "en"
          ? "Enter a valid end date."
          : "Informe uma data final válida.",
    };
  }

  if (endDate && endDate < startDate) {
    return {
      error:
        locale === "en"
          ? "The end date cannot be before the start date."
          : "A data final não pode ser anterior à data inicial.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const referenceError = await validateReferences({
    supabase,
    userId: user.id,
    accountId,
    categoryId,
    type,
    locale,
  });

  if (referenceError) {
    return referenceError;
  }

  const {error} = await supabase.from("recurring_transactions").insert({
    user_id: user.id,
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
    is_active: true,
  });

  if (error) {
    console.error("Erro ao criar recorrência:", error);

    return {
      error:
        locale === "en"
          ? "Could not create the recurring item. Please try again."
          : "Não foi possível criar a recorrência. Tente novamente.",
    };
  }

  revalidatePath(`/${locale}/recurring`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(`/${locale}/recurring`);
}

export async function toggleRecurring(
  _: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const locale = getLocale(formData.get("locale"));
  const recurringId = getString(formData.get("recurring_id"));
  const nextActiveValue = getString(formData.get("next_active"));

  const nextActive = nextActiveValue === "true";

  if (!recurringId) {
    return {
      error:
        locale === "en"
          ? "Invalid recurring item."
          : "Recorrência inválida.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {error} = await supabase
    .from("recurring_transactions")
    .update({
      is_active: nextActive,
    })
    .eq("id", recurringId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao atualizar recorrência:", error);

    return {
      error:
        locale === "en"
          ? "Could not update the recurring item."
          : "Não foi possível atualizar a recorrência.",
    };
  }

  revalidatePath(`/${locale}/recurring`);
  revalidatePath(`/${locale}/dashboard`);

  return {};
}

export async function deleteRecurring(
  _: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const locale = getLocale(formData.get("locale"));
  const recurringId = getString(formData.get("recurring_id"));

  if (!recurringId) {
    return {
      error:
        locale === "en"
          ? "Invalid recurring item."
          : "Recorrência inválida.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {error} = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", recurringId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao excluir recorrência:", error);

    return {
      error:
        locale === "en"
          ? "Could not delete the recurring item."
          : "Não foi possível excluir a recorrência.",
    };
  }

  revalidatePath(`/${locale}/recurring`);
  revalidatePath(`/${locale}/dashboard`);

  return {};
}

export async function generateRecurringTransaction(
  _: RecurringState,
  formData: FormData,
): Promise<RecurringState> {
  const locale = getLocale(formData.get("locale"));
  const recurringId = getString(formData.get("recurring_id"));

  if (!recurringId) {
    return {
      error:
        locale === "en"
          ? "Invalid recurring item."
          : "Recorrência inválida.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: recurring, error: recurringError} = await supabase
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
      next_occurrence,
      end_date,
      is_active
    `)
    .eq("id", recurringId)
    .eq("user_id", user.id)
    .single();

  if (recurringError || !recurring) {
    return {
      error:
        locale === "en"
          ? "The recurring item was not found."
          : "A recorrência não foi encontrada.",
    };
  }

  if (!recurring.is_active) {
    return {
      error:
        locale === "en"
          ? "Activate this recurring item before generating a transaction."
          : "Ative esta recorrência antes de gerar um lançamento.",
    };
  }

  const occurredOn = recurring.next_occurrence;
  const type = recurring.type as RecurringType;
  const frequency = recurring.frequency as Frequency;

  if (!occurredOn || !type || !frequency) {
    return {
      error:
        locale === "en"
          ? "The recurring item has invalid data."
          : "A recorrência possui dados inválidos.",
    };
  }

  const {error: transactionError} = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      description: recurring.description,
      amount: recurring.amount,
      type,
      occurred_on: occurredOn,
      account_id: recurring.account_id,
      category_id: recurring.category_id,
      payment_method: recurring.payment_method,
      notes: recurring.notes,
    });

  if (transactionError) {
    console.error("Erro ao gerar lançamento recorrente:", transactionError);

    return {
      error:
        locale === "en"
          ? "Could not generate the transaction."
          : "Não foi possível gerar o lançamento.",
    };
  }

  const nextOccurrence = getNextOccurrence(occurredOn, frequency);

  const hasReachedEndDate =
    recurring.end_date && nextOccurrence > recurring.end_date;

  const {error: updateError} = await supabase
    .from("recurring_transactions")
    .update({
      next_occurrence: nextOccurrence,
      is_active: !hasReachedEndDate,
    })
    .eq("id", recurring.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Erro ao avançar recorrência:", updateError);

    return {
      error:
        locale === "en"
          ? "The transaction was created, but the next occurrence could not be updated."
          : "O lançamento foi criado, mas a próxima ocorrência não pôde ser atualizada.",
    };
  }

  revalidatePath(`/${locale}/recurring`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/budgets`);

  return {};
}