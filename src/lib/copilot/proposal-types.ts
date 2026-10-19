import {z} from "zod";

export const proposalSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["income", "expense"]),

  amount: z.coerce.number().finite().positive(),
  description: z.string(),
  occurred_on: z.string(),

  payment_method: z.enum(["account", "credit_card"]),

  account_id: z.string().uuid().nullable(),
  account_name: z.string().nullable(),

  category_id: z.string().uuid().nullable(),
  category_name: z.string().nullable(),

  credit_card_id: z.string().uuid().nullable(),
  credit_card_name: z.string().nullable(),

  card_closing_day: z.number().int().nullable(),
  card_due_day: z.number().int().nullable(),

  expected_closing_date: z.string().nullable(),
  expected_due_date: z.string().nullable(),

  credit_card_statement_id: z.string().uuid().nullable(),

  notes: z.string().nullable(),
  currency_code: z.literal("BRL"),

  status: z.enum(["pending", "confirmed", "cancelled"]),
  transaction_id: z.string().uuid().nullable(),

  expires_at: z.string(),
  confirmed_at: z.string().nullable(),
});

export type CopilotProposal = z.infer<typeof proposalSchema>;

export type ReviewableProposal = CopilotProposal & {
  reviewHash: string;
};

const amountCentsSchema = z
  .number()
  .int()
  .min(1)
  .max(99_999_999_999)
  .describe("Valor em centavos: R$ 50,00 = 5000; R$ 12,50 = 1250.");

const descriptionSchema = z.string().trim().min(1).max(120);

const categoryNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .nullable()
  .describe(
    "Categoria informada ou aprovada pelo usuário. null significa sem categoria.",
  );

const occurredOnSchema = z
  .string()
  .nullable()
  .describe(
    "Data AAAA-MM-DD. null utiliza hoje no fuso de São Paulo.",
  );

const notesSchema = z.string().trim().max(500).nullable();

export const draftInputSchema = z.object({
  type: z.enum(["income", "expense"]),
  amountCents: amountCentsSchema,
  description: descriptionSchema,

  accountName: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .nullable()
    .describe(
      "Conta informada pelo usuário. null quando ausente. Não invente.",
    ),

  categoryName: categoryNameSchema,
  occurredOn: occurredOnSchema,
  notes: notesSchema,
});

export const cardDraftInputSchema = z.object({
  amountCents: amountCentsSchema,
  description: descriptionSchema,

  creditCardName: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .nullable()
    .describe(
      "Nome do cartão de crédito informado pelo usuário. Pode incluir instituição ou últimos quatro dígitos para resolver ambiguidades. null quando ausente.",
    ),

  categoryName: categoryNameSchema,
  occurredOn: occurredOnSchema,
  notes: notesSchema,
});

export type DraftInput = z.infer<typeof draftInputSchema>;

export type CardDraftInput = z.infer<typeof cardDraftInputSchema>;