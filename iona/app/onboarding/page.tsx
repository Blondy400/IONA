"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!firstName.trim()) {
      setErrorMessage("Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage("Please enter your last name.");
      return;
    }

    if (!dateOfBirth) {
      setErrorMessage("Please select your date of birth.");
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
        .upsert(
          {
            id: user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            date_of_birth: dateOfBirth,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        throw profileError;
      }

      router.push("/onboarding/body");
    } catch (error: any) {
      console.error("Error saving profile:", error);

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
            Step 1 of 4
          </p>

          <h1 className="mt-4 font-serif text-[40px] leading-[1.05]">
            Tell us about you
          </h1>

          <p className="mt-3 max-w-[320px] text-[14px] leading-6 text-[#756E67]">
            A few details will help IONA personalize your experience.
          </p>

          <form
            onSubmit={handleContinue}
            className="mt-10"
          >

            {/* FIRST NAME */}
            <div>
              <label className="mb-2 block text-[13px] text-[#5F5953]">
                First name
              </label>

              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                autoComplete="given-name"
                className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 text-[15px] outline-none placeholder:text-[#AAA198] focus:border-[#B9AD9F]"
              />
            </div>

            {/* LAST NAME */}
            <div className="mt-5">
              <label className="mb-2 block text-[13px] text-[#5F5953]">
                Last name
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                autoComplete="family-name"
                className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 text-[15px] outline-none placeholder:text-[#AAA198] focus:border-[#B9AD9F]"
              />
            </div>

            {/* DATE OF BIRTH */}
            <div className="mt-5">
              <label className="mb-2 block text-[13px] text-[#5F5953]">
                Date of birth
              </label>

              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                autoComplete="bday"
                className="w-full rounded-[18px] border border-[#DDD5CA] bg-[#FCF9F4] px-4 py-4 text-[15px] outline-none focus:border-[#B9AD9F]"
              />
            </div>

            {/* ERROR */}
            {errorMessage && (
              <p className="mt-5 text-[13px] leading-5 text-[#A34D4D]">
                {errorMessage}
              </p>
            )}

            {/* BUTTON */}
            <div className="mt-10">
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
            </div>

          </form>
        </div>

        <div className="flex-1" />

      </div>
    </main>
  );
}