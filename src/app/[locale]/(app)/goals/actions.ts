"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type GoalState = {
  error?: string;
};

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
  const rawValue = getString(value);

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

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function getPositiveAmount(value: FormDataEntryValue | null) {
  const amount = getValidAmount(value);

  if (!amount || amount <= 0) {
    return null;
  }

  return amount;
}

function getValidDate(value: FormDataEntryValue | null) {
  const date = getString(value);

  if (!date) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  return date;
}

function getGoalColor(value: FormDataEntryValue | null) {
  const color = getString(value);

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return "#a78bfa";
  }

  return color;
}

async function getAuthenticatedUser(locale: string) {
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return {
    supabase,
    user,
  };
}

function revalidateGoalPaths(locale: string) {
  revalidatePath(`/${locale}/goals`);
  revalidatePath(`/${locale}/dashboard`);
}

export async function createGoal(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"));
  const name = getString(formData.get("name"));
  const targetAmount = getPositiveAmount(formData.get("target_amount"));
  const currentAmount = getValidAmount(formData.get("current_amount")) ?? 0;
  const targetDate = getValidDate(formData.get("target_date"));
  const color = getGoalColor(formData.get("color"));
  const icon = getOptionalString(formData.get("icon"));
  const notes = getOptionalString(formData.get("notes"));

  if (!name || !targetAmount) {
    return {
      error:
        locale === "en"
          ? "Enter a name and a valid target amount."
          : "Informe um nome e um valor alvo válido.",
    };
  }

  if (name.length > 100) {
    return {
      error:
        locale === "en"
          ? "The goal name can have up to 100 characters."
          : "O nome da meta pode ter até 100 caracteres.",
    };
  }

  if (currentAmount > targetAmount) {
    return {
      error:
        locale === "en"
          ? "The current amount cannot exceed the target amount."
          : "O valor já guardado não pode ser maior que o valor alvo.",
    };
  }

  const {supabase, user} = await getAuthenticatedUser(locale);

  const {error} = await supabase.from("financial_goals").insert({
    user_id: user.id,
    name,
    target_amount: targetAmount,
    current_amount: currentAmount,
    target_date: targetDate,
    color,
    icon,
    notes,
    is_completed: currentAmount >= targetAmount,
    completed_at: currentAmount >= targetAmount ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("Erro ao criar meta:", error);

    return {
      error:
        locale === "en"
          ? "Could not create the goal. Please try again."
          : "Não foi possível criar a meta. Tente novamente.",
    };
  }

  revalidateGoalPaths(locale);
  redirect(`/${locale}/goals`);
}

export async function addGoalContribution(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"));
  const goalId = getString(formData.get("goal_id"));
  const amount = getPositiveAmount(formData.get("amount"));
  const occurredOn = getValidDate(formData.get("occurred_on"));
  const notes = getOptionalString(formData.get("notes"));

  if (!goalId || !amount || !occurredOn) {
    return {
      error:
        locale === "en"
          ? "Enter a valid contribution amount and date."
          : "Informe um valor e uma data válidos para o aporte.",
    };
  }

  const {supabase, user} = await getAuthenticatedUser(locale);

  const {data: goal, error: goalError} = await supabase
    .from("financial_goals")
    .select("id, is_completed")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (goalError || !goal) {
    return {
      error:
        locale === "en"
          ? "The selected goal was not found."
          : "A meta selecionada não foi encontrada.",
    };
  }

  if (goal.is_completed) {
    return {
      error:
        locale === "en"
          ? "This goal has already been completed."
          : "Esta meta já foi concluída.",
    };
  }

  const {error} = await supabase.from("goal_contributions").insert({
    user_id: user.id,
    goal_id: goalId,
    amount,
    occurred_on: occurredOn,
    notes,
  });

  if (error) {
    console.error("Erro ao registrar aporte:", error);

    return {
      error:
        locale === "en"
          ? "Could not register the contribution."
          : "Não foi possível registrar o aporte.",
    };
  }

  revalidateGoalPaths(locale);
  return {};
}

export async function toggleGoalCompletion(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"));
  const goalId = getString(formData.get("goal_id"));
  const nextCompleted = getString(formData.get("next_completed")) === "true";

  if (!goalId) {
    return {
      error:
        locale === "en"
          ? "Invalid goal."
          : "Meta inválida.",
    };
  }

  const {supabase, user} = await getAuthenticatedUser(locale);

  const {error} = await supabase
    .from("financial_goals")
    .update({
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao atualizar meta:", error);

    return {
      error:
        locale === "en"
          ? "Could not update the goal."
          : "Não foi possível atualizar a meta.",
    };
  }

  revalidateGoalPaths(locale);
  return {};
}

export async function deleteGoal(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"));
  const goalId = getString(formData.get("goal_id"));

  if (!goalId) {
    return {
      error:
        locale === "en"
          ? "Invalid goal."
          : "Meta inválida.",
    };
  }

  const {supabase, user} = await getAuthenticatedUser(locale);

  const {error} = await supabase
    .from("financial_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao excluir meta:", error);

    return {
      error:
        locale === "en"
          ? "Could not delete the goal."
          : "Não foi possível excluir a meta.",
    };
  }

  revalidateGoalPaths(locale);
  return {};
}