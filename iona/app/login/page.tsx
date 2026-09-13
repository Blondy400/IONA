"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user && !data.session) {
          setMessage(
            "Account created. Check your email and confirm your address before signing in."
          );
        } else {
          router.push("/home");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        router.push("/home");
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((currentMode) =>
      currentMode === "login" ? "signup" : "login"
    );

    setMessage("");
    setErrorMessage("");
  }

  return (
    <main className="min-h-[100dvh] bg-[#F7F2EA] px-5 py-8 text-[#1F1F1F]">
      <div className="mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-[430px] flex-col">

        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DED5C9] bg-[#FBF8F3] text-xl"
            aria-label="Back"
          >
            ←
          </button>

          <div className="font-serif text-[28px] tracking-[0.08em]">
            I
            <span className="relative inline-flex">
              O
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[8px]">
                ✦
              </span>
            </span>
            NA
          </div>

          <div className="h-10 w-10" />
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col justify-center pb-10">

          <div className="mb-9">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#9A8F83]">
              Your personal style, intelligently curated
            </p>

            <h1 className="mt-4 font-serif text-[46px] leading-[0.95]">
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p className="mt-4 max-w-[330px] text-[14px] leading-6 text-[#746D66]">
              {mode === "login"
                ? "Sign in to access your wardrobe, outfits and AI stylist."
                : "Create your IONA account and start building a wardrobe that works for you."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#8F867D]">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="
                  w-full
                  rounded-[18px]
                  border
                  border-[#DDD3C7]
                  bg-[#FBF8F3]
                  px-4
                  py-4
                  text-[15px]
                  outline-none
                  transition
                  placeholder:text-[#AAA198]
                  focus:border-[#BFAF9A]
                "
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-[#8F867D]">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                autoComplete={
                  mode === "login"
                    ? "current-password"
                    : "new-password"
                }
                placeholder="••••••••"
                className="
                  w-full
                  rounded-[18px]
                  border
                  border-[#DDD3C7]
                  bg-[#FBF8F3]
                  px-4
                  py-4
                  text-[15px]
                  outline-none
                  transition
                  placeholder:text-[#AAA198]
                  focus:border-[#BFAF9A]
                "
              />
            </div>

            {/* MESSAGE */}
            {message && (
              <div className="rounded-[18px] border border-[#D9CBB8] bg-[#EFE5D8] px-4 py-4">
                <p className="text-[13px] leading-6 text-[#6B6259]">
                  {message}
                </p>
              </div>
            )}

            {/* ERROR */}
            {errorMessage && (
              <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-4">
                <p className="text-[13px] leading-6 text-red-700">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="
                mt-2
                flex
                w-full
                items-center
                justify-center
                rounded-full
                bg-[#1F1F1F]
                px-6
                py-[17px]
                text-[15px]
                font-medium
                tracking-wide
                text-white
                transition
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}

              {!loading && (
                <span className="ml-3 text-[#D4C1A6]">
                  →
                </span>
              )}
            </button>
          </form>

          {/* SWITCH MODE */}
          <div className="mt-8 text-center">
            <p className="text-[14px] text-[#7E766E]">
              {mode === "login"
                ? "New to IONA?"
                : "Already have an account?"}
            </p>

            <button
              type="button"
              onClick={switchMode}
              className="mt-2 text-[14px] font-medium text-[#1F1F1F] underline decoration-[#BBAA94] underline-offset-4"
            >
              {mode === "login"
                ? "Create account"
                : "Sign in"}
            </button>
          </div>

        </div>

        {/* FOOTER */}
        <p className="pb-2 text-center text-[9px] uppercase tracking-[0.32em] text-[#AAA198]">
          Style · Intelligence · You
        </p>
      </div>
    </main>
  );
}