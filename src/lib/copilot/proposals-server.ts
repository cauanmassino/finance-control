import "server-only";

import {createHash} from "node:crypto";

import {createClient} from "@/lib/supabase/server";
import {getFinanceToday} from "@/lib/finance/copilot-queries";

import {
  cardDraftInputSchema,
  draftInputSchema,
  proposalSchema,
  type CardDraftInput,
  type CopilotProposal,
  type DraftInput,
  type ReviewableProposal,
} from "@/lib/copilot/proposal-types";

type DatabaseClient = Awaited<ReturnType<typeof createClient>>;

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  type: string;
};

type CardOption = {
  id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  last_four: string | null;
  closing_day: number;
  due_day: number;
};

type LabeledCardOption = CardOption & {
  label: string;
};

export const proposalFields = [
  "id",
  "type",
  "amount",
  "description",
  "occurred_on",
  "payment_method",
  "account_id",
  "account_name",
  "category_id",
  "category_name",
  "credit_card_id",
  "credit_card_name",
  "card_closing_day",
  "card_due_day",
  "expected_closing_date",
  "expected_due_date",
  "credit_card_statement_id",
  "notes",
  "currency_code",
  "status",
  "transaction_id",
  "expires_at",
  "confirmed_at",
].join(", ");

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function validateProposalTarget(proposal: CopilotProposal) {
  if (proposal.payment_method === "account") {
    if (!proposal.account_id || !proposal.account_name) {
      throw new Error("Proposta de conta inválida.");
    }

    return;
  }

  if (
    proposal.type !== "expense" ||
    proposal.account_id !== null ||
    proposal.account_name !== null ||
    !proposal.credit_card_id ||
    !proposal.credit_card_name ||
    !proposal.expected_closing_date ||
    !proposal.expected_due_date ||
    proposal.card_closing_day === null ||
    proposal.card_due_day === null
  ) {
    throw new Error("Proposta de cartão inválida.");
  }

  if (
    proposal.status === "confirmed" &&
    !proposal.credit_card_statement_id
  ) {
    throw new Error("A proposta confirmada não informou a fatura.");
  }
}

export function reviewHash(proposal: CopilotProposal) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        "finco-review-v2",
        proposal.id,
        proposal.type,
        Math.round(proposal.amount * 100),
        proposal.description,
        proposal.occurred_on,
        proposal.payment_method,
        proposal.account_id,
        proposal.account_name,
        proposal.category_id,
        proposal.category_name,
        proposal.credit_card_id,
        proposal.credit_card_name,
        proposal.card_closing_day,
        proposal.card_due_day,
        proposal.expected_closing_date,
        proposal.expected_due_date,
        proposal.notes,
        proposal.currency_code,
        proposal.expires_at,
      ]),
    )
    .digest("hex");
}

export function toReviewable(value: unknown): ReviewableProposal {
  const proposal = proposalSchema.parse(value);

  validateProposalTarget(proposal);

  return {
    ...proposal,
    reviewHash: reviewHash(proposal),
  };
}

export function requestIdFor(userId: string, messageId: string) {
  const hex = createHash("sha256")
    .update(`finco-draft-v1:${userId}:${messageId}`)
    .digest("hex")
    .slice(0, 32)
    .split("");

  hex[12] = "4";
  hex[16] = "8";

  const value = hex.join("");

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20),
  ].join("-");
}

