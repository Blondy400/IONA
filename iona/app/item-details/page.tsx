"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type WardrobeItem = {
  id: number;
  image: string;
  category: string;
  type: string;
  color: string;
  brand: string;
  pattern?: string;
  material?: string;
  style?: string;
  season?: string;
  addedAt?: string;
  lastWorn?: string | null;
  timesWorn?: number;
};

export default function ItemDetailsPage() {
  const router = useRouter();

  const [item, setItem] = useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadItem() {
      const selectedId = localStorage.getItem("iona-selected-item-id");

      if (!selectedId) {
        router.push("/wardrobe");
        return;
      }

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
        .select("*")
        .eq("id", Number(selectedId))
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Could not load wardrobe item:", error);
        router.push("/wardrobe");
        return;
      }

      const wardrobeItem: WardrobeItem = {
        id: data.id,
        image: data.image_url,
        category: data.category ?? "",
        type: data.type ?? "",
        color: data.color ?? "",
        brand: data.brand ?? "",
        pattern: data.pattern ?? "",
        material: data.material ?? "",
        style: data.style ?? "",
        season: data.season ?? "",
        addedAt: data.created_at,
        lastWorn: data.last_worn,
        timesWorn: data.times_worn ?? 0,
      };

      setItem(wardrobeItem);
      setLoading(false);
    }

    loadItem();
  }, [router]);

  function formatDate(date?: string | null) {
    if (!date) return "Never";

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  async function markAsWornToday() {
    if (!item || updating) return;

    setUpdating(true);

    const supabase = createClient();

    const newTimesWorn = (item.timesWorn ?? 0) + 1;
    const newLastWorn = new Date().toISOString();

    const { error } = await supabase
      .from("wardrobe_items")
      .update({
        last_worn: newLastWorn,
        times_worn: newTimesWorn,
      })
      .eq("id", item.id);

    if (error) {
      console.error("Could not update wear history:", error);
      setUpdating(false);
      return;
    }

    setItem({
      ...item,
      lastWorn: newLastWorn,
      timesWorn: newTimesWorn,
    });

    setUpdating(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b10] text-white">
        <div className="text-center">
          <p className="text-xs tracking-[0.28em] text-[#d8bd68]">
            IONA
          </p>

          <p className="mt-3 text-xs tracking-[0.16em] text-zinc-500">
            LOADING ITEM...
          </p>
        </div>
      </main>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#090b10] px-6 pb-24 pt-8 text-white">
      <div className="mx-auto max-w-xl">

        <button
          onClick={() => router.push("/wardrobe")}
          className="mb-8 text-xs tracking-[0.16em] text-zinc-400 transition hover:text-[#d8bd68]"
        >
          ← BACK TO WARDROBE
        </button>

        <p className="text-xs tracking-[0.28em] text-[#d8bd68]">
          IONA WARDROBE
        </p>

        <h1 className="mt-3 text-4xl font-light">
          {item.type || item.category}
        </h1>

        <p className="mt-2 text-sm uppercase tracking-[0.15em] text-zinc-500">
          {item.category}
        </p>

        <div className="mt-8 border border-zinc-800 bg-[#0e1118] p-4">
          <div className="aspect-square overflow-hidden bg-[#090b10]">
            <img
              src={item.image}
              alt={item.type || "Wardrobe item"}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <section className="mt-8">
          <p className="mb-5 text-xs tracking-[0.22em] text-[#d8bd68]">
            ITEM DETAILS
          </p>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 border border-zinc-800 bg-[#0e1118] p-6">
            <Detail label="Type" value={item.type} />

            <Detail label="Category" value={item.category} />

            <Detail label="Color" value={item.color} />

            <Detail label="Brand" value={item.brand} />

            <Detail label="Pattern" value={item.pattern} />

            <Detail label="Material" value={item.material} />

            <Detail label="Style" value={item.style} />

            <Detail label="Season" value={item.season} />
          </div>
        </section>

        <section className="mt-8">
          <p className="mb-5 text-xs tracking-[0.22em] text-[#d8bd68]">
            WEAR HISTORY
          </p>

          <div className="border border-zinc-800 bg-[#0e1118]">

            <div className="grid grid-cols-2 border-b border-zinc-800">

              <div className="border-r border-zinc-800 p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  Last worn
                </p>

                <p className="mt-2 text-sm text-white">
                  {formatDate(item.lastWorn)}
                </p>
              </div>

              <div className="p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  Times worn
                </p>

                <p className="mt-2 text-sm text-white">
                  {item.timesWorn ?? 0}
                </p>
              </div>

            </div>

            <div className="p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                Added to wardrobe
              </p>

              <p className="mt-2 text-sm text-white">
                {formatDate(item.addedAt)}
              </p>
            </div>

          </div>

          <button
            onClick={markAsWornToday}
            disabled={updating}
            className="mt-5 w-full bg-[#e2cb69] px-5 py-4 text-sm font-semibold tracking-[0.18em] text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? "UPDATING..." : "WORN TODAY"}
          </button>

          <p className="mt-3 text-center text-[10px] leading-5 text-zinc-500">
            IONA will use your wear history to create smarter outfit
            recommendations.
          </p>
        </section>

      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-sm text-zinc-200">
        {value || "—"}
      </p>
    </div>
  );
}