export type TransactionType = "income" | "expense";

export type TransactionStatus = "paid" | "pending";

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  initial_balance: number | string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  amount: number | string;
  occurred_on: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TransactionWithRelations = Transaction & {
  account: Pick<Account, "id" | "name" | "color"> | null;
  category: Pick<Category, "id" | "name" | "color" | "icon"> | null;
};