import {createClient} from "@/lib/supabase/server";

type CategorySelectProps = {
  name: string;
  required?: boolean;
  defaultValue?: string;
};

export async function CategorySelect({
  name,
  required = false,
  defaultValue = "",
}: CategorySelectProps) {
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  const {data: categories} = await supabase
    .from("categories")
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
      <option value="">Sem categoria</option>

      {(categories ?? []).map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}