export function friendlyProposalError(message: string) {
  const errors: Record<string, string> = {
    NOT_AUTHENTICATED:
      "Entre novamente na sua conta.",

    INVALID_TYPE_OR_REQUEST:
      "Informe uma receita ou despesa válida.",

    INVALID_AMOUNT:
      "Informe um valor positivo com até duas casas decimais.",

    INVALID_DESCRIPTION:
      "A descrição deve ter entre 1 e 120 caracteres.",

    INVALID_NOTES:
      "As observações devem ter até 500 caracteres.",

    INVALID_DATE:
      "Use uma data válida, não futura, a partir de 1900.",

    INVALID_ACCOUNT:
      "Escolha uma conta ativa em BRL. Para crédito, utilize a proposta de cartão.",

    INVALID_CATEGORY:
      "Escolha uma categoria ativa do mesmo tipo do lançamento.",

    INVALID_CREDIT_CARD:
      "O cartão não foi encontrado, está inativo ou não pertence ao usuário.",

    INVALID_CARD_CYCLE:
      "Confira os dias de fechamento e vencimento do cartão.",

    INVALID_PROPOSAL_METHOD:
      "A proposta foi enviada para um fluxo de confirmação incompatível.",

    INVALID_STATEMENT_DATES:
      "A fatura existente tem datas inconsistentes. Corrija as datas antes de preparar a compra.",

    REQUEST_ID_CONFLICT:
      "Já existe uma proposta diferente para essa mensagem. Cancele a anterior e envie uma nova mensagem.",

    INVALID_ACTION:
      "Ação inválida.",

    PROPOSAL_NOT_FOUND:
      "Proposta não encontrada ou sem permissão de acesso.",

    PROPOSAL_ALREADY_CONFIRMED:
      "Essa proposta já foi confirmada. Cancelar não desfaz um lançamento confirmado.",

    PROPOSAL_CANCELLED:
      "Essa proposta foi cancelada. Envie uma nova mensagem para recomeçar.",

    PROPOSAL_EXPIRED:
      "A proposta expirou. Prepare uma nova antes de confirmar.",

    PROPOSAL_ACCOUNT_CHANGED:
      "O nome da conta mudou. Cancele esta proposta e prepare outra.",

    PROPOSAL_CATEGORY_CHANGED:
      "O nome da categoria mudou. Cancele esta proposta e prepare outra.",

    PROPOSAL_CARD_CHANGED:
      "O cartão ou seus dias de fechamento e vencimento mudaram. Cancele esta proposta e prepare outra.",

    PROPOSAL_STATEMENT_CHANGED:
      "As datas da fatura mudaram desde a revisão. Cancele esta proposta e prepare outra.",

    STATEMENT_ALREADY_PAID:
      "O ciclo dessa compra corresponde a uma fatura marcada como paga. A compra não será adicionada automaticamente a outro ciclo.",

    STATEMENT_OWNERSHIP_CONFLICT:
      "Há uma inconsistência de titularidade na fatura. A operação foi bloqueada.",

    STATEMENT_CONFLICT:
      "Não foi possível localizar o ciclo da fatura com segurança. Tente novamente.",

    INSUFFICIENT_BALANCE:
      "Saldo insuficiente para essa despesa em conta. Nada foi gravado por esta tentativa.",
  };

  for (const [code, text] of Object.entries(errors)) {
    if (message.includes(code)) {
      return text;
    }
  }

  return (
    "Não foi possível concluir a operação. " +
    "Confira a conexão e a instalação das funções de propostas no Supabase."
  );
}

