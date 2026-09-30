"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type AccountType =
  | "cash"
  | "bank"
  | "credit_card"
  | "savings"
  | "investment";

type Institution =
  | "banco_do_brasil"
  | "bradesco"
  | "btg_pactual"
  | "c6"
  | "caixa"
  | "inter"
  | "itau"
  | "mercado_pago"
  | "neon"
  | "nomad"
  | "nubank"
  | "picpay"
  | "santander"
  | "sicoob"
  | "xp"
  | "cash"
  | "other";

export type AccountState = {
  error?: string;
};

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function isValidAccountType(value: string): value is AccountType {
  return (
    value === "cash" ||
    value === "bank" ||
    value === "credit_card" ||
    value === "savings" ||
    value === "investment"
  );
}

function isValidInstitution(value: string): value is Institution {
  return (
    value === "banco_do_brasil" ||
    value === "bradesco" ||
    value === "btg_pactual" ||
    value === "c6" ||
    value === "caixa" ||
    value === "inter" ||
    value === "itau" ||
    value === "mercado_pago" ||
    value === "neon" ||
    value === "nomad" ||
    value === "nubank" ||
    value === "picpay" ||
    value === "santander" ||
    value === "sicoob" ||
    value === "xp" ||
    value === "cash" ||
    value === "other"
  );
}

function isValidColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function parseCurrency(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return Number.NaN;
  }

  if (trimmedValue.includes(",")) {
    return Number(
      trimmedValue
        .replace(/\./g, "")
        .replace(",", "."),
    );
  }

  return Number(trimmedValue);
}

function getAccountFields(formData: FormData) {
  const locale = getText(formData, "locale");
  const name = getText(formData, "name");
  const type = getText(formData, "type");
  const institution = getText(formData, "institution") || "other";
  const color = getText(formData, "color");
  const initialBalanceText = getText(formData, "initial_balance");

  return {
    locale,
    name,
    type,
    institution,
    color,
    initialBalance: parseCurrency(initialBalanceText),
  };
}

function validateAccountFields(
  fields: ReturnType<typeof getAccountFields>,
): string | null {
  if (!fields.locale) {
    return "Idioma inválido.";
  }

  if (!fields.name) {
    return "Informe o nome da conta.";
  }

  if (fields.name.length > 80) {
    return "O nome da conta deve ter no máximo 80 caracteres.";
  }

  if (!isValidAccountType(fields.type)) {
    return "Tipo de conta inválido.";
  }

  if (!isValidInstitution(fields.institution)) {
    return "Instituição inválida.";
  }

  if (!isValidColor(fields.color)) {
    return "Escolha uma cor válida.";
  }

  if (!Number.isFinite(fields.initialBalance)) {
    return "Informe um saldo inicial válido.";
  }

  return null;
}

function revalidateAccountPaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/accounts`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/transactions/new`);
  revalidatePath(`/${locale}/transfers`);
  revalidatePath(`/${locale}/transfers/new`);
  revalidatePath(`/${locale}/reports`);
}

export async function createAccount(
  _previousState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const fields = getAccountFields(formData);
  const validationError = validateAccountFields(fields);

  if (validationError) {
    return {
      error: validationError,
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${fields.locale}/auth/login`);
  }

  const {error} = await supabase.from("accounts").insert({
    user_id: user.id,
    name: fields.name,
    type: fields.type,
    institution: fields.institution,
    color: fields.color,
    initial_balance: fields.initialBalance,
  });

  if (error) {
    console.error("Erro detalhado ao criar conta:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23505") {
      return {
        error: "Você já possui outra conta com esse nome.",
      };
    }

    return {
      error: "Não foi possível criar a conta.",
    };
  }

  revalidateAccountPaths(fields.locale);

  redirect(`/${fields.locale}/accounts`);
}

export async function updateAccount(
  _previousState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const accountId = getText(formData, "account_id");
  const fields = getAccountFields(formData);
  const validationError = validateAccountFields(fields);

  if (!accountId) {
    return {
      error: "Conta inválida.",
    };
  }

  if (validationError) {
    return {
      error: validationError,
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${fields.locale}/auth/login`);
  }

  const {error} = await supabase
    .from("accounts")
    .update({
      name: fields.name,
      type: fields.type,
      institution: fields.institution,
      color: fields.color,
      initial_balance: fields.initialBalance,
    })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro detalhado ao atualizar conta:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23505") {
      return {
        error: "Você já possui outra conta com esse nome.",
      };
    }

    return {
      error: "Não foi possível atualizar a conta.",
    };
  }

  revalidateAccountPaths(fields.locale);

  redirect(`/${fields.locale}/accounts`);
}

export async function deleteAccount(
  _previousState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const locale = getText(formData, "locale");
  const accountId = getText(formData, "account_id");

  if (!locale) {
    return {
      error: "Idioma inválido.",
    };
  }

  if (!accountId) {
    return {
      error: "Conta inválida.",
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
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro detalhado ao excluir conta:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23503") {
      return {
        error:
          "Não foi possível excluir esta conta porque ainda existem lançamentos vinculados a ela.",
      };
    }

    return {
      error: "Não foi possível excluir a conta.",
    };
  }

  revalidateAccountPaths(locale);

  return {};
}