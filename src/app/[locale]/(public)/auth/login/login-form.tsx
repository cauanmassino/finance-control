"use client"

import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type LoginFormProps = {
  locale: string
}

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    {hidden ? (
      <>
        <path d="m3 3 18 18" strokeLinecap="round" />
        <path
          d="M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.7 10.7 0 0 1 12 4c5.2 0 9.3 4.3 10 8-0.3 1.5-1.4 3.5-3.2 5.1M6.6 6.6C4.3 8.1 2.6 10.5 2 12c.7 3.7 4.8 8 10 8 1.6 0 3.1-.4 4.4-1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <>
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" />
      </>
    )}
  </svg>
)

const ArrowRightIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.2"
  >
    <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const EmailIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect height="16" rx="2" width="20" x="2" y="4" />
    <path d="m3 6 9 7 9-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LockIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect height="11" rx="2" width="16" x="4" y="10" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ShieldIcon = () => (
  <svg
    aria-hidden="true"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function LoginForm({ locale }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEnglish = locale === "en"

  const copy = {
    securityTitle: isEnglish ? "Protected access" : "Acesso protegido",
    securityDescription: isEnglish
      ? "Your information stays within your personal space."
      : "Suas informações ficam dentro do seu espaço pessoal.",
    email: isEnglish ? "Email address" : "E-mail",
    emailPlaceholder: isEnglish ? "you@email.com" : "voce@email.com",
    password: isEnglish ? "Password" : "Senha",
    passwordPlaceholder: isEnglish ? "Enter your password" : "Digite sua senha",
    submit: isEnglish ? "Access my account" : "Acessar minha conta",
    loading: isEnglish ? "Accessing your account..." : "Acessando sua conta...",
    noAccount: isEnglish ? "Don't have an account yet?" : "Ainda não possui uma conta?",
    createAccount: isEnglish ? "Create it for free" : "Criar conta grátis",
    show: isEnglish ? "Show password" : "Mostrar senha",
    hide: isEnglish ? "Hide password" : "Ocultar senha",
    divider: isEnglish ? "Finance Control" : "Finance Control",
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setIsLoading(false)
      return
    }

    window.location.href = `/${locale}/dashboard`
  }

  return (
    <form
      className="relative overflow-hidden rounded-[2rem] border border-white/[0.11] bg-gradient-to-br from-[#111c30]/95 via-[#0d1728]/95 to-[#0a1220]/95 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8"
      onSubmit={handleSubmit}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-300/[0.09] blur-3xl"
      />

      <div className="relative">
        <div className="mb-7 flex items-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300">
            <ShieldIcon />
          </span>

          <div>
            <p className="text-xs font-bold text-emerald-200">{copy.securityTitle}</p>
            <p className="mt-0.5 text-[11px] text-emerald-100/55">{copy.securityDescription}</p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2.5 block text-[13px] font-bold tracking-[-0.01em] text-slate-200">
              {copy.email}
            </span>

            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-500">
                <EmailIcon />
              </span>

              <input
                autoComplete="email"
                className="h-[54px] w-full rounded-2xl border border-white/[0.12] bg-[#070d18]/80 pl-12 pr-4 text-[14px] font-medium text-white outline-none transition placeholder:text-slate-600 hover:border-white/[0.2] focus:border-emerald-300/70 focus:bg-[#091321] focus:ring-4 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={copy.emailPlaceholder}
                required
                type="email"
                value={email}
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2.5 block text-[13px] font-bold tracking-[-0.01em] text-slate-200">
              {copy.password}
            </span>

            <span className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center text-slate-500">
                <LockIcon />
              </span>

              <input
                autoComplete="current-password"
                className="h-[54px] w-full rounded-2xl border border-white/[0.12] bg-[#070d18]/80 px-12 text-[14px] font-medium text-white outline-none transition placeholder:text-slate-600 hover:border-white/[0.2] focus:border-emerald-300/70 focus:bg-[#091321] focus:ring-4 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />

              <button
                aria-label={showPassword ? copy.hide : copy.show}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-emerald-300 focus-visible:outline-none focus-visible:text-emerald-300"
                disabled={isLoading}
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </span>
          </label>
        </div>

        {error ? (
          <div
            aria-live="polite"
            className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm leading-6 text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <button
          className="group mt-7 inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-emerald-400 text-[14px] font-extrabold text-emerald-950 shadow-[0_14px_32px_rgba(16,185,129,0.22)] transition hover:-translate-y-0.5 hover:from-emerald-200 hover:to-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1728] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          disabled={isLoading}
          type="submit"
        >
          <span>{isLoading ? copy.loading : copy.submit}</span>
          {!isLoading ? <ArrowRightIcon /> : null}
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            {copy.divider}
          </span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <p className="text-center text-[13px] text-slate-500">
          {copy.noAccount}{" "}
          <Link
            className="font-extrabold text-emerald-300 transition hover:text-emerald-200 hover:underline focus-visible:outline-none focus-visible:underline"
            href={`/${locale}/register`}
          >
            {copy.createAccount}
          </Link>
        </p>
      </div>
    </form>
  )
}