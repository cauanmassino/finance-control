import {createClient} from "@/lib/supabase/server";
import type {PostgrestError} from "@supabase/supabase-js";

export type GoalContributionRow = {
 id: string;
 goal_id: string;
 amount: number | string;
 contribution_type: "contribution" | "withdrawal" | "initial_balance";
 source_account_id: string | null;
 occurred_on: string;
 notes: string | null;
 created_at: string;
};
type Client = Awaited<ReturnType<typeof createClient>>;
type Result = {data: GoalContributionRow[] | null; error: PostgrestError | null};

export async function loadGoalContributions(supabase: Client, userId: string): Promise<Result> {
 const rows: GoalContributionRow[] = [];
 const pageSize = 500;
 for (let from = 0; ; from += pageSize) {
  const {data,error} = await supabase.from("goal_contributions")
   .select("id, goal_id, amount, contribution_type, source_account_id, occurred_on, notes, created_at")
   .eq("user_id",userId)
   .order("occurred_on",{ascending:false})
   .order("created_at",{ascending:false})
   .order("id",{ascending:false})
   .range(from,from+pageSize-1);
  if (error) return {data:null,error};
  const page = (data ?? []) as GoalContributionRow[];
  rows.push(...page);
  if (page.length<pageSize) break;
 }
 return {data:rows,error:null};
}
