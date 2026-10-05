"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type GoalState = {
  error?: string
  success?: string
}

function getLocale(value: FormDataEntryValue | null) {
  return value === "en" ? "en" : "pt"
}

function getString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim()
}

function getOptionalString(value: FormDataEntryValue | null) {
  const normalizedValue = getString(value)

  return normalizedValue || null
}

function getValidAmount(value: FormDataEntryValue | null) {
  const rawValue = getString(value)

  if (!rawValue) {
    return null
  }

  let normalizedValue = rawValue
    .replace(/\s/g, "")
    .replace(/[R$\u00a0]/g, "")

  const hasComma = normalizedValue.includes(",")
  const hasDot = normalizedValue.includes(".")

  if (hasComma && hasDot) {
    const lastComma = normalizedValue.lastIndexOf(",")
    const lastDot = normalizedValue.lastIndexOf(".")

    if (lastComma > lastDot) {
      normalizedValue = normalizedValue.replace(/\./g, "").replace(",", ".")
    } else {
      normalizedValue = normalizedValue.replace(/,/g, "")
    }
  } else if (hasComma) {
    normalizedValue = normalizedValue.replace(",", ".")
  }

  const amount = Number(normalizedValue)

  if (!Number.isFinite(amount) || amount < 0) {
    return null
  }

  return Math.round(amount * 100) / 100
}

function getPositiveAmount(value: FormDataEntryValue | null) {
  const amount = getValidAmount(value)

  if (!amount || amount <= 0) {
    return null
  }

  return amount
}

function getValidDate(value: FormDataEntryValue | null) {
  const date = getString(value)

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null
  }

  return date
}

function getGoalColor(value: FormDataEntryValue | null) {
  const color = getString(value)

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return "#10b981"
  }

  return color
}

function getContributionType(value: FormDataEntryValue | null) {
  const type = getString(value)

  if (type === "withdrawal") {
    return "withdrawal"
  }

  if (type === "initial_balance") {
    return "initial_balance"
  }

  return "contribution"
}

async function getAuthenticatedUser(locale: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  return {
    supabase,
    user,
  }
}

function revalidateGoalPaths(locale: string) {
  revalidatePath(`/${locale}/goals`)
  revalidatePath(`/${locale}/dashboard`)
}

export async function createGoal(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"))
  const name = getString(formData.get("name"))
  const targetAmount = getPositiveAmount(formData.get("target_amount"))
  const currentAmount = getValidAmount(formData.get("current_amount")) ?? 0
  const targetDate = getValidDate(formData.get("target_date"))
  const color = getGoalColor(formData.get("color"))
  const icon = getOptionalString(formData.get("icon"))
  const notes = getOptionalString(formData.get("notes"))

  if (!name || !targetAmount) {
    return {
      error:
        locale === "en"
          ? "Enter a name and a valid target amount."
          : "Informe um nome e um valor alvo válido.",
    }
  }

  if (name.length > 100) {
    return {
      error:
        locale === "en"
          ? "The goal name can have up to 100 characters."
          : "O nome da meta pode ter até 100 caracteres.",
    }
  }

  if (currentAmount > targetAmount) {
    return {
      error:
        locale === "en"
          ? "The current amount cannot exceed the target amount."
          : "O valor já guardado não pode ser maior que o valor alvo.",
    }
  }

  const { supabase, user } = await getAuthenticatedUser(locale)

  const { data: goal, error: goalError } = await supabase
    .from("financial_goals")
    .insert({
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
    })
    .select("id")
    .single()

  if (goalError || !goal) {
    console.error("Erro ao criar meta:", goalError)

    return {
      error:
        locale === "en"
          ? "Could not create the goal. Please try again."
          : "Não foi possível criar a meta. Tente novamente.",
    }
  }

  if (currentAmount > 0) {
    const { error: initialContributionError } = await supabase
      .from("goal_contributions")
      .insert({
        user_id: user.id,
        goal_id: goal.id,
        amount: currentAmount,
        contribution_type: "initial_balance",
        occurred_on: new Date().toISOString().slice(0, 10),
        notes: locale === "en" ? "Initial amount" : "Valor inicial",
      })

    if (initialContributionError) {
      console.error(
        "Erro ao registrar valor inicial da meta:",
        initialContributionError,
      )
    }
  }

  revalidateGoalPaths(locale)
  redirect(`/${locale}/goals`)
}

