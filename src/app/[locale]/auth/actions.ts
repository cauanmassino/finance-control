"use server";

import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getLocale(formData: FormData) {
  return getText(formData, "locale") === "en" ? "en" : "pt";
}

function loginUrl(locale: string, message?: string) {
  const url = new URL(`/${locale}/auth/login`, "http://localhost");

  if (message) {
    url.searchParams.set("message", message);
  }

  return `${url.pathname}${url.search}`;
}

function registerUrl(locale: string, message: string) {
  const url = new URL(`/${locale}/register`, "http://localhost");

  url.searchParams.set("error", message);

  return `${url.pathname}${url.search}`;
}

export async function signUp(formData: FormData) {
  const locale = getLocale(formData);
  const fullName = getText(formData, "full_name");
  const email = getText(formData, "email").toLowerCase();
  const password = getText(formData, "password");
  const confirmPassword = getText(formData, "confirm_password");

  const isEnglish = locale === "en";

  if (!fullName) {
    redirect(
      registerUrl(
        locale,
        isEnglish
          ? "Please enter your full name."
          : "Informe seu nome completo.",
      ),
    );
  }

  if (!email || !email.includes("@")) {
    redirect(
      registerUrl(
        locale,
        isEnglish
          ? "Enter a valid email address."
          : "Informe um e-mail válido.",
      ),
    );
  }

  if (password.length < 8) {
    redirect(
      registerUrl(
        locale,
        isEnglish
          ? "Your password must contain at least 8 characters."
          : "A senha precisa ter pelo menos 8 caracteres.",
      ),
    );
  }

  if (password !== confirmPassword) {
    redirect(
      registerUrl(
        locale,
        isEnglish
          ? "The passwords do not match."
          : "As senhas não coincidem.",
      ),
    );
  }

  const supabase = await createClient();

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const {data, error} = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${origin}/${locale}/auth/callback`,
    },
  });

  if (error) {
    const message =
      error.message === "User already registered"
        ? isEnglish
          ? "An account with this email already exists. Sign in instead."
          : "Já existe uma conta com este e-mail. Entre na sua conta."
        : error.message;

    redirect(registerUrl(locale, message));
  }

  if (data.session) {
    redirect(`/${locale}/dashboard`);
  }

  redirect(
    loginUrl(
      locale,
      isEnglish
        ? "Account created. Check your email to confirm your registration."
        : "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
    ),
  );
}