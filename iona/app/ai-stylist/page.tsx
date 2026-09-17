"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import IonaLogo from "../../components/IonaLogo";

type WardrobeItem = {
  id: number;
  image_url: string;
  category: string;
  type: string;
  color: string;
  brand: string;
  pattern?: string | null;
  material?: string | null;
  style?: string | null;
  season?: string | null;
};

type Profile = {
  first_name: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  bust_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  inseam_cm: number | null;
  preferred_styles: string[] | null;
  preferred_colors: string[] | null;
  avoided_colors: string[] | null;
};

type Outfit = {
  name: string;
  itemIds: number[];
  explanation: string;
};

type GenerateResponse = {
  status?: "success" | "insufficient";
  message?: string;
  outfits?: Outfit[];
  missingCategories?: string[];
  error?: string;
};

const OCCASIONS = [
  "Casual",
  "Work",
  "Dinner",
  "Date Night",
  "Party",
  "Travel",
  "Gym",
];

export default function AIStylistPage() {
  const router = useRouter();

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [selectedOccasion, setSelectedOccasion] = useState("Casual");
  const [styleRequest, setStyleRequest] = useState("");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [message, setMessage] = useState("");

  const [missingCategories, setMissingCategories] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const [wardrobeResult, profileResult] = await Promise.all([
          supabase
            .from("wardrobe_items")
            .select(
              "id, image_url, category, type, color, brand, pattern, material, style, season"
            )
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("profiles")
            .select(
              "first_name, gender, height_cm, weight_kg, bust_cm, waist_cm, hips_cm, inseam_cm, preferred_styles, preferred_colors, avoided_colors"
            )
            .eq("id", user.id)
            .single(),
        ]);

        if (wardrobeResult.error) {
          console.error(
            "Could not load wardrobe:",
            wardrobeResult.error
          );
        } else {
          setWardrobe(wardrobeResult.data ?? []);
        }

        if (profileResult.error) {
          console.error(
            "Could not load profile:",
            profileResult.error
          );
        } else {
          setProfile(profileResult.data as Profile);
        }
      } catch (error) {
        console.error(
          "Could not prepare AI Stylist:",
          error
        );

        setErrorMessage(
          "IONA could not prepare your stylist right now."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const wardrobeById = useMemo(() => {
    return new Map(
      wardrobe.map((item) => [item.id, item])
    );
  }, [wardrobe]);

  function clearResults() {
    setOutfits([]);
    setMessage("");
    setMissingCategories([]);
    setErrorMessage("");
  }

  function selectOccasion(occasion: string) {
    setSelectedOccasion(occasion);
    clearResults();
  }

  async function generateOutfits() {
    if (wardrobe.length === 0 || generating) {
      return;
    }

    setGenerating(true);
    clearResults();

    try {
      const response = await fetch(
        "/api/generate-outfits",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            occasion: selectedOccasion,

            request: styleRequest.trim(),

            profile: profile
              ? {
                  gender: profile.gender,

                  height_cm: profile.height_cm,
                  weight_kg: profile.weight_kg,

                  bust_cm: profile.bust_cm,
                  waist_cm: profile.waist_cm,
                  hips_cm: profile.hips_cm,
                  inseam_cm: profile.inseam_cm,

                  preferred_styles:
                    profile.preferred_styles,

                  preferred_colors:
                    profile.preferred_colors,

                  avoided_colors:
                    profile.avoided_colors,
                }
              : null,

            wardrobe: wardrobe.map((item) => ({
              id: item.id,
              category: item.category,
              type: item.type,
              color: item.color,
              brand: item.brand,
              pattern: item.pattern,
              material: item.material,
              style: item.style,
              season: item.season,
            })),
          }),
        }
      );

      /*
        IMPORTANT:
        We read the server response as text first.

        This prevents the page from crashing if the API
        unexpectedly returns an empty response or something
        that is not valid JSON.
      */

      const rawResponse = await response.text();

      console.log("Generate outfits response:", {
        status: response.status,
        statusText: response.statusText,
        body: rawResponse,
      });

      if (!rawResponse) {
        throw new Error(
          `IONA received an empty response from the server (${response.status}).`
        );
      }

      let data: GenerateResponse;

      try {
        data = JSON.parse(
          rawResponse
        ) as GenerateResponse;
      } catch {
        console.error(
          "Generate outfits returned non-JSON:",
          rawResponse
        );

        throw new Error(
          `IONA received an invalid server response (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Could not generate outfits (${response.status}).`
        );
      }

      setOutfits(data.outfits ?? []);
      setMessage(data.message ?? "");

      setMissingCategories(
        data.missingCategories ?? []
      );
    } catch (error) {
      console.error(
        "Generate outfits error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "IONA could not generate outfits right now."
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#F8F4EE] text-[#1F1F1F]">
        <div className="text-center">
          <IonaLogo />

          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#91887E]">
            Preparing your stylist
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#F8F4EE] text-[#1F1F1F]">
      <div className="mx-auto w-full max-w-[430px] px-5 pb-[calc(115px+env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">

        {/* HEADER */}

        <header className="flex items-center justify-between">
          <IonaLogo />

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DED6CB] bg-[#FCF9F4]">
            <span className="text-[15px] text-[#A98D61]">
              ✦
            </span>
          </div>
        </header>

        {/* HERO */}

        <section className="mt-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#A98D61]">
            IONA AI STYLIST
          </p>

          <h1 className="mt-3 font-serif text-[38px] leading-[1.08]">
            What are we
            <br />
            dressing for?
          </h1>

          <p className="mt-4 max-w-[330px] text-[13px] leading-6 text-[#817970]">
            Tell IONA where you're going and how you
            want to feel. We'll style you using pieces
            already in your wardrobe.
          </p>
        </section>

        {/* REQUEST */}

        <section className="mt-8">
          <div className="rounded-[26px] border border-[#DED6CB] bg-[#FCF9F4] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-[2px] text-[15px] text-[#A98D61]">
                ✦
              </span>

              <textarea
                value={styleRequest}
                onChange={(event) => {
                  setStyleRequest(
                    event.target.value
                  );

                  if (
                    outfits.length > 0 ||
                    message ||
                    errorMessage
                  ) {
                    clearResults();
                  }
                }}
                placeholder="Dinner in Rome. I want something elegant, feminine and a little sexy..."
                rows={4}
                className="min-h-[105px] w-full resize-none bg-transparent text-[14px] leading-6 outline-none placeholder:text-[#AAA199]"
              />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#E7E0D7] pt-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#AAA199]">
                Tell IONA anything
              </p>

              {styleRequest && (
                <button
                  type="button"
                  onClick={() => {
                    setStyleRequest("");
                    clearResults();
                  }}
                  className="text-[11px] text-[#817970]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* OCCASION */}

        <section className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.17em] text-[#91887E]">
            Or choose an occasion
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {OCCASIONS.map((occasion) => {
              const active =
                selectedOccasion === occasion;

              return (
                <button
                  key={occasion}
                  type="button"
                  onClick={() =>
                    selectOccasion(occasion)
                  }
                  className={`rounded-full border px-4 py-2.5 text-[12px] transition ${
                    active
                      ? "border-[#1F1F1F] bg-[#1F1F1F] text-white"
                      : "border-[#D8CEC0] bg-[#FCF9F4] text-[#625B54]"
                  }`}
                >
                  {occasion}
                </button>
              );
            })}
          </div>
        </section>

        {/* WARDROBE STATUS */}

        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-serif text-[23px]">
                Your wardrobe
              </p>

              <p className="mt-1 text-[12px] text-[#91887E]">
                {wardrobe.length}{" "}
                {wardrobe.length === 1
                  ? "piece"
                  : "pieces"}{" "}
                ready for styling
              </p>
            </div>

            <Link
              href="/wardrobe"
              className="text-[11px] text-[#817970]"
            >
              View all
            </Link>
          </div>

          {wardrobe.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-[#DED6CB] bg-[#FCF9F4] px-6 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#ECE4D9] text-[#A98D61]">
                ✦
              </div>

              <h2 className="mt-4 font-serif text-[21px]">
                Your wardrobe is empty
              </h2>

              <p className="mx-auto mt-2 max-w-[260px] text-[12px] leading-5 text-[#817970]">
                Add a few pieces so IONA can start
                creating looks for you.
              </p>

              <Link
                href="/wardrobe"
                className="mt-5 inline-flex rounded-full bg-[#1F1F1F] px-6 py-3 text-[12px] text-white"
              >
                Add pieces
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {wardrobe
                .slice(0, 6)
                .map((item) => (
                  <div
                    key={item.id}
                    className="w-[104px] shrink-0"
                  >
                    <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[18px] border border-[#DED6CB] bg-[#FCF9F4] p-2">
                      <img
                        src={item.image_url}
                        alt={
                          item.type ||
                          "Wardrobe item"
                        }
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <p className="mt-2 truncate text-[11px] text-[#625B54]">
                      {item.type}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* STYLE BUTTON */}

        {wardrobe.length > 0 && (
          <section className="mt-8">
            <button
              type="button"
              onClick={generateOutfits}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1F1F1F] px-6 py-4 text-[14px] font-medium text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? (
                <>
                  <span className="animate-pulse text-[#D4C1A6]">
                    ✦
                  </span>

                  IONA is styling...
                </>
              ) : (
                <>
                  Style me

                  <span className="text-[#D4C1A6]">
                    ✦
                  </span>
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[10px] leading-4 text-[#AAA199]">
              IONA will only use pieces from your
              wardrobe for these looks.
            </p>
          </section>
        )}

        {/* ERROR */}

        {errorMessage && (
          <section className="mt-7 rounded-[22px] border border-[#E3C7C2] bg-[#F4E7E4] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#A85E55]">
              Something went wrong
            </p>

            <p className="mt-2 text-[12px] leading-5 text-[#85534D]">
              {errorMessage}
            </p>
          </section>
        )}

        {/* IONA MESSAGE */}

        {!errorMessage && message && (
          <section className="mt-7 rounded-[24px] bg-[#ECE4D9] p-5">
            <div className="flex gap-3">
              <span className="text-[#A98D61]">
                ✦
              </span>

              <div>
                <p className="font-serif text-[18px]">
                  IONA says
                </p>

                <p className="mt-2 text-[12px] leading-5 text-[#756E67]">
                  {message}
                </p>

                {missingCategories.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#91887E]">
                      Missing pieces
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {missingCategories.map(
                        (category) => (
                          <span
                            key={category}
                            className="rounded-full border border-[#D3C7B7] bg-[#F8F4EE] px-3 py-1.5 text-[10px]"
                          >
                            {category}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* RESULTS */}

        {outfits.length > 0 && (
          <section className="mt-10">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#A98D61]">
                Styled for you
              </p>

              <h2 className="mt-2 font-serif text-[30px]">
                Your IONA looks
              </h2>

              <p className="mt-2 text-[12px] text-[#91887E]">
                {outfits.length} personalized{" "}
                {outfits.length === 1
                  ? "look"
                  : "looks"}{" "}
                from your wardrobe.
              </p>
            </div>

            <div className="mt-6 space-y-7">
              {outfits.map(
                (outfit, index) => {
                  const outfitItems =
                    outfit.itemIds
                      .map((id) =>
                        wardrobeById.get(id)
                      )
                      .filter(
                        (
                          item
                        ): item is WardrobeItem =>
                          Boolean(item)
                      );

                  return (
                    <article
                      key={`${outfit.name}-${index}`}
                      className="overflow-hidden rounded-[28px] border border-[#DED6CB] bg-[#FCF9F4]"
                    >
                      {/* LOOK HEADER */}

                      <div className="px-5 pb-4 pt-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.17em] text-[#A98D61]">
                              Look {index + 1}
                            </p>

                            <h3 className="mt-2 font-serif text-[25px] leading-tight">
                              {outfit.name}
                            </h3>
                          </div>

                          <span className="rounded-full bg-[#ECE4D9] px-3 py-1.5 text-[9px] uppercase tracking-[0.12em] text-[#756E67]">
                            {selectedOccasion}
                          </span>
                        </div>
                      </div>

                      {/* ITEMS */}

                      <div className="grid grid-cols-2 gap-px bg-[#E7E0D7]">
                        {outfitItems.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="bg-[#F8F4EE] p-3"
                            >
                              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[15px] bg-[#FCF9F4] p-2">
                                <img
                                  src={
                                    item.image_url
                                  }
                                  alt={
                                    item.type ||
                                    "Wardrobe item"
                                  }
                                  className="h-full w-full object-contain"
                                />
                              </div>

                              <p className="mt-3 truncate text-[11px] font-medium">
                                {item.type}
                              </p>

                              <p className="mt-1 truncate text-[10px] text-[#91887E]">
                                {item.color}

                                {item.brand
                                  ? ` · ${item.brand}`
                                  : ""}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      {/* EXPLANATION */}

                      <div className="p-5">
                        <div className="flex gap-3">
                          <span className="mt-[1px] text-[12px] text-[#A98D61]">
                            ✦
                          </span>

                          <div>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[#91887E]">
                              Why it works
                            </p>

                            <p className="mt-2 text-[12px] leading-5 text-[#625B54]">
                              {outfit.explanation}
                            </p>
                          </div>
                        </div>

                        {/* ACTIONS */}

                        <button
                          type="button"
                          className="mt-5 w-full rounded-full bg-[#1F1F1F] px-5 py-3.5 text-[12px] font-medium text-white"
                        >
                          Wear this look
                        </button>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={
                              generateOutfits
                            }
                            disabled={generating}
                            className="rounded-full border border-[#D8CEC0] px-3 py-3 text-[11px] text-[#625B54] disabled:opacity-50"
                          >
                            Another look
                          </button>

                          <button
                            type="button"
                            disabled
                            className="rounded-full border border-[#D8CEC0] px-3 py-3 text-[11px] text-[#AAA199]"
                          >
                            Try it on ✦
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}

      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[#E1D9CF] bg-[#F8F4EE]/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="grid grid-cols-5 items-end">
          <NavItem
            href="/home"
            label="Home"
            icon={<HomeIcon />}
          />

          <NavItem
            href="/wardrobe"
            label="Wardrobe"
            icon={<WardrobeIcon />}
          />

          <Link
            href="/ai-stylist"
            className="flex flex-col items-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F1F1F] text-[18px] text-[#D8C3A5] shadow-sm">
              ✦
            </div>

            <span className="mt-1 text-[10px] font-medium text-[#1F1F1F]">
              Stylist
            </span>
          </Link>

          <NavItem
            href="/calendar"
            label="Calendar"
            icon={<CalendarIcon />}
          />

          <NavItem
            href="/profile"
            label="Profile"
            icon={<ProfileIcon />}
          />
        </div>
      </nav>
    </main>
  );
}

/* -------------------------------- */
/* COMPONENTS                       */
/* -------------------------------- */

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 text-[#91887E]"
    >
      {icon}

      <span className="text-[10px]">
        {label}
      </span>
    </Link>
  );
}

/* -------------------------------- */
/* ICONS                            */
/* -------------------------------- */

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 10.5L12 4L20 10.5V20H14.5V14H9.5V20H4V10.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WardrobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M8 6C8 3.8 9.3 2.5 12 2.5C14.2 2.5 15.5 3.6 15.5 5.2C15.5 6.4 14.8 7.2 13.5 7.8L20 12.5L17.5 15.5L12 11.5L6.5 15.5L4 12.5L10.5 7.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path
        d="M8 3V7M16 3V7M4 10H20"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path
        d="M5.5 20C6.3 16.5 8.5 14.5 12 14.5C15.5 14.5 17.7 16.5 18.5 20"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}