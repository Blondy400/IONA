"use client";

import { useEffect, useMemo, useState } from "react";
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

type ClothingAnalysis = {
  category: string;
  type: string;
  color: string;
  brand: string;
  pattern: string;
  material: string;
  style: string;
  season: string;
  confidence: number;
};

const CATEGORY_NAMES = [
  "ALL",
  "TOPS",
  "BOTTOMS",
  "DRESSES",
  "OUTERWEAR",
  "SHOES",
  "BAGS",
  "ACCESSORIES",
];

function normalizeCategory(value: string) {
  const normalized = value.trim().toLowerCase();

  const map: Record<string, string> = {
    top: "Tops",
    tops: "Tops",
    shirt: "Tops",
    shirts: "Tops",

    bottom: "Bottoms",
    bottoms: "Bottoms",
    pants: "Bottoms",
    trousers: "Bottoms",
    jeans: "Bottoms",
    skirt: "Bottoms",
    skirts: "Bottoms",
    shorts: "Bottoms",

    dress: "Dresses",
    dresses: "Dresses",

    outerwear: "Outerwear",
    jacket: "Outerwear",
    jackets: "Outerwear",
    coat: "Outerwear",
    coats: "Outerwear",
    blazer: "Outerwear",
    blazers: "Outerwear",

    shoe: "Shoes",
    shoes: "Shoes",
    footwear: "Shoes",

    bag: "Bags",
    bags: "Bags",
    handbag: "Bags",
    handbags: "Bags",

    accessory: "Accessories",
    accessories: "Accessories",
  };

  return map[normalized] || value;
}

function getExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return file.name.split(".").pop()?.toLowerCase() || "jpg";
}

function getStoragePathFromPublicUrl(url: string) {
  const marker =
    "/storage/v1/object/public/wardrobe-images/";

  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(
    url.substring(markerIndex + marker.length)
  );
}

