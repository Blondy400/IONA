"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";

export default function BodyOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!height) {
      setErrorMessage("Please enter your height.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "We could not find your account. Please sign in again."
        );
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          height_cm: Number(height),
          weight_kg: weight ? Number(weight) : null,
          bust_cm: bust ? Number(bust) : null,
          waist_cm: waist ? Number(waist) : null,
          hips_cm: hips ? Number(hips) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      router.push("/onboarding/style");
    } catch (error: any) {
      console.error("Error saving body details:", error);

      setErrorMessage(
        error?.message ||
          error?.details ||
          error?.hint ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#F8F4EE] text-[#1F1F1F]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-6 pb-8 pt-[max(24px,env(safe-area-inset-top))]">

        {/* LOGO */}
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

        {/* CONTENT */}
        <div className="mt-12">

          <p className="text-[12px] uppercase tracking-[0.22em] text-[#91887E]">
            Step 2 of 4
          </p>

          <h1 className="mt-4 font-serif text-[40px] leading-[1.05]">
            Your body
          </h1>

          <p className="mt-3 max-w-[340px] text-[14px] leading-6 text-[#756E67]">
            Help IONA understand your proportions for more personalized
            styling.
          </p>

          <form
            onSubmit={handleContinue}
            className="mt-9"
          >

            {/* HEIGHT + WEIGHT */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="mb-2 block text-[13px] text-[#5F5953]">
                  Height
                </label>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="165"
                    className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 pr-12 text-[15px] outline-none placeholder:text-[#AAA198] focus:border-[#B9AD9F]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#91887E]">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] text-[#5F5953]">
                  Weight
                  <span className="ml-1 text-[#AAA198]">
                    optional
                  </span>
                </label>

                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="60"
                    className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 pr-12 text-[15px] outline-none placeholder:text-[#AAA198] focus:border-[#B9AD9F]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#91887E]">
                    kg
                  </span>
                </div>
              </div>

            </div>

            {/* MEASUREMENTS */}
            <div className="mt-8">

              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[21px]">
                  Measurements
                </h2>

                <span className="text-[11px] text-[#9A9188]">
                  Optional
                </span>
              </div>

              <p className="mt-1 text-[12px] leading-5 text-[#8A827A]">
                Add these for more precise fit and proportion recommendations.
              </p>

              <div className="mt-5 space-y-3">

                {/* BUST */}
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={bust}
                    onChange={(e) => setBust(e.target.value)}
                    placeholder="Bust / Chest"
                    className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 pr-12 text-[15px] outline-none placeholder:text-[#AAA198] focus:border-[#B9AD9F]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#91887E]">
                    cm
                  </span>
                </div>

                {/* WAIST */}
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="Waist"
                    className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 pr-12 text-[15px] outline-none placeholder:text-[#AAA198] focus:border-[#B9AD9F]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#91887E]">
                    cm
                  </span>
                </div>

                {/* HIPS */}
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={hips}
                    onChange={(e) => setHips(e.target.value)}
                    placeholder="Hips"
                    className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 pr-12 text-[15px] outline-none placeholder:text-[#AAA198] focus:border-[#B9AD9F]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[#91887E]">
                    cm
                  </span>
                </div>

              </div>
            </div>

            {/* ERROR */}
            {errorMessage && (
              <p className="mt-5 text-[13px] leading-5 text-[#A34D4D]">
                {errorMessage}
              </p>
            )}

            {/* BUTTONS */}
            <div className="mt-9">

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-[#1F1F1F] px-6 py-4 text-[15px] font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  "Saving..."
                ) : (
                  <>
                    Continue

                    <span className="ml-3 text-[#D8C3A5]">
                      →
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/onboarding/style")}
                className="mt-3 w-full py-3 text-[13px] text-[#807870]"
              >
                Skip for now
              </button>

            </div>

          </form>
        </div>

      </div>
    </main>
  );
}