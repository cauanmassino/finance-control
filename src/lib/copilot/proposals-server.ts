import "server-only";
import {createHash} from "node:crypto";
import {createClient} from "@/lib/supabase/server";
import {getFinanceToday} from "@/lib/finance/copilot-queries";
import {
  draftInputSchema, proposalSchema,
  type CopilotProposal, type DraftInput, type ReviewableProposal,
} from "@/lib/copilot/proposal-types";

type Db = Awaited<ReturnType<typeof createClient>>;
type AccountOption = {id: string; name: string};
type CategoryOption = {id: string; name: string; type: string};
export const proposalFields = "id, type, amount, description, occurred_on, account_id, account_name, category_id, category_name, notes, currency_code, status, transaction_id, expires_at, confirmed_at";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}
export function reviewHash(proposal: CopilotProposal) {
  return createHash("sha256").update(JSON.stringify([
    proposal.id, proposal.type, Math.round(proposal.amount * 100),
    proposal.description, proposal.occurred_on, proposal.account_id,
    proposal.account_name, proposal.category_id, proposal.category_name,
    proposal.notes, proposal.currency_code, proposal.expires_at,
  ])).digest("hex");
}
export function toReviewable(value: unknown): ReviewableProposal {
  const proposal = proposalSchema.parse(value);
  return {...proposal, reviewHash: reviewHash(proposal)};
}
export function requestIdFor(userId: string, messageId: string) {
  const hex = createHash("sha256").update(`finco-draft-v1:${userId}:${messageId}`)
    .digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = "8";
  const value = hex.join("");
  return `${value.slice(0,8)}-${value.slice(8,12)}-${value.slice(12,16)}-${value.slice(16,20)}-${value.slice(20)}`;
}
export function friendlyProposalError(message: string) {
  const errors: Record<string, string> = {
    NOT_AUTHENTICATED: "Entre novamente na sua conta.",
    INVALID_TYPE_OR_REQUEST: "Só é possível preparar uma receita ou despesa simples.",
    INVALID_AMOUNT: "Informe um valor positivo com até duas casas decimais.",
    INVALID_DESCRIPTION: "A descrição deve ter entre 1 e 120 caracteres.",
    INVALID_NOTES: "As observações devem ter até 500 caracteres.",
    INVALID_DATE: "Use uma data válida, não futura, a partir de 1900.",
    INVALID_ACCOUNT: "Escolha uma conta ativa BRL, que não seja cartão.",
    INVALID_CATEGORY: "Escolha uma categoria ativa do mesmo tipo do lançamento.",
    REQUEST_ID_CONFLICT: "Já existe uma proposta diferente para essa mensagem. Cancele a anterior e envie uma nova mensagem.",
    INVALID_ACTION: "Ação inválida.",
    PROPOSAL_NOT_FOUND: "Proposta não encontrada ou sem permissão.",
    PROPOSAL_ALREADY_CONFIRMED: "Essa proposta já foi confirmada; cancelar não desfaz o lançamento.",
    PROPOSAL_CANCELLED: "Essa proposta foi cancelada. Envie uma nova mensagem para recomeçar.",
    PROPOSAL_EXPIRED: "A proposta expirou. Prepare uma nova antes de confirmar.",
    PROPOSAL_ACCOUNT_CHANGED: "O nome da conta mudou. Cancele a proposta e prepare outra.",
    PROPOSAL_CATEGORY_CHANGED: "O nome da categoria mudou. Cancele a proposta e prepare outra.",
    INSUFFICIENT_BALANCE: "Saldo insuficiente para essa despesa. Nada foi gravado por esta tentativa.",
  };
  for (const [code, text] of Object.entries(errors)) {
    if (message.includes(code)) return text;
  }
  return "Não foi possível concluir a operação. Confira a conexão e as funções de propostas no Supabase.";
}
async function optionsFor(db: Db, userId: string) {
  const [accounts, categories] = await Promise.all([
    db.from("accounts").select("id, name", {count: "exact"})
      .eq("user_id", userId).eq("is_active", true).eq("currency_code", "BRL")
      .neq("type", "credit_card").order("id").limit(501),
    db.from("categories").select("id, name, type", {count: "exact"})
      .eq("user_id", userId).eq("is_active", true).order("id").limit(501),
  ]);
  if (accounts.error || categories.error) throw new Error("Falha ao consultar contas e categorias.");
  if (accounts.count === null || categories.count === null ||
      accounts.count > 500 || categories.count > 500 ||
      (accounts.data ?? []).length !== accounts.count ||
      (categories.data ?? []).length !== categories.count) {
    throw new Error("Lista incompleta ou acima do limite desta versão. Use o formulário tradicional.");
  }
  return {accounts: (accounts.data ?? []) as AccountOption[], categories: (categories.data ?? []) as CategoryOption[]};
}
function matches<T extends {name: string}>(items: T[], value: string) {
  const term = normalize(value);
  const exact = items.filter((item) => normalize(item.name) === term);
  return exact.length ? exact : items.filter((item) => normalize(item.name).includes(term));
}
export async function getTransactionOptions() {
  try {
    const db = await createClient();
    const {data: {user}, error} = await db.auth.getUser();
    if (error || !user) return {status: "unauthenticated", message: "Entre novamente na sua conta."};
    return {status: "ok", data: await optionsFor(db, user.id)};
  } catch {
    return {status: "error", message: "Não foi possível consultar as opções completas de contas e categorias."};
  }
}
export async function prepareTransactionProposal(requestId: string, rawInput: DraftInput) {
  const parsed = draftInputSchema.safeParse(rawInput);
  if (!parsed.success) return {status: "error", message: "Confira os campos do lançamento."};
  const input = parsed.data;
  try {
    const db = await createClient();
    const {data: {user}, error} = await db.auth.getUser();
    if (error || !user) return {status: "unauthenticated", message: "Entre novamente na sua conta."};
    const options = await optionsFor(db, user.id);
    if (!input.accountName) return {status: "needs_clarification", message: "Pergunte qual conta usar.", accounts: options.accounts};
    const accounts = matches(options.accounts, input.accountName);
    if (accounts.length !== 1) return {
      status: "needs_clarification", message: "Peça uma conta válida e sem ambiguidade.",
      accounts: accounts.length ? accounts : options.accounts,
    };
    let category: CategoryOption | null = null;
    if (input.categoryName && normalize(input.categoryName) !== "sem categoria") {
      const allowed = options.categories.filter((item) => item.type === input.type);
      const found = matches(allowed, input.categoryName);
      if (found.length !== 1) return {status: "needs_clarification", message: "Peça uma categoria válida e sem ambiguidade, ou autorização para deixar sem categoria.", categories: found.length ? found : allowed};
      category = found[0];
    }
    const {data, error: rpcError} = await db.rpc("prepare_copilot_transaction_v1", {
      p_request_id: requestId, p_type: input.type,
      p_amount: input.amountCents / 100, p_description: input.description,
      p_occurred_on: input.occurredOn ?? getFinanceToday(),
      p_account_id: accounts[0].id, p_category_id: category?.id ?? null,
      p_notes: input.notes,
    });
    if (rpcError) return {status: "error", message: friendlyProposalError(rpcError.message)};
    const proposal = toReviewable(data);
    return {
      status: "ok", proposalId: proposal.id, proposalStatus: proposal.status,
      transactionId: proposal.transaction_id,
      message: proposal.status === "pending"
        ? "Proposta preparada. Nenhum lançamento confirmado. Revise o cartão e clique em Confirmar lançamento."
        : "Esta solicitação já foi processada; não foi criado outro lançamento.",
    };
  } catch {
    return {status: "error", message: "Não foi possível confirmar a preparação. Atualize as propostas antes de repetir. Nenhuma confirmação foi solicitada por esta ferramenta."};
  }
}
