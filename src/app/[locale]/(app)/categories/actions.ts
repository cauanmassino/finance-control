"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

type CategoryType = "income" | "expense";

export type CategoryState = {
  error?: string;
};

type CategoryFields = {
  locale: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isCategoryType(value: string): value is CategoryType {
  return value === "income" || value === "expense";
}

function isValidColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function validateCategoryFields(
  formData: FormData,
): CategoryFields | CategoryState {
  const locale = getText(formData, "locale");
  const name = getText(formData, "name");
  const type = getText(formData, "type");
  const color = getText(formData, "color");
  const icon = getText(formData, "icon") || null;

  if (!locale) {
    return {
      error: "Idioma inválido.",
    };
  }

  if (!name) {
    return {
      error: "Informe o nome da categoria.",
    };
  }

  if (name.length > 50) {
    return {
      error: "O nome da categoria deve ter no máximo 50 caracteres.",
    };
  }

  if (!isCategoryType(type)) {
    return {
      error: "Escolha se a categoria é uma receita ou uma despesa.",
    };
  }

  if (!isValidColor(color)) {
    return {
      error: "Escolha uma cor válida.",
    };
  }

  if (icon && icon.length > 10) {
    return {
      error: "O ícone deve ter no máximo 10 caracteres.",
    };
  }

  return {
    locale,
    name,
    type,
    color,
    icon,
  };
}

function hasError(
  fields: CategoryFields | CategoryState,
): fields is CategoryState {
  return "error" in fields;
}

function revalidateCategoryPaths(locale: string) {
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/categories`);
  revalidatePath(`/${locale}/transactions`);
  revalidatePath(`/${locale}/transactions/new`);
  revalidatePath(`/${locale}/reports`);
}

export async function createCategory(
  _previousState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const fields = validateCategoryFields(formData);

  if (hasError(fields)) {
    return fields;
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${fields.locale}/auth/login`);
  }

  const {error} = await supabase.from("categories").insert({
    user_id: user.id,
    name: fields.name,
    type: fields.type,
    color: fields.color,
    icon: fields.icon,
  });

  if (error) {
    console.error("Erro detalhado ao criar categoria:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23505") {
      return {
        error:
          "Você já possui uma categoria com esse nome para este tipo.",
      };
    }

    return {
      error: "Não foi possível criar a categoria.",
    };
  }

  revalidateCategoryPaths(fields.locale);

  redirect(`/${fields.locale}/categories`);
}

export async function updateCategory(
  _previousState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const categoryId = getText(formData, "category_id");
  const fields = validateCategoryFields(formData);

  if (!categoryId) {
    return {
      error: "Categoria inválida.",
    };
  }

  if (hasError(fields)) {
    return fields;
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${fields.locale}/auth/login`);
  }

  const {error} = await supabase
    .from("categories")
    .update({
      name: fields.name,
      type: fields.type,
      color: fields.color,
      icon: fields.icon,
    })
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro detalhado ao atualizar categoria:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23505") {
      return {
        error:
          "Você já possui outra categoria com esse nome para este tipo.",
      };
    }

    return {
      error: "Não foi possível atualizar a categoria.",
    };
  }

  revalidateCategoryPaths(fields.locale);

  redirect(`/${fields.locale}/categories`);
}

export async function deleteCategory(
  _previousState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const locale = getText(formData, "locale");
  const categoryId = getText(formData, "category_id");

  if (!locale) {
    return {
      error: "Idioma inválido.",
    };
  }

  if (!categoryId) {
    return {
      error: "Categoria inválida.",
    };
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const {error} = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro detalhado ao excluir categoria:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    if (error.code === "23503") {
      return {
        error:
          "Não foi possível excluir esta categoria porque existem lançamentos vinculados a ela.",
      };
    }

    return {
      error: "Não foi possível excluir a categoria.",
    };
  }

  revalidateCategoryPaths(locale);

  return {};
}