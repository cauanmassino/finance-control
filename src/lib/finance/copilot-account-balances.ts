import "server-only";
import {createClient} from "@/lib/supabase/server";
import type {AccountBalancesResult, FinanceQueryResult} from "@/lib/finance/copilot-queries";

type Account = {id: string; name: string; color: string | null; initial_balance: number | string; currency_code: string};
type Transaction = {id: string; type: string; amount: number | string; account_id: string | null; transfer_account_id: string | null; payment_method: string; credit_card_id: string | null};
type Page = {data: unknown[] | null; error: unknown; count: number | null};
async function allRows<T extends {id: string}>(load: (start: number, end: number) => PromiseLike<Page>) {
  const rows: T[] = [];
  const seen = new Set<string>();
  let expected: number | null = null;
  for (let page = 0; page < 100; page += 1) {
    const result = await load(rows.length, rows.length + 499);
    if (result.error || result.count === null) throw new Error("Falha ao carregar os saldos.");
    if (expected !== null && expected !== result.count) throw new Error("Os dados mudaram. Tente novamente.");
    expected = result.count;
    if (expected > 20_000) throw new Error("Histórico acima do limite de consulta desta versão.");
    const batch = (result.data ?? []) as T[];
    for (const row of batch) {
      if (!row.id || seen.has(row.id)) throw new Error("Paginação inconsistente. Tente novamente.");
      seen.add(row.id); rows.push(row);
    }
    if (rows.length === expected) return rows;
    if (!batch.length || rows.length > expected) throw new Error("Consulta incompleta.");
  }
  throw new Error("Limite de páginas excedido.");
}
function cents(value: number | string) {
  const amount = Number(value);
  const result = Math.round(amount * 100);
  if (!Number.isFinite(amount) || !Number.isSafeInteger(result)) throw new Error("Valor financeiro inválido.");
  return result;
}
export async function getCopilotAccountBalances(): Promise<FinanceQueryResult<AccountBalancesResult>> {
  try {
    const db = await createClient();
    const {data: {user}, error} = await db.auth.getUser();
    if (error || !user) return {status: "unauthenticated", message: "Entre novamente na sua conta."};
    const [accounts, transactions] = await Promise.all([
      allRows<Account>((start, end) => db.from("accounts")
        .select("id, name, color, initial_balance, currency_code", {count: "exact"})
        .eq("user_id", user.id).order("id").range(start, end)),
      allRows<Transaction>((start, end) => db.from("transactions")
        .select("id, type, amount, account_id, transfer_account_id, payment_method, credit_card_id", {count: "exact"})
        .eq("user_id", user.id).order("id").range(start, end)),
    ]);
    if (accounts.some((account) => account.currency_code.trim() !== "BRL")) {
      return {status: "error", message: "Há contas em outras moedas. Esta versão não soma moedas distintas nem faz conversão."};
    }
    const balances = new Map(accounts.map((account) => [account.id, cents(account.initial_balance)]));
    for (const transaction of transactions) {
      const amount = cents(transaction.amount);
      const source = transaction.account_id;
      const destination = transaction.transfer_account_id;
      if (transaction.type === "expense" && (transaction.payment_method === "credit_card" || transaction.payment_method === "card" || Boolean(transaction.credit_card_id))) continue;
      if (transaction.type === "income" && source && balances.has(source)) balances.set(source, balances.get(source)! + amount);
      if (transaction.type === "expense" && source && balances.has(source)) balances.set(source, balances.get(source)! - amount);
      if (transaction.type === "transfer") {
        if (source && balances.has(source)) balances.set(source, balances.get(source)! - amount);
        if (destination && balances.has(destination)) balances.set(destination, balances.get(destination)! + amount);
      }
    }
    const totalCents = [...balances.values()].reduce((sum, value) => sum + value, 0);
    if (!Number.isSafeInteger(totalCents) || [...balances.values()].some((value) => !Number.isSafeInteger(value))) throw new Error("Total fora do limite seguro.");
    return {status: "ok", data: {
      accounts: accounts.map((account) => ({id: account.id, name: account.name, color: account.color, balance: (balances.get(account.id) ?? 0) / 100})),
      totalBalance: totalCents / 100, currency: "BRL", source: "finco_records",
      rule: "Saldo inicial + receitas - despesas bancárias - transferências enviadas + transferências recebidas. Compras no crédito não debitam a conta. Inclui registros futuros/pendentes e contas inativas; não é consulta bancária em tempo real.",
    }};
  } catch (error) {
    return {status: "error", message: error instanceof Error ? error.message : "Falha ao consultar saldos."};
  }
}
