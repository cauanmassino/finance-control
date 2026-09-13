"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";

import {createClient} from "@/lib/supabase/server";

const accountTypes = [
  "checking",
  "savings",
  "cash",
  "digital_wallet",
  "investment",
  "other"
] as const;

const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome da conta é obrigatório.")
    .max(80, "O nome pode ter no máximo 80 caracteres."),
  institution: z
    .string()
    .trim()
    .max(100, "A instituição pode ter no máximo 100 caracteres.")
    .optional(),
  type: z.enum(accountTypes),
  initialBalance: z
    .string()
    .trim()
    .regex(/^-?\d+(?:[.,]\d{1,2})?$/, "Informe um saldo inicial válido."),
  locale: z.enum(["pt", "en"])
});

function parseBrazilianCurrency(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function getLocalizedMessage(
  locale: "pt" | "en",
  pt: string,
  en: string
) {
  return locale === "en" ? en : pt;
}

export async function createAccount(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    type: formData.get("type"),
    initialBalance: formData.get("initialBalance"),
    locale
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    redirect(
      `/${locale}/accounts?error=${encodeURIComponent(
        issue?.message ??
          getLocalizedMessage(
            locale,
            "Dados inválidos.",
            "Invalid account data."
          )
      )}`
    );
  }

  const initialBalance = parseBrazilianCurrency(parsed.data.initialBalance);

  if (!Number.isFinite(initialBalance)) {
    redirect(
      `/${locale}/accounts?error=${encodeURIComponent(
        getLocalizedMessage(
          locale,
          "Informe um saldo inicial válido.",
          "Enter a valid initial balance."
        )
      )}`
    );
  }

  const supabase = await createClient();

  const {
    data: {user},
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const {error} = await supabase.from("accounts").insert({
    user_id: user.id,
    name: parsed.data.name,
    institution: parsed.data.institution || null,
    type: parsed.data.type,
    initial_balance: initialBalance,
    currency_code: "BRL"
  });

  if (error) {
    console.error("Could not create account:", error.message);

    redirect(
      `/${locale}/accounts?error=${encodeURIComponent(
        getLocalizedMessage(
          locale,
          "Não foi possível criar a conta.",
          "Could not create the account."
        )
      )}`
    );
  }

  revalidatePath(`/${locale}/accounts`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(
    `/${locale}/accounts?message=${encodeURIComponent(
      getLocalizedMessage(
        locale,
        "Conta criada com sucesso.",
        "Account created successfully."
      )
    )}`
  );
}

export async function deleteAccount(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const accountId = String(formData.get("accountId") ?? "");

  if (!z.string().uuid().safeParse(accountId).success) {
    redirect(
      `/${locale}/accounts?error=${encodeURIComponent(
        getLocalizedMessage(
          locale,
          "Conta inválida.",
          "Invalid account."
        )
      )}`
    );
  }

  const supabase = await createClient();

  const {
    data: {user},
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const {error} = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Could not delete account:", error.message);

    redirect(
      `/${locale}/accounts?error=${encodeURIComponent(
        getLocalizedMessage(
          locale,
          "Não foi possível excluir a conta.",
          "Could not delete the account."
        )
      )}`
    );
  }

  revalidatePath(`/${locale}/accounts`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(
    `/${locale}/accounts?message=${encodeURIComponent(
      getLocalizedMessage(
        locale,
        "Conta excluída com sucesso.",
        "Account deleted successfully."
      )
    )}`
  );
}