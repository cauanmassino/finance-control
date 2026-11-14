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

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return parsedDate.toISOString().slice(0, 10) === value;
}

function revalidatePaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/accounts`);
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
  const amountText = getText(formData, "amount");
  const amount = Number(amountText);
  const occurredOn = getText(formData, "occurred_on");
  const fromAccountId = getText(formData, "from_account_id");
  const toAccountId = getText(formData, "to_account_id");
  const notes = getText(formData, "notes") || null;

  if (!locale || !/^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(locale)) {
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

  if (!amountText || !Number.isFinite(amount) || amount <= 0) {
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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const {data: accounts, error: accountsError} = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .in("id", [fromAccountId, toAccountId]);

  if (accountsError) {
    console.error("Erro ao validar contas da transferência:", {
      code: accountsError.code,
      message: accountsError.message,
      details: accountsError.details,
      hint: accountsError.hint,
    });

    return {
      error: "Não foi possível validar as contas. Tente novamente.",
    };
  }

  const accountIds = new Set(
    (accounts ?? []).map((account) => account.id),
  );

  if (
    accountIds.size !== 2 ||
    !accountIds.has(fromAccountId) ||
    !accountIds.has(toAccountId)
  ) {
    return {
      error: "Uma ou mais contas selecionadas não são válidas.",
    };
  }

  const transferId = randomUUID();

  // Uma única linha representa a transferência completa.
  // O cálculo de saldo da página de contas:
  // - subtrai amount de account_id;
  // - soma amount em transfer_account_id.
  //
  // Não inserir uma segunda linha com as contas invertidas,
  // pois isso anularia o efeito da transferência.
  const {error: transferError} = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      description,
      amount,
      type: "transfer",
      occurred_on: occurredOn,
      account_id: fromAccountId,
      transfer_account_id: toAccountId,
      transfer_id: transferId,
      payment_method: "transfer",
      notes,
    });

  if (transferError) {
    console.error("Erro detalhado ao criar transferência:", {
      code: transferError.code,
      message: transferError.message,
      details: transferError.details,
      hint: transferError.hint,
    });

    if (
      transferError.code === "23514" &&
      transferError.message.includes(
        "transactions_payment_method_check",
      )
    ) {
      return {
        error:
          'O banco rejeitou o método "transfer". ' +
          "É necessário conferir a expressão completa da regra " +
          "transactions_payment_method_check.",
      };
    }

    if (
      transferError.code === "23502" &&
      transferError.message.includes("payment_method")
    ) {
      return {
        error:
          "O banco recebeu um método de pagamento vazio, " +
          'mesmo com o envio de "transfer". ' +
          "Confira se o código atualizado está em execução " +
          "e se há algum trigger alterando esse campo.",
      };
    }

    return {
      error: "Não foi possível criar a transferência.",
    };
  }

  revalidatePaths(locale);

  redirect(`/${locale}/transactions`);
}