export default function WardrobePage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [showAddItem, setShowAddItem] =
    useState(false);

  const [category, setCategory] =
    useState("Tops");

  const [type, setType] =
    useState("");

  const [color, setColor] =
    useState("");

  const [brand, setBrand] =
    useState("");

  const [pattern, setPattern] =
    useState("");

  const [material, setMaterial] =
    useState("");

  const [style, setStyle] =
    useState("");

  const [season, setSeason] =
    useState("");

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [items, setItems] =
    useState<WardrobeItem[]>([]);

  const [loadingWardrobe, setLoadingWardrobe] =
    useState(true);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState("");

  const [saveError, setSaveError] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("ALL");

  useEffect(() => {
    loadWardrobe();
  }, []);

  async function loadWardrobe() {
    try {
      setLoadingWardrobe(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      const wardrobeItems: WardrobeItem[] =
        (data || []).map((item) => ({
          id: item.id,
          image: item.image_url,
          category: item.category || "",
          type: item.type || "",
          color: item.color || "",
          brand: item.brand || "",
          pattern: item.pattern || "",
          material: item.material || "",
          style: item.style || "",
          season: item.season || "",
          addedAt: item.created_at,
          lastWorn: item.last_worn,
          timesWorn: item.times_worn || 0,
        }));

      setItems(wardrobeItems);
    } catch (error) {
      console.error(
        "Could not load wardrobe from Supabase:",
        error
      );
    } finally {
      setLoadingWardrobe(false);
    }
  }

  const filteredItems =
    activeCategory === "ALL"
      ? items
      : items.filter(
          (item) =>
            item.category.toUpperCase() ===
            activeCategory
        );

  function resetForm() {
    setCategory("Tops");
    setType("");
    setColor("");
    setBrand("");
    setPattern("");
    setMaterial("");
    setStyle("");
    setSeason("");
    setImagePreview(null);
    setSelectedFile(null);
    setAnalysisError("");
    setSaveError("");
    setIsAnalyzing(false);
    setIsSaving(false);
  }

  async function analyzeImage(image: string) {
    try {
      setIsAnalyzing(true);
      setAnalysisError("");

      const response = await fetch(
        "/api/analyze-clothing",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            image,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not analyze image."
        );
      }

      const analysis =
        data as ClothingAnalysis;

      if (analysis.category) {
        setCategory(
          normalizeCategory(
            analysis.category
          )
        );
      }

      if (analysis.type) {
        setType(analysis.type);
      }

      if (analysis.color) {
        setColor(analysis.color);
      }

      if (analysis.brand) {
        setBrand(
          analysis.brand === "Unknown"
            ? ""
            : analysis.brand
        );
      }

      if (analysis.pattern) {
        setPattern(analysis.pattern);
      }

      if (analysis.material) {
        setMaterial(analysis.material);
      }

      if (analysis.style) {
        setStyle(analysis.style);
      }

      if (analysis.season) {
        setSeason(analysis.season);
      }
    } catch (error) {
      console.error(
        "IONA analysis failed:",
        error
      );

      setAnalysisError(
        "IONA could not analyze this item. You can still add it manually."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleImageUpload(file: File) {
    setSaveError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please upload a JPG, PNG or WEBP image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        "The image must be smaller than 5 MB."
      );
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();

    reader.onloadend = async () => {
      if (
        typeof reader.result === "string"
      ) {
        const image = reader.result;

        setImagePreview(image);

        await analyzeImage(image);
      }
    };

    reader.readAsDataURL(file);
  }

  async function addToWardrobe() {
    if (!imagePreview || !selectedFile) {
      alert(
        "Please upload a photo first."
      );
      return;
    }

    try {
      setIsSaving(true);
      setSaveError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const extension =
        getExtension(selectedFile);

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      /*
        STEP 1:
        Upload photograph to Supabase Storage
      */

      const {
        error: uploadError,
      } = await supabase.storage
        .from("wardrobe-images")
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              selectedFile.type,
          }
        );

      if (uploadError) {
        throw new Error(
          `Image upload failed: ${uploadError.message}`
        );
      }

      /*
        STEP 2:
        Generate public image URL
      */

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("wardrobe-images")
        .getPublicUrl(filePath);

      const imageUrl =
        publicUrlData.publicUrl;

      /*
        STEP 3:
        Save clothing data in database
      */

      const {
        data: insertedItem,
        error: insertError,
      } = await supabase
        .from("wardrobe_items")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          type: type || null,
          category:
            normalizeCategory(category),
          color: color || null,
          brand: brand || null,
          pattern: pattern || null,
          material: material || null,
          style: style || null,
          season: season || null,
          last_worn: null,
          times_worn: 0,
        })
        .select()
        .single();

      if (insertError) {
        /*
          Database insert failed.
          Remove uploaded image so we
          don't leave an orphan file.
        */

        await supabase.storage
          .from("wardrobe-images")
          .remove([filePath]);

        throw new Error(
          `Could not save wardrobe item: ${insertError.message}`
        );
      }

      const newItem: WardrobeItem = {
        id: insertedItem.id,
        image:
          insertedItem.image_url,
        category:
          insertedItem.category,
        type:
          insertedItem.type || "",
        color:
          insertedItem.color || "",
        brand:
          insertedItem.brand || "",
        pattern:
          insertedItem.pattern || "",
        material:
          insertedItem.material || "",
        style:
          insertedItem.style || "",
        season:
          insertedItem.season || "",
        addedAt:
          insertedItem.created_at,
        lastWorn:
          insertedItem.last_worn,
        timesWorn:
          insertedItem.times_worn || 0,
      };

      /*
        Update interface immediately
        without reloading the page.
      */

      setItems((prev) => [
        newItem,
        ...prev,
      ]);

      setShowAddItem(false);
      setActiveCategory("ALL");

      resetForm();
    } catch (error) {
      console.error(
        "Could not add wardrobe item:",
        error
      );

      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError(
          "Could not add this item. Please try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem(
    id: number,
    imageUrl: string
  ) {
    const confirmed =
      window.confirm(
        "Remove this item from your wardrobe?"
      );

    if (!confirmed) {
      return;
    }

    try {
      /*
        First delete database row.
        RLS ensures user can only
        delete their own item.
      */

      const { error } = await supabase
        .from("wardrobe_items")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      /*
        Then remove image from Storage.
      */

      const storagePath =
        getStoragePathFromPublicUrl(
          imageUrl
        );

      if (storagePath) {
        const {
          error: storageError,
        } = await supabase.storage
          .from("wardrobe-images")
          .remove([storagePath]);

        if (storageError) {
          console.warn(
            "Wardrobe row deleted but image cleanup failed:",
            storageError
          );
        }
      }

      setItems((prev) =>
        prev.filter(
          (item) =>
            item.id !== id
        )
      );

      const selectedId =
        localStorage.getItem(
          "iona-selected-item-id"
        );

      if (
        selectedId === String(id)
      ) {
        localStorage.removeItem(
          "iona-selected-item-id"
        );
      }
    } catch (error) {
      console.error(
        "Could not delete item:",
        error
      );

      alert(
        "Could not delete this item. Please try again."
      );
    }
  }

  function openItem(
    item: WardrobeItem
  ) {
    /*
      We keep ONLY the selected ID
      temporarily.

      Item Details will read the
      actual clothing data from
      Supabase in the next step.
    */

    localStorage.setItem(
      "iona-selected-item-id",
      String(item.id)
    );

    router.push("/item-details");
  }

  return (
    <main className="min-h-screen bg-[#090b10] px-6 pb-28 pt-8 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-12">
          <p className="mb-8 text-lg tracking-[0.35em] text-[#d8bd68]">
            IONA
          </p>

          <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-[#d8bd68]">
            YOUR DIGITAL CLOSET
          </p>

          <h1 className="text-5xl font-light tracking-tight">
            My Wardrobe
          </h1>

          <p className="mt-3 text-sm text-zinc-300">
            Every piece you own,
            beautifully organized and ready
            for IONA to style.
          </p>
        </div>

        {/* CATEGORY FILTERS */}

        <div className="mb-10 flex flex-wrap gap-3">
          {CATEGORY_NAMES.map(
            (item) => (
              <button
                key={item}
                onClick={() =>
                  setActiveCategory(
                    item
                  )
                }
                className={`border px-5 py-2 text-xs tracking-[0.12em] transition ${
                  activeCategory ===
                  item
                    ? "border-[#e2cb69] bg-[#e2cb69] text-black"
                    : "border-zinc-600 text-zinc-200 hover:border-[#e2cb69]"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        {/* LOADING */}

        {loadingWardrobe && (
          <div className="mb-8 border border-zinc-800 px-6 py-10 text-center">
            <p className="animate-pulse text-xs tracking-[0.18em] text-[#d8bd68]">
              ✦ LOADING YOUR WARDROBE ✦
            </p>
          </div>
        )}

        {/* WARDROBE ITEMS */}

        {!loadingWardrobe &&
          filteredItems.length >
            0 && (
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

              {filteredItems.map(
                (item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      openItem(item)
                    }
                    className="relative cursor-pointer border border-zinc-800 bg-[#0e1118] p-3 transition hover:border-[#d8bd68]"
                  >

                    {/* DELETE */}

                    <button
                      onClick={(
                        event
                      ) => {
                        event.stopPropagation();

                        deleteItem(
                          item.id,
                          item.image
                        );
                      }}
                      className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-zinc-300"
                      aria-label="Delete item"
                    >
                      ×
                    </button>

                    {/* IMAGE */}

                    <div className="aspect-square overflow-hidden bg-[#090b10]">
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.type ||
                          "Wardrobe item"
                        }
                        className="h-full w-full object-contain"
                      />
                    </div>

                    {/* CARD DETAILS */}

                    <div className="mt-3">
                      <p className="text-xs tracking-[0.14em] text-[#d8bd68]">
                        {(
                          item.type ||
                          item.category
                        ).toUpperCase()}
                      </p>

                      {item.type && (
                        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
                          {
                            item.category
                          }
                        </p>
                      )}

                      {(item.color ||
                        item.brand) && (
                        <p className="mt-2 text-xs text-zinc-400">
                          {[
                            item.color,
                            item.brand,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " · "
                            )}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

        {/* EMPTY CATEGORY */}

        {!loadingWardrobe &&
          activeCategory !==
            "ALL" &&
          filteredItems.length ===
            0 && (
            <div className="mb-8 border border-zinc-800 px-6 py-10 text-center">
              <p className="text-xs tracking-[0.18em] text-zinc-500">
                NO{" "}
                {activeCategory}{" "}
                YET
              </p>
            </div>
          )}

        {/* EMPTY WARDROBE */}

        {!loadingWardrobe &&
          activeCategory ===
            "ALL" &&
          items.length === 0 &&
          !showAddItem && (
            <div className="mb-8 border border-zinc-800 px-6 py-10 text-center">
              <p className="text-xs tracking-[0.18em] text-zinc-500">
                YOUR WARDROBE IS
                READY FOR ITS
                FIRST PIECE
              </p>
            </div>
          )}

        {/* ADD NEW ITEM */}

        {!showAddItem ? (
          <button
            onClick={() =>
              setShowAddItem(true)
            }
            className="flex h-72 w-full max-w-sm flex-col items-center justify-center border border-dashed border-zinc-500 transition hover:border-[#e2cb69]"
          >
            <span className="mb-6 text-3xl text-[#e2cb69]">
              +
            </span>

            <span className="text-sm font-semibold tracking-[0.12em] text-[#e2cb69]">
              {items.length === 0
                ? "ADD YOUR FIRST ITEM"
                : "ADD NEW ITEM"}
            </span>

            <span className="mt-2 text-xs text-zinc-400">
              Upload a photo
            </span>
          </button>
        ) : (

          /* ADD ITEM PANEL */

          <div className="max-w-xl border border-[#3a3a3a] bg-[#0e1118] p-6 shadow-2xl">

            {/* PANEL HEADER */}

            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs tracking-[0.25em] text-[#d8bd68]">
                  NEW WARDROBE
                  ITEM
                </p>

                <h2 className="mt-2 text-2xl font-light">
                  Add a piece
                </h2>
              </div>

              <button
                onClick={() => {
                  setShowAddItem(
                    false
                  );
                  resetForm();
                }}
                className="text-xl text-zinc-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* IMAGE UPLOAD */}

            <label className="mb-6 flex h-72 cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-zinc-600 bg-[#090b10] transition hover:border-[#d8bd68]">

              {imagePreview ? (
                <img
                  src={
                    imagePreview
                  }
                  alt="Wardrobe item preview"
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <>
                  <span className="text-4xl text-[#d8bd68]">
                    +
                  </span>

                  <span className="mt-4 text-sm tracking-[0.12em] text-white">
                    UPLOAD PHOTO
                  </span>

                  <span className="mt-2 text-xs text-zinc-500">
                    JPG, PNG or
                    WEBP · MAX 5 MB
                  </span>
                </>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file =
                    e.target
                      .files?.[0];

                  if (file) {
                    handleImageUpload(
                      file
                    );
                  }
                }}
              />
            </label>

            {/* AI ANALYZING */}

            {isAnalyzing && (
              <div className="mb-6 border border-[#d8bd68]/40 bg-[#d8bd68]/5 px-5 py-5 text-center">
                <p className="animate-pulse text-sm tracking-[0.22em] text-[#d8bd68]">
                  ✦ IONA IS
                  ANALYZING ✦
                </p>

                <p className="mt-2 text-xs text-zinc-500">
                  Identifying your
                  piece...
                </p>
              </div>
            )}

            {/* AI ERROR */}

            {analysisError && (
              <div className="mb-6 border border-zinc-700 px-4 py-3">
                <p className="text-xs text-zinc-400">
                  {analysisError}
                </p>
              </div>
            )}

            {/* SAVE ERROR */}

            {saveError && (
              <div className="mb-6 border border-red-900/60 bg-red-950/20 px-4 py-3">
                <p className="text-xs leading-5 text-red-300">
                  {saveError}
                </p>
              </div>
            )}

            {/* ANALYSIS RESULTS */}

            {imagePreview &&
              !isAnalyzing && (
                <div className="grid gap-5">

                  {/* ITEM TYPE */}

                  {type && (
                    <div>
                      <label className="mb-2 block text-xs tracking-[0.15em] text-zinc-400">
                        ITEM TYPE
                      </label>

                      <input
                        value={
                          type
                        }
                        onChange={(
                          e
                        ) =>
                          setType(
                            e.target
                              .value
                          )
                        }
                        className="w-full border border-zinc-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#d8bd68]"
                      />
                    </div>
                  )}

                  {/* CATEGORY */}

                  <div>
                    <label className="mb-2 block text-xs tracking-[0.15em] text-zinc-400">
                      CATEGORY
                    </label>

                    <select
                      value={
                        category
                      }
                      onChange={(
                        e
                      ) =>
                        setCategory(
                          e.target
                            .value
                        )
                      }
                      className="w-full border border-zinc-700 bg-[#0e1118] px-4 py-3 text-sm outline-none focus:border-[#d8bd68]"
                    >
                      <option>
                        Tops
                      </option>
                      <option>
                        Bottoms
                      </option>
                      <option>
                        Dresses
                      </option>
                      <option>
                        Outerwear
                      </option>
                      <option>
                        Shoes
                      </option>
                      <option>
                        Bags
                      </option>
                      <option>
                        Accessories
                      </option>
                    </select>
                  </div>

                  {/* COLOR + BRAND */}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs tracking-[0.15em] text-zinc-400">
                        COLOR
                      </label>

                      <input
                        value={
                          color
                        }
                        onChange={(
                          e
                        ) =>
                          setColor(
                            e.target
                              .value
                          )
                        }
                        placeholder="Detected automatically"
                        className="w-full border border-zinc-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#d8bd68]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs tracking-[0.15em] text-zinc-400">
                        BRAND
                      </label>

                      <input
                        value={
                          brand
                        }
                        onChange={(
                          e
                        ) =>
                          setBrand(
                            e.target
                              .value
                          )
                        }
                        placeholder="Detected automatically"
                        className="w-full border border-zinc-700 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#d8bd68]"
                      />
                    </div>
                  </div>

                  {/* IONA DETAILS */}

                  {(pattern ||
                    material ||
                    style ||
                    season) && (
                    <div className="border-t border-zinc-800 pt-5">

                      <p className="mb-4 text-xs tracking-[0.18em] text-[#d8bd68]">
                        IONA DETAILS
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs">

                        {pattern && (
                          <div>
                            <span className="text-zinc-500">
                              Pattern
                            </span>

                            <p className="mt-1 text-zinc-200">
                              {
                                pattern
                              }
                            </p>
                          </div>
                        )}

                        {material && (
                          <div>
                            <span className="text-zinc-500">
                              Material
                            </span>

                            <p className="mt-1 text-zinc-200">
                              {
                                material
                              }
                            </p>
                          </div>
                        )}

                        {style && (
                          <div>
                            <span className="text-zinc-500">
                              Style
                            </span>

                            <p className="mt-1 text-zinc-200">
                              {
                                style
                              }
                            </p>
                          </div>
                        )}

                        {season && (
                          <div>
                            <span className="text-zinc-500">
                              Season
                            </span>

                            <p className="mt-1 text-zinc-200">
                              {
                                season
                              }
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                </div>
              )}

            {/* ADD TO WARDROBE */}

            <button
              onClick={
                addToWardrobe
              }
              disabled={
                !imagePreview ||
                !selectedFile ||
                isAnalyzing ||
                isSaving
              }
              className="mt-7 w-full border border-[#d8bd68] bg-[#d8bd68] px-5 py-4 text-sm font-semibold tracking-[0.18em] text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isAnalyzing
                ? "IONA IS ANALYZING..."
                : isSaving
                ? "SAVING TO YOUR WARDROBE..."
                : "ADD TO WARDROBE"}
            </button>

          </div>
        )}

      </div>

      {/* BOTTOM NAVIGATION */}

      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-[#090b10]/95 backdrop-blur">

        <div className="mx-auto flex max-w-xl items-center justify-around px-4 py-4 text-xs">

          <a
            href="/home"
            className="text-zinc-400"
          >
            HOME
          </a>

          <a
            href="/wardrobe"
            className="font-semibold text-[#e2cb69]"
          >
            WARDROBE
          </a>

          <a
            href="/ai-stylist"
            className="text-zinc-400"
          >
            AI STYLIST
          </a>

          <a
            href="/profile"
            className="text-zinc-400"
          >
            PROFILE
          </a>

        </div>
      </nav>
    </main>
  );
}