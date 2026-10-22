export type AccountOption = {
  id: string;
  name: string;
  color?: string | null;
};

export type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
  is_active?: boolean;
  color?: string | null;
  icon?: string | null;
};

export type CardOption = {
  id: string;
  name: string;
  institution: string | null;
  brand: string | null;
  last_four: string | null;
  is_active?: boolean;
};

export type EditableTransaction = {
  id: string;
  description: string;
  amount: number | string;
  type: "income" | "expense";
  occurred_on: string;
  account_id: string | null;
  category_id: string | null;
  payment_method: string | null;
  notes: string | null;
  credit_card_id: string | null;
  credit_card_statement_id: string | null;
  status: "paid" | "pending";
  updated_at: string;
  recurring_transaction_id: string | null;
  installment_plan_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
};