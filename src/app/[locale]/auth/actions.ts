"use server";

import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function getLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "pt");
  return locale === "en" ? "en" : "pt";
}

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL não foi configurada.");
  }

  return appUrl;
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const locale = getLocale(formData);
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    redirect(
      `/${locale}/register?error=${encodeURIComponent(
        "Preencha nome, e-mail e uma senha de pelo menos 8 caracteres."
      )}`
    );
  }

  const {error} = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        locale: locale === "en" ? "en" : "pt-BR"
      },
      emailRedirectTo: `${getAppUrl()}/${locale}/auth/callback`
    }
  });

if (error) {
  console.error("Supabase signUp error:", {
    message: error.message,
    status: error.status,
    code: error.code
  });

  redirect(
    `/${locale}/register?error=${encodeURIComponent(error.message)}`
  );
}

  redirect(
    `/${locale}/login?message=${encodeURIComponent(
      "Conta criada. Verifique seu e-mail para confirmar o cadastro."
    )}`
  );
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const locale = getLocale(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const {error} = await supabase.auth.signInWithPassword({email, password});

  if (error) {
    redirect(
      `/${locale}/login?error=${encodeURIComponent(
        "E-mail ou senha inválidos."
      )}`
    );
  }

  redirect(`/${locale}/dashboard`);
}

export async function signOut(locale: "pt" | "en") {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect(`/${locale}/login`);
}