export async function addGoalContribution(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"))
  const goalId = getString(formData.get("goal_id"))
  const amount = getPositiveAmount(formData.get("amount"))
  const occurredOn = getValidDate(formData.get("occurred_on"))
  const notes = getOptionalString(formData.get("notes"))
  const contributionType = getContributionType(formData.get("contribution_type"))
  const sourceAccountId = getOptionalString(formData.get("source_account_id"))

  if (!goalId || !amount || !occurredOn) {
    return {
      error:
        locale === "en"
          ? "Enter a valid amount and date."
          : "Informe um valor e uma data válidos.",
    }
  }

  const { supabase, user } = await getAuthenticatedUser(locale)

  const { data: goal, error: goalError } = await supabase
    .from("financial_goals")
    .select("id, target_amount, current_amount, is_completed")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single()

  if (goalError || !goal) {
    return {
      error:
        locale === "en"
          ? "The selected goal was not found."
          : "A meta selecionada não foi encontrada.",
    }
  }

  const currentAmount = Number(goal.current_amount)
  const targetAmount = Number(goal.target_amount)

  if (contributionType === "withdrawal" && amount > currentAmount) {
    return {
      error:
        locale === "en"
          ? "The withdrawal amount is greater than the amount saved in this goal."
          : "O valor do resgate é maior que o valor guardado nesta meta.",
    }
  }

  const { error: contributionError } = await supabase
    .from("goal_contributions")
    .insert({
      user_id: user.id,
      goal_id: goalId,
      amount,
      contribution_type: contributionType,
      source_account_id: sourceAccountId,
      occurred_on: occurredOn,
      notes,
    })

  if (contributionError) {
    console.error("Erro ao registrar movimentação da meta:", contributionError)

    return {
      error:
        locale === "en"
          ? "Could not register this movement."
          : "Não foi possível registrar esta movimentação.",
    }
  }

  const nextAmount =
    contributionType === "withdrawal"
      ? Math.max(0, currentAmount - amount)
      : currentAmount + amount

  const isCompleted = nextAmount >= targetAmount

  const { error: updateError } = await supabase
    .from("financial_goals")
    .update({
      current_amount: nextAmount,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("user_id", user.id)

  if (updateError) {
    console.error("Erro ao atualizar saldo da meta:", updateError)

    return {
      error:
        locale === "en"
          ? "The movement was saved, but the goal balance could not be updated."
          : "A movimentação foi salva, mas o saldo da meta não pôde ser atualizado.",
    }
  }

  revalidateGoalPaths(locale)

  return {
    success:
      contributionType === "withdrawal"
        ? locale === "en"
          ? "Withdrawal recorded."
          : "Resgate registrado."
        : locale === "en"
          ? "Contribution recorded."
          : "Aporte registrado.",
  }
}

export async function toggleGoalCompletion(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"))
  const goalId = getString(formData.get("goal_id"))
  const nextCompleted = getString(formData.get("next_completed")) === "true"

  if (!goalId) {
    return {
      error: locale === "en" ? "Invalid goal." : "Meta inválida.",
    }
  }

  const { supabase, user } = await getAuthenticatedUser(locale)

  const { error } = await supabase
    .from("financial_goals")
    .update({
      is_completed: nextCompleted,
      completed_at: nextCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Erro ao atualizar meta:", error)

    return {
      error:
        locale === "en"
          ? "Could not update the goal."
          : "Não foi possível atualizar a meta.",
    }
  }

  revalidateGoalPaths(locale)

  return {}
}

export async function deleteGoal(
  _: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const locale = getLocale(formData.get("locale"))
  const goalId = getString(formData.get("goal_id"))

  if (!goalId) {
    return {
      error: locale === "en" ? "Invalid goal." : "Meta inválida.",
    }
  }

  const { supabase, user } = await getAuthenticatedUser(locale)

  const { error } = await supabase
    .from("financial_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Erro ao excluir meta:", error)

    return {
      error:
        locale === "en"
          ? "Could not delete the goal."
          : "Não foi possível excluir a meta.",
    }
  }

  revalidateGoalPaths(locale)

  return {}
}