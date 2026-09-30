"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type OnboardingState = {
  error?: string;
};

type AccountType = "cash" | "bank" | "savings" | "investment";

type CurrencyCode = "BRL" | "USD" | "EUR";

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function parseAmount(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return 0;
  }

  if (normalized.includes(",")) {
    return Number(
      normalized
        .replace(/\./g, "")
        .replace(",", "."),
    );
  }

  return Number(normalized);
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return value === "BRL" || value === "USD" || value === "EUR";
}

function isAccountType(value: string): value is AccountType {
  return (
    value === "cash" ||
    value === "bank" ||
    value === "savings" ||
    value === "investment"
  );
}

function getTimezone(currencyCode: CurrencyCode) {
  if (currencyCode === "USD") {
    return "America/New_York";
  }

  if (currencyCode === "EUR") {
    return "Europe/Lisbon";
  }

  return "America/Sao_Paulo";
}

export async function finishOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const locale = getText(formData, "locale") === "en" ? "en" : "pt";
  const currencyCode = getText(formData, "currency_code");
  const accountName = getText(formData, "account_name");
  const accountType = getText(formData, "account_type");
  const initialBalance = parseAmount(getText(formData, "initial_balance"));

  const isEnglish = locale === "en";

  if (!isCurrencyCode(currencyCode)) {
    return {
      error: isEnglish
        ? "Choose a valid currency."
        : "Escolha uma moeda válida.",
    };
  }

  if (!accountName) {
    return {
      error: isEnglish
        ? "Enter a name for your first account."
        : "Informe o nome da sua primeira conta.",
    };
  }

  if (accountName.length > 80) {
    return {
      error: isEnglish
        ? "The account name can have up to 80 characters."
        : "O nome da conta pode ter no máximo 80 caracteres.",
    };
  }

  if (!isAccountType(accountType)) {
    return {
      error: isEnglish
        ? "Choose a valid account type."
        : "Escolha um tipo de conta válido.",
    };
  }

  if (!Number.isFinite(initialBalance)) {
    return {
      error: isEnglish
        ? "Enter a valid opening balance."
        : "Informe um saldo inicial válido.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: existingAccount, error: accountCheckError} = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (accountCheckError) {
    console.error("Erro ao verificar conta inicial:", accountCheckError);

    return {
      error: isEnglish
        ? "Unable to verify your accounts. Please try again."
        : "Não foi possível verificar suas contas. Tente novamente.",
    };
  }

  if (!existingAccount) {
    const {error: accountError} = await supabase.from("accounts").insert({
      user_id: user.id,
      name: accountName,
      type: accountType,
      institution: accountType === "cash" ? "cash" : "other",
      color: "#10b981",
      initial_balance: initialBalance,
      currency_code: currencyCode,
    });

    if (accountError) {
      console.error("Erro ao criar conta inicial:", accountError);

      return {
        error: isEnglish
          ? "Unable to create your first account. Please try again."
          : "Não foi possível criar sua primeira conta. Tente novamente.",
      };
    }
  }

  const {error: profileError} = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        locale: locale === "en" ? "en" : "pt-BR",
        currency_code: currencyCode,
        timezone: getTimezone(currencyCode),
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

  if (profileError) {
    console.error("Erro ao concluir onboarding:", profileError);

    return {
      error: isEnglish
        ? "Your account was created, but we could not finish the setup. Please try again."
        : "Sua conta foi criada, mas não conseguimos concluir a configuração. Tente novamente.",
    };
  }

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/accounts`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/financial-health`);

  redirect(`/${locale}/dashboard`);
}