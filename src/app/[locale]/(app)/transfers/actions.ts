"use server";

import {randomUUID} from "crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export type TransferState = {
  error?: string;
};

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T12:00:00`);

  return !Number.isNaN(parsedDate.getTime());
}

function revalidatePaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/transfers`);
  revalidatePath(`/${locale}/reports`);
}

export async function createTransfer(
  _previousState: TransferState,
  formData: FormData,
): Promise<TransferState> {
  const locale = getText(formData, "locale");
  const description = getText(formData, "description");
  const amount = Number(getText(formData, "amount"));
  const occurredOn = getText(formData, "occurred_on");
  const fromAccountId = getText(formData, "from_account_id");
  const toAccountId = getText(formData, "to_account_id");
  const notes = getText(formData, "notes") || null;

  if (!locale) {
    return {
      error: "Idioma inválido.",
    };
  }

  if (!description) {
    return {
      error: "Informe uma descrição.",
    };
  }

  if (description.length > 120) {
    return {
      error: "A descrição deve ter no máximo 120 caracteres.",
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      error: "Informe um valor maior que zero.",
    };
  }

  if (!isValidDate(occurredOn)) {
    return {
      error: "Informe uma data válida.",
    };
  }

  if (!fromAccountId || !toAccountId) {
    return {
      error: "Escolha uma conta de origem e uma conta de destino.",
    };
  }

  if (fromAccountId === toAccountId) {
    return {
      error: "A conta de origem e a conta de destino devem ser diferentes.",
    };
  }

  if (notes && notes.length > 500) {
    return {
      error: "A observação deve ter no máximo 500 caracteres.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: accounts, error: accountsError} = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .in("id", [fromAccountId, toAccountId]);

  if (accountsError || accounts?.length !== 2) {
    return {
      error: "Uma ou mais contas selecionadas não são válidas.",
    };
  }

  const transferId = randomUUID();

  const {error: transferError} = await supabase
    .from("transactions")
    .insert([
      {
        user_id: user.id,
        description,
        amount,
        type: "transfer",
        occurred_on: occurredOn,
        account_id: fromAccountId,
        transfer_account_id: toAccountId,
        transfer_id: transferId,
        payment_method: "other",
        notes,
      },
      {
        user_id: user.id,
        description,
        amount,
        type: "transfer",
        occurred_on: occurredOn,
        account_id: toAccountId,
        transfer_account_id: fromAccountId,
        transfer_id: transferId,
        payment_method: "other",
        notes,
      },
    ]);

  if (transferError) {
    console.error("Erro detalhado ao criar transferência:", {
      code: transferError.code,
      message: transferError.message,
      details: transferError.details,
      hint: transferError.hint,
    });

    return {
      error: "Não foi possível criar a transferência.",
    };
  }

  revalidatePaths(locale);

  redirect(`/${locale}/transactions`);
}