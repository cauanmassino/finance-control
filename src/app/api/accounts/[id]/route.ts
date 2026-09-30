import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{id: string}>;
};

export async function GET(
  _request: Request,
  {params}: RouteContext
) {
  const {id} = await params;

  if (!id || id === "undefined") {
    return NextResponse.json(
      {error: "Account ID is required."},
      {status: 400}
    );
  }

  const supabase = await createClient();

  const {
    data: {user},
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {error: "Unauthorized."},
      {status: 401}
    );
  }

  const {data: account, error} = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("GET ACCOUNT API ERROR:", {
      id,
      userId: user.id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });

    return NextResponse.json(
      {error: error.message},
      {status: 500}
    );
  }

  if (!account) {
    return NextResponse.json(
      {error: "Account not found."},
      {status: 404}
    );
  }

  return NextResponse.json(account);
}