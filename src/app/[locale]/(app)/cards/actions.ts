"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";

import {createClient} from "@/lib/supabase/server";

const cardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do cartão é obrigatório.")
    .max(80, "O nome pode ter no máximo 80 caracteres."),

  institution: z
    .string()
    .trim()
    .max(100, "A instituição pode ter no máximo 100 caracteres.")
    .optional(),

  brand: z.enum([
    "visa",
    "mastercard",
    "amex",
    "elo",
    "hipercard",
    "other"
  ]),

  lastFour: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Informe os últimos 4 dígitos do cartão."),

  creditLimit: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um limite válido."),

  closingDay: z.coerce
    .number()
    .int()
    .min(1, "O dia de fechamento deve ficar entre 1 e 31.")
    .max(31, "O dia de fechamento deve ficar entre 1 e 31."),

  dueDay: z.coerce
    .number()
    .int()
    .min(1, "O dia de vencimento deve ficar entre 1 e 31.")
    .max(31, "O dia de vencimento deve ficar entre 1 e 31."),

  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida."),

  locale: z.enum(["pt", "en"])
});

function parseBrazilianCurrency(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function message(locale: "pt" | "en", pt: string, en: string) {
  return locale === "en" ? en : pt;
}

export async function createCard(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const parsed = cardSchema.safeParse({
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    brand: formData.get("brand"),
    lastFour: formData.get("lastFour"),
    creditLimit: formData.get("creditLimit"),
    closingDay: formData.get("closingDay"),
    dueDay: formData.get("dueDay"),
    color: formData.get("color"),
    locale
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];

    redirect(
      `/${locale}/cards?error=${encodeURIComponent(
        firstIssue?.message ??
          message(locale, "Dados inválidos.", "Invalid card data.")
      )}`
    );
  }

  const creditLimit = parseBrazilianCurrency(parsed.data.creditLimit);

  if (!Number.isFinite(creditLimit) || creditLimit < 0) {
    redirect(
      `/${locale}/cards?error=${encodeURIComponent(
        message(locale, "Informe um limite válido.", "Enter a valid limit.")
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

  const {error} = await supabase.from("credit_cards").insert({
    user_id: user.id,
    name: parsed.data.name,
    institution: parsed.data.institution || null,
    brand: parsed.data.brand,
    last_four: parsed.data.lastFour,
    credit_limit: creditLimit,
    closing_day: parsed.data.closingDay,
    due_day: parsed.data.dueDay,
    color: parsed.data.color
  });

  if (error) {
    console.error("Could not create card:", error.message);

    const isDuplicateName = error.code === "23505";

    redirect(
      `/${locale}/cards?error=${encodeURIComponent(
        isDuplicateName
          ? message(
              locale,
              "Já existe um cartão com esse nome.",
              "A card with this name already exists."
            )
          : message(
              locale,
              "Não foi possível criar o cartão.",
              "Could not create the card."
            )
      )}`
    );
  }

  revalidatePath(`/${locale}/cards`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(
    `/${locale}/cards?message=${encodeURIComponent(
      message(locale, "Cartão criado com sucesso.", "Card created successfully.")
    )}`
  );
}

export async function deleteCard(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const cardId = String(formData.get("cardId") ?? "");

  if (!z.string().uuid().safeParse(cardId).success) {
    redirect(
      `/${locale}/cards?error=${encodeURIComponent(
        message(locale, "Cartão inválido.", "Invalid card.")
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
    .from("credit_cards")
    .delete()
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Could not delete card:", error.message);

    redirect(
      `/${locale}/cards?error=${encodeURIComponent(
        message(
          locale,
          "Não foi possível excluir o cartão.",
          "Could not delete the card."
        )
      )}`
    );
  }

  revalidatePath(`/${locale}/cards`);
  revalidatePath(`/${locale}/dashboard`);

  redirect(
    `/${locale}/cards?message=${encodeURIComponent(
      message(
        locale,
        "Cartão excluído com sucesso.",
        "Card deleted successfully."
      )
    )}`
  );
}