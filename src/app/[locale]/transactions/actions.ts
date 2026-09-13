"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";

import {createClient} from "@/lib/supabase/server";

const transactionSchema = z.object({
  locale: z.enum(["pt", "en"]),

  kind: z.enum(["income", "expense", "transfer"]),

  status: z.enum(["paid", "pending", "scheduled"]),

  description: z
    .string()
    .trim()
    .min(1, "A descrição é obrigatória.")
    .max(180, "A descrição pode ter no máximo 180 caracteres."),

  amount: z
    .string()
    .trim()
    .regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um valor válido."),

  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),

  categoryId: z.string().uuid().optional(),

  accountId: z.string().uuid().optional(),

  creditCardId: z.string().uuid().optional(),

  destinationAccountId: z.string().uuid().optional(),

  paymentMethod: z.enum([
    "cash",
    "pix",
    "debit_card",
    "credit_card",
    "bank_transfer",
    "other"
  ]),

  notes: z.string().trim().max(1000).optional()
});

function message(locale: "pt" | "en", pt: string, en: string) {
  return locale === "en" ? en : pt;
}

function parseCurrency(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function optionalValue(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue.length > 0 ? stringValue : undefined;
}

function transactionErrorRedirect(locale: "pt" | "en", error: string): never {
  redirect(`/${locale}/transactions/new?error=${encodeURIComponent(error)}`);
}

export async function createTransaction(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const parsed = transactionSchema.safeParse({
    locale,
    kind: formData.get("kind"),
    status: formData.get("status"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    occurredOn: formData.get("occurredOn"),
    categoryId: optionalValue(formData.get("categoryId")),
    accountId: optionalValue(formData.get("accountId")),
    creditCardId: optionalValue(formData.get("creditCardId")),
    destinationAccountId: optionalValue(formData.get("destinationAccountId")),
    paymentMethod: formData.get("paymentMethod"),
    notes: optionalValue(formData.get("notes"))
  });

  if (!parsed.success) {
    transactionErrorRedirect(
      locale,
      parsed.error.issues[0]?.message ??
        message(locale, "Dados inválidos.", "Invalid transaction data.")
    );
  }

  const data = parsed.data;
  const amount = parseCurrency(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    transactionErrorRedirect(
      locale,
      message(locale, "Informe um valor maior que zero.", "Enter an amount greater than zero.")
    );
  }

  // Validação de regras de domínio antes da chamada ao banco.
  if (data.kind === "transfer") {
    if (!data.accountId || !data.destinationAccountId) {
      transactionErrorRedirect(
        locale,
        message(
          locale,
          "Selecione a conta de origem e a conta de destino.",
          "Select an origin and destination account."
        )
      );
    }

    if (data.accountId === data.destinationAccountId) {
      transactionErrorRedirect(
        locale,
        message(
          locale,
          "A conta de origem e destino não podem ser iguais.",
          "Origin and destination accounts cannot be the same."
        )
      );
    }

    if (data.paymentMethod !== "bank_transfer") {
      transactionErrorRedirect(
        locale,
        message(
          locale,
          "Transferências devem usar o método transferência bancária.",
          "Transfers must use the bank transfer payment method."
        )
      );
    }
  } else {
    if (!data.categoryId) {
      transactionErrorRedirect(
        locale,
        message(
          locale,
          "Selecione uma categoria.",
          "Select a category."
        )
      );
    }

    const hasAccount = Boolean(data.accountId);
    const hasCard = Boolean(data.creditCardId);

    if (hasAccount === hasCard) {
      transactionErrorRedirect(
        locale,
        message(
          locale,
          "Selecione uma conta ou um cartão, mas não os dois.",
          "Select an account or card, but not both."
        )
      );
    }

    if (hasCard && data.paymentMethod !== "credit_card") {
      transactionErrorRedirect(
        locale,
        message(
          locale,
          "Compras no cartão exigem o método cartão de crédito.",
          "Card purchases require the credit card payment method."
        )
      );
    }

    if (!hasCard && data.paymentMethod === "credit_card") {
      transactionErrorRedirect(
        locale,
        message(
          locale,
          "O método cartão de crédito exige selecionar um cartão.",
          "Credit card payment requires selecting a card."
        )
      );
    }
  }

  const supabase = await createClient();

  const {
    data: {user},
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  let insertError;

  if (data.kind === "transfer") {
    const {error} = await supabase.from("transactions").insert({
      user_id: user.id,
      kind: "transfer",
      status: data.status,
      amount,
      description: data.description,
      occurred_on: data.occurredOn,
      category_id: null,
      account_id: data.accountId!,
      credit_card_id: null,
      destination_account_id: data.destinationAccountId!,
      payment_method: "bank_transfer",
      notes: data.notes ?? null
    });

    insertError = error;
  } else {
    const {error} = await supabase.from("transactions").insert({
      user_id: user.id,
      kind: data.kind,
      status: data.status,
      amount,
      description: data.description,
      occurred_on: data.occurredOn,
      category_id: data.categoryId!,
      account_id: data.accountId ?? null,
      credit_card_id: data.creditCardId ?? null,
      destination_account_id: null,
      payment_method: data.paymentMethod,
      notes: data.notes ?? null
    });

    insertError = error;
  }

  if (insertError) {
    console.error(
      "Could not create transaction:",
      insertError.message
    );

    transactionErrorRedirect(
      locale,
      message(
        locale,
        "Não foi possível registrar a transação. Verifique os dados e tente novamente.",
        "Could not create the transaction. Check the data and try again."
      )
    );
  }
}
