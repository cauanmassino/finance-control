"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export async function toggleCardActive(cardId: string) {
  const supabase = await createClient();

  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  // Busca o estado atual do cartão
  const {data: card} = await supabase
    .from("credit_cards")
    .select("is_active")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .single();

  if (!card) throw new Error("Cartão não encontrado");

  // Alterna o estado
  const {error} = await supabase
    .from("credit_cards")
    .update({is_active: !card.is_active})
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/cards");
}