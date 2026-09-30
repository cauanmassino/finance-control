"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type BudgetState = {
  error?: string;
};

function getLocale(value: FormDataEntryValue | null) {
  return value === "en" ? "en" : "pt";
}

function getMonthStart(monthValue: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthValue)) {
    return null;
  }

  return `${monthValue}-01`;
}

function getPositiveAmount(value: FormDataEntryValue | null) {
  const rawValue = String(value ?? "").trim();

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
      normalizedValue = normalizedValue
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      normalizedValue = normalizedValue.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalizedValue = normalizedValue.replace(",", ".");
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

export async function createBudget(
  _: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const locale = getLocale(formData.get("locale"));
  const categoryId = String(formData.get("category_id") ?? "").trim();
  const month = getMonthStart(String(formData.get("month") ?? ""));
  const amount = getPositiveAmount(formData.get("amount"));

  if (!categoryId || !month || !amount) {
    return {
      error:
        locale === "en"
          ? "Fill in category, month, and a valid budget amount."
          : "Preencha categoria, mês e um valor de orçamento válido.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: category, error: categoryError} = await supabase
    .from("categories")
    .select("id, type")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .single();

  if (categoryError || !category) {
    return {
      error:
        locale === "en"
          ? "The selected category was not found."
          : "A categoria selecionada não foi encontrada.",
    };
  }

  if (category.type !== "expense") {
    return {
      error:
        locale === "en"
          ? "Budgets can only be created for expense categories."
          : "Orçamentos só podem ser criados para categorias de despesa.",
    };
  }

  const {error} = await supabase.from("budgets").insert({
    user_id: user.id,
    category_id: categoryId,
    month,
    amount,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          locale === "en"
            ? "This category already has a budget for the selected month."
            : "Esta categoria já possui um orçamento para o mês selecionado.",
      };
    }

    console.error("Erro ao criar orçamento:", error);

    return {
      error:
        locale === "en"
          ? "Could not create the budget. Please try again."
          : "Não foi possível criar o orçamento. Tente novamente.",
    };
  }

  revalidatePath(`/${locale}/budgets`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(`/${locale}/budgets?month=${month.slice(0, 7)}`);
}

export async function updateBudget(
  _: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const locale = getLocale(formData.get("locale"));
  const budgetId = String(formData.get("budget_id") ?? "").trim();
  const amount = getPositiveAmount(formData.get("amount"));

  if (!budgetId || !amount) {
    return {
      error:
        locale === "en"
          ? "Enter a valid budget amount."
          : "Informe um valor de orçamento válido.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: budget, error: budgetError} = await supabase
    .from("budgets")
    .select("id, month")
    .eq("id", budgetId)
    .eq("user_id", user.id)
    .single();

  if (budgetError || !budget) {
    return {
      error:
        locale === "en"
          ? "The budget was not found."
          : "O orçamento não foi encontrado.",
    };
  }

  const {error} = await supabase
    .from("budgets")
    .update({
      amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao atualizar orçamento:", error);

    return {
      error:
        locale === "en"
          ? "Could not update the budget. Please try again."
          : "Não foi possível atualizar o orçamento. Tente novamente.",
    };
  }

  revalidatePath(`/${locale}/budgets`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(`/${locale}/budgets?month=${budget.month.slice(0, 7)}`);
}

export async function deleteBudget(
  _: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const locale = getLocale(formData.get("locale"));
  const budgetId = String(formData.get("budget_id") ?? "").trim();

  if (!budgetId) {
    return {
      error:
        locale === "en"
          ? "Invalid budget."
          : "Orçamento inválido.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: budget, error: budgetError} = await supabase
    .from("budgets")
    .select("id, month")
    .eq("id", budgetId)
    .eq("user_id", user.id)
    .single();

  if (budgetError || !budget) {
    return {
      error:
        locale === "en"
          ? "The budget was not found."
          : "O orçamento não foi encontrado.",
    };
  }

  const {error} = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao excluir orçamento:", error);

    return {
      error:
        locale === "en"
          ? "Could not delete the budget. Please try again."
          : "Não foi possível excluir o orçamento. Tente novamente.",
    };
  }

  revalidatePath(`/${locale}/budgets`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(`/${locale}/budgets?month=${budget.month.slice(0, 7)}`);
}