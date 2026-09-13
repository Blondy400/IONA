"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

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
  const [selectedOccasion, setSelectedOccasion] = useState("Casual");
  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [message, setMessage] = useState("");
  const [missingCategories, setMissingCategories] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadWardrobe() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("wardrobe_items")
        .select(
          "id, image_url, category, type, color, brand, pattern, material, style, season"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load wardrobe:", error);
        setLoading(false);
        return;
      }

      setWardrobe(data ?? []);
      setLoading(false);
    }

    loadWardrobe();
  }, [router]);

  const wardrobeById = useMemo(() => {
    return new Map(wardrobe.map((item) => [item.id, item]));
  }, [wardrobe]);

  async function generateOutfits() {
    if (wardrobe.length === 0 || generating) return;

    setGenerating(true);
    setOutfits([]);
    setMessage("");
    setMissingCategories([]);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-outfits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          occasion: selectedOccasion,
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
      });

      const data = (await response.json()) as GenerateResponse;

      if (!response.ok) {
        throw new Error(data.error || "Could not generate outfits.");
      }

      setOutfits(data.outfits ?? []);
      setMessage(data.message ?? "");
      setMissingCategories(data.missingCategories ?? []);
    } catch (error) {
      console.error("Generate outfits error:", error);

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
      <main className="flex min-h-screen items-center justify-center bg-[#090b10] text-white">
        <div className="text-center">
          <p className="text-xs tracking-[0.28em] text-[#d8bd68]">
            IONA
          </p>

          <p className="mt-3 text-xs tracking-[0.16em] text-zinc-500">
            PREPARING YOUR WARDROBE...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b10] px-5 pb-28 pt-8 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs tracking-[0.28em] text-[#d8bd68]">
          IONA AI
        </p>

        <h1 className="mt-3 text-4xl font-light">
          AI Stylist
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          Choose an occasion and IONA will create outfit ideas using pieces
          already in your wardrobe.
        </p>

        <section className="mt-10">
          <p className="mb-4 text-xs tracking-[0.22em] text-[#d8bd68]">
            OCCASION
          </p>

          <div className="flex flex-wrap gap-3">
            {OCCASIONS.map((occasion) => {
              const isActive = selectedOccasion === occasion;

              return (
                <button
                  key={occasion}
                  onClick={() => {
                    setSelectedOccasion(occasion);
                    setOutfits([]);
                    setMessage("");
                    setMissingCategories([]);
                    setErrorMessage("");
                  }}
                  className={`border px-4 py-3 text-xs tracking-[0.14em] transition ${
                    isActive
                      ? "border-[#e2cb69] bg-[#e2cb69] text-black"
                      : "border-zinc-700 bg-transparent text-zinc-300 hover:border-[#d8bd68]"
                  }`}
                >
                  {occasion.toUpperCase()}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.22em] text-[#d8bd68]">
                YOUR WARDROBE
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                {wardrobe.length} pieces available for styling
              </p>
            </div>
          </div>

          {wardrobe.length === 0 ? (
            <div className="mt-6 border border-zinc-800 bg-[#0e1118] p-8 text-center">
              <p className="text-sm text-zinc-400">
                Your wardrobe is empty.
              </p>

              <button
                onClick={() => router.push("/wardrobe")}
                className="mt-5 bg-[#e2cb69] px-5 py-3 text-xs font-semibold tracking-[0.16em] text-black"
              >
                ADD PIECES
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {wardrobe.map((item) => (
                <div
                  key={item.id}
                  className="border border-zinc-800 bg-[#0e1118] p-3"
                >
                  <div className="aspect-square overflow-hidden bg-[#090b10]">
                    <img
                      src={item.image_url}
                      alt={item.type || "Wardrobe item"}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#d8bd68]">
                    {item.type}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {item.color}
                    {item.brand ? ` · ${item.brand}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 border border-zinc-800 bg-[#0e1118] p-6">
          <p className="text-xs tracking-[0.22em] text-[#d8bd68]">
            STYLE REQUEST
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            IONA will use your wardrobe to create outfit ideas for:
          </p>

          <p className="mt-2 text-xl font-light text-white">
            {selectedOccasion}
          </p>

          <button
            onClick={generateOutfits}
            disabled={wardrobe.length === 0 || generating}
            className="mt-6 w-full bg-[#e2cb69] px-5 py-4 text-sm font-semibold tracking-[0.18em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "IONA IS STYLING..." : "GENERATE OUTFITS"}
          </button>
        </section>

        {errorMessage && (
          <section className="mt-8 border border-red-900/60 bg-red-950/20 p-6">
            <p className="text-xs tracking-[0.18em] text-red-300">
              SOMETHING WENT WRONG
            </p>

            <p className="mt-3 text-sm leading-6 text-red-200">
              {errorMessage}
            </p>
          </section>
        )}

        {!errorMessage && message && (
          <section className="mt-8 border border-zinc-800 bg-[#0e1118] p-6">
            <p className="text-xs tracking-[0.22em] text-[#d8bd68]">
              IONA SAYS
            </p>

            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {message}
            </p>

            {missingCategories.length > 0 && (
              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  Missing pieces
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {missingCategories.map((category) => (
                    <span
                      key={category}
                      className="border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {outfits.length > 0 && (
          <section className="mt-10">
            <p className="mb-5 text-xs tracking-[0.22em] text-[#d8bd68]">
              YOUR IONA LOOKS
            </p>

            <div className="space-y-6">
              {outfits.map((outfit, index) => {
                const outfitItems = outfit.itemIds
                  .map((id) => wardrobeById.get(id))
                  .filter(
                    (item): item is WardrobeItem =>
                      Boolean(item)
                  );

                return (
                  <article
                    key={`${outfit.name}-${index}`}
                    className="border border-zinc-800 bg-[#0e1118] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                          Look {index + 1}
                        </p>

                        <h2 className="mt-2 text-2xl font-light text-white">
                          {outfit.name}
                        </h2>
                      </div>

                      <span className="text-xs tracking-[0.16em] text-[#d8bd68]">
                        {selectedOccasion.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {outfitItems.map((item) => (
                        <div
                          key={item.id}
                          className="border border-zinc-800 bg-[#090b10] p-3"
                        >
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={item.image_url}
                              alt={item.type || "Wardrobe item"}
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[#d8bd68]">
                            {item.type}
                          </p>

                          <p className="mt-1 text-[11px] text-zinc-500">
                            {item.color}
                            {item.brand ? ` · ${item.brand}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 border-t border-zinc-800 pt-5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                        Why it works
                      </p>

                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {outfit.explanation}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#090b10]">
        <div className="mx-auto grid max-w-3xl grid-cols-4 px-4 py-4 text-center text-xs tracking-[0.08em]">
          <a href="/home" className="text-zinc-400">
            HOME
          </a>

          <a href="/wardrobe" className="text-zinc-400">
            WARDROBE
          </a>

          <a href="/ai-stylist" className="text-[#d8bd68]">
            AI STYLIST
          </a>

          <a href="/profile" className="text-zinc-400">
            PROFILE
          </a>
        </div>
      </nav>
    </main>
  );
}