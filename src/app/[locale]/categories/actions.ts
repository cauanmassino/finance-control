"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {z} from "zod";

import {createClient} from "@/lib/supabase/server";

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome da categoria é obrigatório.")
    .max(60, "O nome pode ter no máximo 60 caracteres."),
  kind: z.enum(["income", "expense", "transfer"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida."),
  locale: z.enum(["pt", "en"])
});

function getErrorMessage(error: unknown, locale: "pt" | "en") {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Dados inválidos.";
  }

  return locale === "en"
    ? "An unexpected error occurred. Please try again."
    : "Ocorreu um erro inesperado. Tente novamente.";
}

export async function createCategory(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
    locale
  });

  if (!parsed.success) {
    const message = getErrorMessage(parsed.error, locale);

    redirect(
      `/${locale}/categories?error=${encodeURIComponent(message)}`
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

  const {error} = await supabase.from("categories").insert({
    user_id: user.id,
    name: parsed.data.name,
    kind: parsed.data.kind,
    color: parsed.data.color
  });

  if (error) {
    const message =
      error.code === "23505"
        ? locale === "en"
          ? "A category with this name already exists."
          : "Já existe uma categoria com esse nome."
        : locale === "en"
          ? "Could not create the category."
          : "Não foi possível criar a categoria.";

    redirect(
      `/${locale}/categories?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath(`/${locale}/categories`);

  redirect(
    `/${locale}/categories?message=${encodeURIComponent(
      locale === "en"
        ? "Category created successfully."
        : "Categoria criada com sucesso."
    )}`
  );
}

export async function deleteCategory(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "pt");
  const locale: "pt" | "en" = rawLocale === "en" ? "en" : "pt";

  const categoryId = String(formData.get("categoryId") ?? "");

  const idSchema = z.string().uuid();

  if (!idSchema.safeParse(categoryId).success) {
    redirect(
      `/${locale}/categories?error=${encodeURIComponent(
        locale === "en" ? "Invalid category." : "Categoria inválida."
      )}`
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

  // A cláusula .eq('user_id', user.id) reforça a intenção no código.
  // A RLS garante que uma tentativa com ID de outro usuário não seja apagada.
  const {error} = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/${locale}/categories?error=${encodeURIComponent(
        locale === "en"
          ? "Could not delete the category."
          : "Não foi possível excluir a categoria."
      )}`
    );
  }

  revalidatePath(`/${locale}/categories`);

  redirect(
    `/${locale}/categories?message=${encodeURIComponent(
      locale === "en"
        ? "Category deleted successfully."
        : "Categoria excluída com sucesso."
    )}`
  );
}