async function optionsFor(
  supabase: DatabaseClient,
  userId: string,
) {
  const [accounts, categories, cards] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name", {count: "exact"})
      .eq("user_id", userId)
      .eq("is_active", true)
      .eq("currency_code", "BRL")
      .neq("type", "credit_card")
      .order("id")
      .limit(501),

    supabase
      .from("categories")
      .select("id, name, type", {count: "exact"})
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("id")
      .limit(501),

    supabase
      .from("credit_cards")
      .select(
        "id, name, institution, brand, last_four, closing_day, due_day",
        {count: "exact"},
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("id")
      .limit(501),
  ]);

  if (accounts.error || categories.error || cards.error) {
    throw new Error(
      "Não foi possível consultar contas, categorias e cartões.",
    );
  }

  const results = [accounts, categories, cards];

  for (const result of results) {
    if (
      result.count === null ||
      result.count > 500 ||
      (result.data ?? []).length !== result.count
    ) {
      throw new Error(
        "A lista de opções está incompleta ou excedeu o limite desta versão. Utilize o formulário tradicional.",
      );
    }
  }

  const labeledCards: LabeledCardOption[] = (
    (cards.data ?? []) as CardOption[]
  ).map((card) => {
    const details = [
      card.institution,
      card.brand,
      card.last_four ? `final ${card.last_four}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      ...card,
      label: details
        ? `${card.name} — ${details}`
        : card.name,
    };
  });

  return {
    accounts: (accounts.data ?? []) as AccountOption[],
    categories: (categories.data ?? []) as CategoryOption[],
    cards: labeledCards,
  };
}

function matchByName<T extends {name: string}>(
  items: T[],
  value: string,
) {
  const term = normalize(value);

  const exact = items.filter(
    (item) => normalize(item.name) === term,
  );

  return exact.length
    ? exact
    : items.filter((item) =>
        normalize(item.name).includes(term),
      );
}

function matchCards(
  cards: LabeledCardOption[],
  value: string,
) {
  const term = normalize(value);

  const exact = cards.filter(
    (card) =>
      normalize(card.name) === term ||
      normalize(card.label) === term,
  );

  return exact.length
    ? exact
    : cards.filter((card) =>
        normalize(card.label).includes(term),
      );
}

function findCategory(
  categories: CategoryOption[],
  name: string | null,
  type: "income" | "expense",
) {
  if (!name || normalize(name) === "sem categoria") {
    return {
      category: null,
      choices: [],
      needsClarification: false,
    };
  }

  const allowed = categories.filter(
    (category) => category.type === type,
  );

  const found = matchByName(allowed, name);

  return {
    category: found.length === 1 ? found[0] : null,
    choices: found.length ? found : allowed,
    needsClarification: found.length !== 1,
  };
}

function preparedResult(value: unknown) {
  const proposal = toReviewable(value);

  return {
    status: "ok",
    proposalId: proposal.id,
    proposalStatus: proposal.status,
    paymentMethod: proposal.payment_method,
    transactionId: proposal.transaction_id,
    message:
      proposal.status === "pending"
        ? "Proposta preparada, sem confirmar lançamento. Oriente revisar o cartão em Propostas para revisar e clicar em Confirmar lançamento."
        : "Esta solicitação já foi processada. Não foi criado outro lançamento por esta resposta.",
  };
}

export async function getTransactionOptions() {
  try {
    const supabase = await createClient();

    const {
      data: {user},
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        status: "unauthenticated",
        message: "Entre novamente na sua conta.",
      };
    }

    return {
      status: "ok",
      data: await optionsFor(supabase, user.id),
    };
  } catch {
    return {
      status: "error",
      message:
        "Não foi possível consultar as opções completas de contas, cartões e categorias.",
    };
  }
}

export async function prepareTransactionProposal(
  requestId: string,
  rawInput: DraftInput,
) {
  const parsed = draftInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos do lançamento.",
    };
  }

  const input = parsed.data;

  try {
    const supabase = await createClient();

    const {
      data: {user},
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        status: "unauthenticated",
        message: "Entre novamente na sua conta.",
      };
    }

    const options = await optionsFor(supabase, user.id);

    if (!input.accountName) {
      return {
        status: "needs_clarification",
        message: "Pergunte qual conta utilizar.",
        accounts: options.accounts,
      };
    }

    const accounts = matchByName(
      options.accounts,
      input.accountName,
    );

    if (accounts.length !== 1) {
      return {
        status: "needs_clarification",
        message: "Peça uma conta válida e sem ambiguidade.",
        accounts: accounts.length
          ? accounts
          : options.accounts,
      };
    }

    const categoryResult = findCategory(
      options.categories,
      input.categoryName,
      input.type,
    );

    if (categoryResult.needsClarification) {
      return {
        status: "needs_clarification",
        message:
          "Peça uma categoria válida ou autorização para deixar sem categoria.",
        categories: categoryResult.choices,
      };
    }

    const {data, error: rpcError} = await supabase.rpc(
      "prepare_copilot_transaction_v1",
      {
        p_request_id: requestId,
        p_type: input.type,
        p_amount: input.amountCents / 100,
        p_description: input.description,
        p_occurred_on:
          input.occurredOn ?? getFinanceToday(),
        p_account_id: accounts[0].id,
        p_category_id:
          categoryResult.category?.id ?? null,
        p_notes: input.notes,
      },
    );

    if (rpcError) {
      return {
        status: "error",
        message: friendlyProposalError(rpcError.message),
      };
    }

    return preparedResult(data);
  } catch {
    return {
      status: "error",
      message:
        "Não foi possível conferir a preparação. Atualize as propostas antes de repetir. Nenhuma confirmação foi solicitada por esta ferramenta.",
    };
  }
}

export async function prepareCardPurchaseProposal(
  requestId: string,
  rawInput: CardDraftInput,
) {
  const parsed = cardDraftInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos da compra no cartão.",
    };
  }

  const input = parsed.data;

  try {
    const supabase = await createClient();

    const {
      data: {user},
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        status: "unauthenticated",
        message: "Entre novamente na sua conta.",
      };
    }

    const options = await optionsFor(supabase, user.id);

    if (!input.creditCardName) {
      return {
        status: "needs_clarification",
        message: "Pergunte qual cartão de crédito utilizar.",
        cards: options.cards,
      };
    }

    const cards = matchCards(
      options.cards,
      input.creditCardName,
    );

    if (cards.length !== 1) {
      return {
        status: "needs_clarification",
        message:
          "Peça um cartão válido e sem ambiguidade. Use o nome ou os últimos quatro dígitos para distinguir.",
        cards: cards.length ? cards : options.cards,
      };
    }

    const categoryResult = findCategory(
      options.categories,
      input.categoryName,
      "expense",
    );

    if (categoryResult.needsClarification) {
      return {
        status: "needs_clarification",
        message:
          "Peça uma categoria de despesa válida ou autorização para deixar sem categoria.",
        categories: categoryResult.choices,
      };
    }

    const {data, error: rpcError} = await supabase.rpc(
      "prepare_copilot_card_purchase_v1",
      {
        p_request_id: requestId,
        p_amount: input.amountCents / 100,
        p_description: input.description,
        p_occurred_on:
          input.occurredOn ?? getFinanceToday(),
        p_credit_card_id: cards[0].id,
        p_category_id:
          categoryResult.category?.id ?? null,
        p_notes: input.notes,
      },
    );

    if (rpcError) {
      return {
        status: "error",
        message: friendlyProposalError(rpcError.message),
      };
    }

    return preparedResult(data);
  } catch {
    return {
      status: "error",
      message:
        "Não foi possível conferir a proposta do cartão. Atualize a lista antes de repetir. Nenhuma compra foi confirmada por esta ferramenta.",
    };
  }
}