import {createClient} from "@/lib/supabase/server";

type AccountSelectProps = {
  name: string;
  required?: boolean;
  defaultValue?: string;
};

export async function AccountSelect({
  name,
  required = false,
  defaultValue = "",
}: AccountSelectProps) {
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  const {data: accounts} = await supabase
    .from("accounts")
    .select("id, name")
    .eq("user_id", user?.id ?? "")
    .order("name", {ascending: true});

  return (
    <select
      name={name}
      required={required}
      defaultValue={defaultValue}
      className="app-input h-11 rounded-xl bg-white/[0.03] px-3.5 text-sm text-slate-100 focus:bg-white/[0.05]"
    >
      <option value="">Selecione a conta</option>

      {(accounts ?? []).map((acc) => (
        <option key={acc.id} value={acc.id}>
          {acc.name}
        </option>
      ))}
    </select>
  );
}