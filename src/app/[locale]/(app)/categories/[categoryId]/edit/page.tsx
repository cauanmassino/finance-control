import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {EditCategoryForm} from "@/components/categories/edit-category-form";
import type {Category} from "@/types/database";

type EditCategoryPageProps = {
  params: Promise<{
    locale: string;
    categoryId: string;
  }>;
};

export default async function EditCategoryPage({
  params
}: EditCategoryPageProps) {
  const {locale: rawLocale, categoryId} = await params;

  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";
  const isEnglish = locale === "en";

  if (!categoryId || categoryId === "undefined") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/categories`}
          className="text-sm font-medium text-emerald-400"
        >
          ← {isEnglish ? "Back to categories" : "Voltar para categorias"}
        </Link>

        <div className="mt-8 rounded-xl border border-rose-900/70 bg-rose-950/40 p-5">
          <h1 className="font-semibold text-rose-200">
            {isEnglish ? "Category ID not found" : "ID da categoria não encontrado"}
          </h1>

          <p className="mt-2 text-sm text-rose-300">
            {isEnglish
              ? "The route did not receive the category ID."
              : "A rota não recebeu o ID da categoria."}
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const {
    data: {user},
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const {data: category, error} = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !category) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/categories`}
          className="text-sm font-medium text-emerald-400"
        >
          ← {isEnglish ? "Back to categories" : "Voltar para categorias"}
        </Link>

        <div className="mt-8 rounded-xl border border-rose-900/70 bg-rose-950/40 p-5">
          <h1 className="font-semibold text-rose-200">
            {isEnglish ? "Category not found" : "Categoria não encontrada"}
          </h1>

          <p className="mt-2 text-sm text-rose-300">
            {isEnglish
              ? "The category does not exist or does not belong to this user."
              : "A categoria não existe ou não pertence a este usuário."}
          </p>

          <p className="mt-4 break-all text-xs text-slate-400">
            ID: {categoryId}
          </p>

          {error ? (
            <p className="mt-2 break-words text-xs text-slate-400">
              Erro: {error.message}
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={`/${locale}/categories`}
          className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          ← {isEnglish ? "Back to categories" : "Voltar para categorias"}
        </Link>

        <p className="mt-6 text-sm font-medium text-emerald-400">
          {isEnglish ? "Financial organization" : "Organização financeira"}
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          {isEnglish ? "Edit category" : "Editar categoria"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {isEnglish
            ? "Update the category details used in your financial records."
            : "Atualize os dados da categoria usada nos seus lançamentos."}
        </p>
      </div>

      <EditCategoryForm
        locale={locale}
        category={category as Category}
      />
    </main>
  );
}