"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { getErrorMessage } from "@/services/api-errors";
import { login as loginWithCredentials, restoreSession } from "@/services/auth-service";

type LoginValues = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginValues, string>>;

const initialValues: LoginValues = {
  email: "",
  password: "",
};

const fieldClass =
  "h-[44px] w-full rounded-[6px] border bg-white px-4 text-[14px] font-medium leading-[21px] text-[#202024] outline-none transition placeholder:text-[#a7a7ad] focus:border-[#164780] focus:ring-4 focus:ring-[#164780]/10";

export function LoginScreen() {
  const router = useRouter();
  const [values, setValues] = useState<LoginValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof LoginValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCheckingExistingSession, setIsCheckingExistingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errors = validateLogin(values);
  const showEmailError = Boolean((touched.email || submitted) && errors.email);
  const showPasswordError = Boolean((touched.password || submitted) && errors.password);

  useEffect(() => {
    let mounted = true;

    async function verifyExistingSession() {
      const user = await restoreSession();

      if (!mounted) {
        return;
      }

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setIsCheckingExistingSession(false);
    }

    void verifyExistingSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormError(null);
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleBlur(event: ChangeEvent<HTMLInputElement>) {
    setTouched((current) => ({
      ...current,
      [event.target.name]: true,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setTouched({ email: true, password: true });
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await loginWithCredentials({
        email: values.email.trim(),
        password: values.password,
      });
      router.replace("/dashboard");
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to sign in. Check your credentials and try again."));
      setIsSubmitting(false);
    }
  }

  if (isCheckingExistingSession) {
    return <LoginSessionCheckingScreen />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f1f1f1] px-4 py-8 text-[#262629]">
      <section className="grid w-full max-w-[940px] overflow-hidden rounded-[8px] border border-[#e5e5e7] bg-white shadow-[0_24px_70px_rgba(0,28,66,0.14)] lg:grid-cols-[0.95fr_1.05fr]">
        <div
          className="flex min-h-[260px] flex-col items-center justify-center px-8 py-10 text-center text-white lg:min-h-[620px]"
          style={{ background: "linear-gradient(270deg, #164780 0%, #001C42 100%)" }}
        >
          <Image alt="AgroTrust" className="h-[42px] w-[210px] object-contain" height={42} priority src="/agrotrust-logo.svg" width={210} />
          <div className="mt-8 h-px w-28 bg-white/30" />
          <p className="mt-5 max-w-[280px] text-[15px] font-medium leading-[24px] text-[#dce9f7]">Administrative access for trade operations.</p>
        </div>

        <div className="flex min-h-[520px] items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-[370px]">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase leading-[16px] tracking-[1.6px] text-[#8b8b91]">AGROTRUST-BACKOFFICE 2026</p>
              <h1 className="mt-3 text-[30px] font-bold leading-[38px] text-[#111114]">Sign in</h1>
              <p className="mt-2 text-[14px] font-medium leading-[22px] text-[#77777d]">Use your account credentials to continue.</p>
            </div>

            <form className="mt-8 grid gap-5" noValidate onSubmit={handleSubmit}>
              {formError ? (
                <div className="rounded-[6px] border border-[#efb7bc] bg-[#fff0f1] px-4 py-3 text-[13px] font-medium leading-[20px] text-[#9c2f37]" role="alert">
                  {formError}
                </div>
              ) : null}

              <div>
                <label className="text-[13px] font-semibold leading-[18px] text-[#303034]" htmlFor="email">
                  Email
                </label>
                <div className="relative mt-2">
                  <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa0]" />
                  <input
                    aria-describedby={showEmailError ? "email-error" : undefined}
                    aria-invalid={showEmailError}
                    autoComplete="email"
                    className={`${fieldClass} pl-10 ${showEmailError ? "border-[#d64b55]" : "border-[#dddddf]"}`}
                    id="email"
                    inputMode="email"
                    name="email"
                    disabled={isSubmitting}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="admin@agrotrust.com"
                    type="email"
                    value={values.email}
                  />
                </div>
                {showEmailError ? (
                  <p className="mt-2 text-[12px] font-medium leading-[18px] text-[#c83f48]" id="email-error">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-[13px] font-semibold leading-[18px] text-[#303034]" htmlFor="password">
                  Password
                </label>
                <div className="relative mt-2">
                  <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9aa0]" />
                  <input
                    aria-describedby={showPasswordError ? "password-error" : undefined}
                    aria-invalid={showPasswordError}
                    autoComplete="current-password"
                    className={`${fieldClass} pl-10 pr-12 ${showPasswordError ? "border-[#d64b55]" : "border-[#dddddf]"}`}
                    id="password"
                    name="password"
                    disabled={isSubmitting}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={values.password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[5px] text-[#6d6d73] transition hover:bg-[#f3f3f5] focus:outline-none focus:ring-2 focus:ring-[#164780]/20"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {showPasswordError ? (
                  <p className="mt-2 text-[12px] font-medium leading-[18px] text-[#c83f48]" id="password-error">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <button
                className="mt-1 flex h-[46px] w-full items-center justify-center gap-2 rounded-[6px] px-4 text-[14px] font-semibold leading-[21px] text-white shadow-[0_12px_28px_rgba(0,28,66,0.22)] transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-[#164780]/25 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                style={{ background: "linear-gradient(270deg, #164780 0%, #001C42 100%)" }}
                type="submit"
              >
                {isSubmitting ? "Checking access" : "Sign in"}
                {isSubmitting ? <SpinnerIcon className="h-4 w-4" /> : <ArrowRightIcon className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginSessionCheckingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f1f1f1] px-4 text-center">
      <div>
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[8px] shadow-[0_18px_48px_rgba(0,28,66,0.18)]"
          style={{ background: "linear-gradient(270deg, #164780 0%, #001C42 100%)" }}
        >
          <Image alt="AgroTrust" className="h-8 w-8 object-contain" height={32} priority src="/agrotrust-logo.svg" width={32} />
        </div>
        <p className="mt-5 text-[14px] font-semibold leading-[21px] text-[#303034]">Checking session</p>
      </div>
    </main>
  );
}

function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {};
  const email = values.email.trim();
  const password = values.password.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4.5 6.5h15v11h-15v-11Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m5 7 7 5 7-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M7 10h10v9H7v-9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M3.5 12s3.2-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3.2 5.5-8.5 5.5S3.5 12 3.5 12Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m4 4 16 16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M9.3 6.9A8.5 8.5 0 0 1 12 6.5c5.3 0 8.5 5.5 8.5 5.5a15.3 15.3 0 0 1-2.4 2.9M14.1 14.3a2.5 2.5 0 0 1-3.5-3.5M6.6 8.4A15.6 15.6 0 0 0 3.5 12s3.2 5.5 8.5 5.5c1.2 0 2.3-.3 3.3-.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`${className ?? ""} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity=".25" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
