"use server";

import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export async function deleteCreditCard(cardId: string) {
  const supabase = await createClient();

  const {data: {user}} = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const {error} = await supabase.rpc("delete_credit_card_cascade", {
    p_card_id: cardId,
    p_user_id: user.id,
  });

  if (error) throw error;

  revalidatePath("/cards");
}