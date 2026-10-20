import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoriesBrowser, type CategoryListItem} from "@/components/categories/categories-browser";

export const metadata: Metadata = {
  title: "Categorias",
  description: "Organize receitas e despesas por categoria.",
};

type CategoriesPageProps = {params: Promise<{locale: string}>};

export default async function CategoriesPage({params}: CategoriesPageProps) {
  const {locale: receivedLocale} = await params;
  const locale = receivedLocale === "en" ? "en" : "pt";
  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const {data: categories, error} = await supabase
    .from("categories")
    .select("id, name, type, color, icon")
    .eq("user_id", user.id)
    .order("name", {ascending: true});

  if (error) {
    console.error("Erro detalhado ao carregar categorias:", {
      code: error.code, message: error.message,
      details: error.details, hint: error.hint,
    });
    throw new Error("Não foi possível carregar as categorias.");
  }

  return <CategoriesBrowser locale={locale} categories={(categories ?? []) as CategoryListItem[]}/>;
}
