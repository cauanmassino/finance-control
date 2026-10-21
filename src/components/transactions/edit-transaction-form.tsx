"use client";
import {TransactionForm} from "@/components/transactions/transaction-form";
import type {AccountOption,CategoryOption,CardOption,EditableTransaction} from "@/components/transactions/transaction-form-types";
export type EditAccount=AccountOption;
export type EditCategory=CategoryOption;
export type EditCard=CardOption;
export type {EditableTransaction};
type Props={locale:"pt"|"en";accounts:EditAccount[];categories:EditCategory[];cards:EditCard[];transaction:EditableTransaction};
export function EditTransactionForm({locale,accounts,categories,cards,transaction}:Props) {
 return <TransactionForm key={`${transaction.id}:${transaction.updated_at}`} mode="edit" initialValues={transaction} locale={locale} accounts={accounts} categories={categories} cards={cards}/>;
}
