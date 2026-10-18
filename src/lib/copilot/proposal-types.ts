import {z} from "zod";

export const proposalSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().finite().positive(),
  description: z.string(),
  occurred_on: z.string(),
  account_id: z.string().uuid(),
  account_name: z.string(),
  category_id: z.string().uuid().nullable(),
  category_name: z.string().nullable(),
  notes: z.string().nullable(),
  currency_code: z.literal("BRL"),
  status: z.enum(["pending", "confirmed", "cancelled"]),
  transaction_id: z.string().uuid().nullable(),
  expires_at: z.string(),
  confirmed_at: z.string().nullable(),
});
export type CopilotProposal = z.infer<typeof proposalSchema>;
export type ReviewableProposal = CopilotProposal & {reviewHash: string};

export const draftInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  amountCents: z.number().int().min(1).max(99_999_999_999)
    .describe("Valor em centavos: R$ 50,00 = 5000."),
  description: z.string().trim().min(1).max(120),
  accountName: z.string().trim().min(1).max(80).nullable()
    .describe("Conta informada pelo usuário; null quando ausente. Não invente."),
  categoryName: z.string().trim().min(1).max(60).nullable()
    .describe("Categoria informada ou aprovada pelo usuário; null significa sem categoria."),
  occurredOn: z.string().nullable()
    .describe("AAAA-MM-DD. null usa hoje em São Paulo."),
  notes: z.string().trim().max(500).nullable(),
});
export type DraftInput = z.infer<typeof draftInputSchema>;
