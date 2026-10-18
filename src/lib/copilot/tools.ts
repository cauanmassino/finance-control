import {tool} from "ai";
import {z} from "zod";
import {compareMonthExpenses, getExpensesByPeriod, getNextStatement} from "@/lib/finance/copilot-queries";
import {getCopilotAccountBalances} from "@/lib/finance/copilot-account-balances";
import {draftInputSchema} from "@/lib/copilot/proposal-types";
import {getTransactionOptions, prepareTransactionProposal} from "@/lib/copilot/proposals-server";

const periodSchema = z.object({
  period: z.enum(["current_month", "previous_month", "last_30_days", "custom"])
    .describe("Mês atual completo, mês anterior, últimos 30 dias ou datas customizadas."),
  from: z.string().nullable().describe("Início AAAA-MM-DD em custom; nos demais envie null."),
  to: z.string().nullable().describe("Fim inclusivo AAAA-MM-DD em custom; nos demais envie null."),
});
export const copilotTools = {
  getAccountBalances: tool({
    description: "Consulta saldos registrados, sem debitar compras no crédito da conta. Não é consulta bancária em tempo real.",
    inputSchema: z.object({}), execute: async () => getCopilotAccountBalances(),
  }),
  getCurrentMonthExpenses: tool({
    description: "Consulta despesas do mês atual completo e ranking por categoria.",
    inputSchema: z.object({}), execute: async () => getExpensesByPeriod({period: "current_month"}),
  }),
  getExpensesByPeriod: tool({
    description: "Consulta despesas por período e categoria opcional. Não busca estabelecimento pela descrição.",
    inputSchema: periodSchema.extend({categoryName: z.string().trim().min(2).max(80).nullable().describe("Categoria, Sem categoria, ou null para todas.")}),
    execute: async (input) => getExpensesByPeriod(input),
  }),
  getExpensesByCategory: tool({
    description: "Consulta ranking das categorias por gasto no período. Observe empates.",
    inputSchema: periodSchema, execute: async (input) => getExpensesByPeriod({...input, categoryName: null}),
  }),
  compareMonthExpenses: tool({
    description: "Compara mês atual e anterior. Use same_days por padrão e full_months somente quando solicitado.",
    inputSchema: z.object({mode: z.enum(["same_days", "full_months"])}),
    execute: async ({mode}) => compareMonthExpenses(mode),
  }),
  getNextStatement: tool({
    description: "Consulta uma fatura pendente com vencimento mais antigo, que pode estar vencida. Não é dívida total.",
    inputSchema: z.object({}), execute: async () => getNextStatement(),
  }),
};
export function createCopilotTools(requestId: string) {
  return {
    ...copilotTools,
    getTransactionOptions: tool({
      description: "Lista contas ativas BRL e categorias ativas para preparar receita ou despesa simples. Não invente nomes ou IDs.",
      inputSchema: z.object({}), execute: async () => getTransactionOptions(),
    }),
    prepareTransactionProposal: tool({
      description: "Prepara proposta temporária para revisão, sem criar lançamento financeiro. Somente pedido explícito de receita/despesa simples em conta. Uma proposta por mensagem. Não aceita cartão, transferência, fatura, parcelas, recorrência, hipótese ou exemplo. A confirmação é apenas pelo botão da interface.",
      inputSchema: draftInputSchema,
      execute: async (input) => prepareTransactionProposal(requestId, input),
    }),
  };
}
