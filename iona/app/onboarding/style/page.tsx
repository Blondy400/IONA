"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";

const STYLE_OPTIONS = [
  "Minimal",
  "Elegant",
  "Casual",
  "Streetwear",
  "Sporty",
  "Romantic",
  "Business",
  "Glam",
  "Old Money",
  "Classic",
];

const COLOR_OPTIONS = [
  "Black",
  "White",
  "Beige",
  "Brown",
  "Grey",
  "Blue",
  "Green",
  "Red",
  "Pink",
  "Purple",
];

export default function StyleOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function toggleItem(
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    if (list.includes(item)) {
      setList(list.filter((value) => value !== item));
    } else {
      setList([...list, item]);
    }
  }

  async function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (selectedStyles.length === 0) {
      setErrorMessage("Please choose at least one style.");
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
          preferred_styles: selectedStyles,
          preferred_colors: preferredColors,
          avoided_colors: avoidedColors,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      router.push("/onboarding/photos");
    } catch (error: any) {
      console.error("Error saving style preferences:", error);

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
            Step 3 of 4
          </p>

          <h1 className="mt-4 font-serif text-[40px] leading-[1.05]">
            Your style
          </h1>

          <p className="mt-3 max-w-[340px] text-[14px] leading-6 text-[#756E67]">
            Tell IONA what feels most like you.
          </p>

          <form onSubmit={handleContinue} className="mt-9">

            {/* STYLES */}
            <div>
              <h2 className="font-serif text-[21px]">
                Styles you love
              </h2>

              <p className="mt-1 text-[12px] text-[#8A827A]">
                Choose as many as you like.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => {
                  const selected = selectedStyles.includes(style);

                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          style,
                          selectedStyles,
                          setSelectedStyles
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-[13px] transition ${
                        selected
                          ? "border-[#1F1F1F] bg-[#1F1F1F] text-white"
                          : "border-[#DDD5CA] bg-[#FCF9F4] text-[#5F5953]"
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLORS YOU LOVE */}
            <div className="mt-9">

              <h2 className="font-serif text-[21px]">
                Colors you love
              </h2>

              <p className="mt-1 text-[12px] text-[#8A827A]">
                Optional
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => {
                  const selected =
                    preferredColors.includes(color);

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          color,
                          preferredColors,
                          setPreferredColors
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-[13px] transition ${
                        selected
                          ? "border-[#C9A96A] bg-[#EADFCC] text-[#1F1F1F]"
                          : "border-[#DDD5CA] bg-[#FCF9F4] text-[#5F5953]"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLORS YOU AVOID */}
            <div className="mt-9">

              <h2 className="font-serif text-[21px]">
                Colors you avoid
              </h2>

              <p className="mt-1 text-[12px] text-[#8A827A]">
                Optional
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => {
                  const selected =
                    avoidedColors.includes(color);

                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          color,
                          avoidedColors,
                          setAvoidedColors
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-[13px] transition ${
                        selected
                          ? "border-[#8E6B6B] bg-[#F1E4E1] text-[#704D4D]"
                          : "border-[#DDD5CA] bg-[#FCF9F4] text-[#5F5953]"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ERROR */}
            {errorMessage && (
              <p className="mt-6 text-[13px] leading-5 text-[#A34D4D]">
                {errorMessage}
              </p>
            )}

            {/* BUTTONS */}
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

              <button
                type="button"
                onClick={() => router.push("/onboarding/photos")}
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