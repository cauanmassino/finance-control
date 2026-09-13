"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";

import {createClient} from "@/lib/supabase/server";

const installmentSchema = z.object({
  locale: z.enum(["pt", "en"]),

  description: z
    .string()
    .trim()
    .min(1, "A descrição é obrigatória.")
    .max(180, "A descrição pode ter no máximo 180 caracteres."),

  totalAmount: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um valor total válido."),

  installmentsCount: z.coerce
    .number()
    .int()
    .min(2, "O número de parcelas deve ser no mínimo 2.")
    .max(48, "O número de parcelas deve ser no máximo 48."),

  firstDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data da primeira parcela."),

  categoryId: z.string().uuid("Selecione uma categoria."),

  creditCardId: z.string().uuid().optional(),

  accountId: z.string().uuid().optional(),

  notes: z.string().trim().max(1000).optional()
});

function message(locale: "pt" | "en", pt: string, en: string) {
  return locale === "en" ? en : pt;
}

function optionalValue(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue.length > 0 ? stringValue : undefined;
}

function parseCurrency(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function redirectWithError(locale: "pt" | "en", error: string): never {
  redirect(
    `/${locale}/transactions/installments/new?error=${encodeURIComponent(error)}`
  );
}

export async function createInstallmentPurchase(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const parsed = installmentSchema.safeParse({
    locale,
    description: formData.get("description"),
    totalAmount: formData.get("totalAmount"),
    installmentsCount: formData.get("installmentsCount"),
    firstDueDate: formData.get("firstDueDate"),
    categoryId: optionalValue(formData.get("categoryId")),
    creditCardId: optionalValue(formData.get("creditCardId")),
    accountId: optionalValue(formData.get("accountId")),
    notes: optionalValue(formData.get("notes"))
  });

  if (!parsed.success) {
    redirectWithError(
      locale,
      parsed.error.issues[0]?.message ??
        message(locale, "Dados inválidos.", "Invalid installment data.")
    );
  }

  const data = parsed.data;
  const totalAmount = parseCurrency(data.totalAmount);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    redirectWithError(
      locale,
      message(
        locale,
        "Informe um valor total maior que zero.",
        "Enter a total amount greater than zero."
      )
    );
  }

  const hasCard = Boolean(data.creditCardId);
  const hasAccount = Boolean(data.accountId);

  if (hasCard === hasAccount) {
    redirectWithError(
      locale,
      message(
        locale,
        "Selecione um cartão ou uma conta, mas não os dois.",
        "Select a card or account, but not both."
      )
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

  const {error} = await supabase.rpc("create_installment_purchase", {
    p_description: data.description,
    p_total_amount: totalAmount,
    p_installments_count: data.installmentsCount,
    p_first_due_date: data.firstDueDate,
    p_category_id: data.categoryId,
    p_credit_card_id: data.creditCardId ?? null,
    p_account_id: data.accountId ?? null,
    p_notes: data.notes ?? null
  });

  if (error) {
    console.error("Could not create installment purchase:", error.message);

    redirectWithError(
      locale,
      message(
        locale,
        "Não foi possível registrar a compra parcelada. Verifique os dados e tente novamente.",
        "Could not create the installment purchase. Check the data and try again."
      )
    );
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);

  redirect(
    `/${locale}/transactions?message=${encodeURIComponent(
      message(
        locale,
        "Compra parcelada registrada com sucesso.",
        "Installment purchase created successfully."
      )
    )}`
  );
}