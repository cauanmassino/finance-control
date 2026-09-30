import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {CategoryForm} from "@/components/categories/category-form";

type NewCategoryPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function NewCategoryPage({
  params,
}: NewCategoryPageProps) {
  const {locale} = await params;
  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  return (
    <main className="mx-auto max-w-2xl">
      <Link
        href={`/${locale}/categories`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Voltar para categorias
      </Link>

      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Nova categoria
        </h1>

        <p className="mt-2 text-muted-foreground">
          Crie uma categoria para organizar seus lançamentos.
        </p>
      </div>

      <CategoryForm locale={locale} />
    </main>
  );
}