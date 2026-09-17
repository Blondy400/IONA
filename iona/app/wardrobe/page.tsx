"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import IonaLogo from "../../components/IonaLogo";

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

/* ======================================================
   CATEGORY ICONS
====================================================== */

function CategoryIcon({
  category,
  className = "h-[18px] w-[18px]",
}: {
  category: string;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.55,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (category === "ALL") {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <rect x="4" y="4" width="6" height="6" rx="1" {...common} />
        <rect x="14" y="4" width="6" height="6" rx="1" {...common} />
        <rect x="4" y="14" width="6" height="6" rx="1" {...common} />
        <rect x="14" y="14" width="6" height="6" rx="1" {...common} />
      </svg>
    );
  }

  if (category === "TOPS") {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <path
          d="M8.5 5.2 5.2 7 3.8 11l3 1.3V20h10.4v-7.7l3-1.3-1.4-4-3.3-1.8c-.8 1.2-2 1.8-3.5 1.8s-2.7-.6-3.5-1.8Z"
          {...common}
        />
        <path
          d="M9.2 5.1c.5 1 1.4 1.5 2.8 1.5s2.3-.5 2.8-1.5"
          {...common}
        />
      </svg>
    );
  }

  if (category === "BOTTOMS") {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <path
          d="M7.5 4.5h9l.8 15h-4.1L12 11.8l-1.2 7.7H6.7l.8-15Z"
          {...common}
        />
        <path d="M7.6 7.2h8.8" {...common} />
      </svg>
    );
  }

  if (category === "DRESSES") {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <path
          d="M9.4 4.5c.4 1.1 1.3 1.7 2.6 1.7s2.2-.6 2.6-1.7l1.3 3.7-1.6 3 3.7 8.3H6l3.7-8.3-1.6-3 1.3-3.7Z"
          {...common}
        />
        <path d="M9.7 11.2h4.6" {...common} />
      </svg>
    );
  }

  if (category === "OUTERWEAR") {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <path
          d="m9 4.5-3.2 2L4 12l3 1.2V20h10v-6.8l3-1.2-1.8-5.5-3.2-2L12 7 9 4.5Z"
          {...common}
        />
        <path
          d="M12 7v13M9 4.5 12 9l3-4.5"
          {...common}
        />
      </svg>
    );
  }

  if (category === "SHOES") {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <path
          d="M5.2 14.2c2.8.1 4.8-1.5 5.4-5.2l2.6.6c.5 2.5 2.1 3.8 5.6 4.4 1.2.2 1.8.9 1.8 1.8 0 1.1-.9 1.7-2.3 1.7H6.4c-1.7 0-2.8-.7-2.8-1.7 0-.8.6-1.4 1.6-1.6Z"
          {...common}
        />
        <path d="M11 12.1h3.2" {...common} />
      </svg>
    );
  }

  if (category === "BAGS") {
    return (
      <svg viewBox="0 0 24 24" className={className}>
        <path
          d="M5.2 8.5h13.6l1 11H4.2l1-11Z"
          {...common}
        />
        <path
          d="M8.5 9V7.4a3.5 3.5 0 0 1 7 0V9"
          {...common}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="8" r="3" {...common} />
      <path
        d="M12 11v8M8.5 14.5 12 11l3.5 3.5"
        {...common}
      />
      <circle cx="12" cy="8" r="1" {...common} />
    </svg>
  );
}

/* ======================================================
   BOTTOM NAV ICONS
====================================================== */

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]">
      <path
        d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4v-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WardrobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]">
      <path
        d="M8.5 5.2 5.2 7 3.8 11l3 1.3V20h10.4v-7.7l3-1.3-1.4-4-3.3-1.8c-.8 1.2-2 1.8-3.5 1.8s-2.7-.6-3.5-1.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]">
      <rect
        x="4"
        y="6"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 4v4M16 4v4M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]">
      <circle
        cx="12"
        cy="8"
        r="3.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7">
      <path
        d="M12 16V5M8 9l4-4 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15v4h14v-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ======================================================
   HELPERS
====================================================== */

function normalizeCategory(value: string) {
  const normalized = value.trim().toLowerCase();

  const map: Record<string, string> = {
    top: "Tops",
    tops: "Tops",
    shirt: "Tops",
    shirts: "Tops",
    blouse: "Tops",
    blouses: "Tops",
    tshirt: "Tops",
    "t-shirt": "Tops",

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

function categoryDisplayName(category: string) {
  if (category === "ALL") return "All";

  return (
    category.charAt(0) +
    category.slice(1).toLowerCase()
  );
}

/* ======================================================
   PAGE
====================================================== */

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

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("wardrobe-images")
        .getPublicUrl(filePath);

      const imageUrl =
        publicUrlData.publicUrl;

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
      const { error } = await supabase
        .from("wardrobe_items")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

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
    localStorage.setItem(
      "iona-selected-item-id",
      String(item.id)
    );

    router.push("/item-details");
  }
    return (
    <main
      className="
        min-h-[100dvh]
        bg-[#F8F4EE]
        text-[#1F1F1F]
      "
    >
      <div
        className="
          mx-auto
          min-h-[100dvh]
          w-full
          max-w-[430px]
          pb-[calc(105px+env(safe-area-inset-bottom))]
          pt-[env(safe-area-inset-top)]
        "
      >
        {/* HEADER */}

        <header className="px-5 pt-5">
          <div className="flex items-center justify-between">

            {/* OFFICIAL IONA LOGO */}
            <IonaLogo />

            <button
              type="button"
              onClick={() => {
                setShowAddItem(true);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              className="
                flex
                h-10
                items-center
                gap-2
                rounded-full
                bg-[#20201F]
                px-4
                text-[12px]
                font-medium
                text-[#FAF7F2]
                shadow-sm
                transition
                active:scale-[0.98]
              "
            >
              <PlusIcon />
              Add item
            </button>
          </div>

          <div className="pb-5 pt-9">
            <p
              className="
                text-[10px]
                font-medium
                uppercase
                tracking-[0.24em]
                text-[#9A8466]
              "
            >
              Your digital wardrobe
            </p>

            <h1
              className="
                mt-2
                font-serif
                text-[37px]
                font-normal
                leading-[1.05]
                tracking-[-0.035em]
                text-[#24221F]
              "
            >
              My Wardrobe
            </h1>

            <p
              className="
                mt-3
                text-[13px]
                leading-5
                text-[#817A71]
              "
            >
              {items.length === 0
                ? "Your personal collection starts here."
                : `${items.length} ${
                    items.length === 1
                      ? "piece"
                      : "pieces"
                  } in your wardrobe`}
            </p>
          </div>
        </header>

        {/* CATEGORY FILTERS */}

        <section className="mb-5">
          <div
            className="
              flex
              gap-2
              overflow-x-auto
              px-5
              pb-2
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {CATEGORY_NAMES.map(
              (item) => {
                const selected =
                  activeCategory === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setActiveCategory(
                        item
                      )
                    }
                    className={`
                      flex
                      shrink-0
                      items-center
                      gap-2
                      rounded-full
                      border
                      px-3.5
                      py-2.5
                      text-[11px]
                      font-medium
                      transition
                      ${
                        selected
                          ? "border-[#242321] bg-[#242321] text-[#FBF8F3]"
                          : "border-[#DED6CA] bg-[#FBF8F3] text-[#5E5952]"
                      }
                    `}
                  >
                    <CategoryIcon
                      category={item}
                      className="h-[17px] w-[17px]"
                    />

                    {categoryDisplayName(
                      item
                    )}
                  </button>
                );
              }
            )}
          </div>
        </section>

        {/* ADD ITEM PANEL */}

        {showAddItem && (
          <section className="px-5 pb-8">
            <div
              className="
                overflow-hidden
                rounded-[28px]
                border
                border-[#E2D9CD]
                bg-[#FCFAF6]
                shadow-[0_18px_50px_rgba(52,43,32,0.08)]
              "
            >
              <div
                className="
                  flex
                  items-start
                  justify-between
                  px-5
                  pb-4
                  pt-5
                "
              >
                <div>
                  <p
                    className="
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.23em]
                      text-[#A18867]
                    "
                  >
                    New wardrobe item
                  </p>

                  <h2
                    className="
                      mt-2
                      font-serif
                      text-[28px]
                      tracking-[-0.025em]
                    "
                  >
                    Add a piece
                  </h2>

                  <p
                    className="
                      mt-1.5
                      max-w-[250px]
                      text-[12px]
                      leading-[18px]
                      text-[#8A837A]
                    "
                  >
                    Upload a photo and IONA
                    will identify the details
                    for you.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddItem(
                      false
                    );
                    resetForm();
                  }}
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#E2D9CD]
                    bg-[#F8F4EE]
                    text-[20px]
                    font-light
                    text-[#5E5952]
                  "
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* IMAGE UPLOAD */}

              <div className="px-5">
                <label
                  className="
                    flex
                    aspect-[4/4.35]
                    cursor-pointer
                    flex-col
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-[22px]
                    border
                    border-dashed
                    border-[#CFC3B3]
                    bg-[#F3EDE4]
                  "
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Wardrobe item preview"
                      className="
                        h-full
                        w-full
                        object-contain
                        p-4
                      "
                    />
                  ) : (
                    <>
                      <div
                        className="
                          flex
                          h-14
                          w-14
                          items-center
                          justify-center
                          rounded-full
                          bg-[#FCFAF6]
                          text-[#8D7659]
                          shadow-sm
                        "
                      >
                        <UploadIcon />
                      </div>

                      <span
                        className="
                          mt-4
                          text-[12px]
                          font-medium
                          text-[#3E3A35]
                        "
                      >
                        Upload photo
                      </span>

                      <span
                        className="
                          mt-1.5
                          text-[10px]
                          text-[#999087]
                        "
                      >
                        JPG, PNG or WEBP · MAX
                        5 MB
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
              </div>

              {/* ANALYZING */}

              {isAnalyzing && (
                <div className="px-5 pt-4">
                  <div
                    className="
                      rounded-[18px]
                      border
                      border-[#D8C7AD]
                      bg-[#F6EFE5]
                      px-4
                      py-4
                      text-center
                    "
                  >
                    <p
                      className="
                        animate-pulse
                        text-[11px]
                        font-medium
                        tracking-[0.17em]
                        text-[#90734F]
                      "
                    >
                      ✦ IONA IS ANALYZING
                    </p>

                    <p className="mt-1.5 text-[11px] text-[#938A80]">
                      Identifying your piece...
                    </p>
                  </div>
                </div>
              )}

              {analysisError && (
                <div className="px-5 pt-4">
                  <div
                    className="
                      rounded-[16px]
                      border
                      border-[#DDD3C6]
                      bg-[#F8F3EC]
                      px-4
                      py-3
                    "
                  >
                    <p className="text-[11px] leading-5 text-[#746D64]">
                      {analysisError}
                    </p>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="px-5 pt-4">
                  <div
                    className="
                      rounded-[16px]
                      border
                      border-[#E1C8C2]
                      bg-[#FAF0EE]
                      px-4
                      py-3
                    "
                  >
                    <p className="text-[11px] leading-5 text-[#9A5147]">
                      {saveError}
                    </p>
                  </div>
                </div>
              )}

              {/* FORM */}

              {imagePreview &&
                !isAnalyzing && (
                  <div className="grid gap-4 px-5 pb-1 pt-5">
                    <div>
                      <label
                        className="
                          mb-2
                          block
                          text-[9px]
                          font-medium
                          uppercase
                          tracking-[0.18em]
                          text-[#91887D]
                        "
                      >
                        Item type
                      </label>

                      <input
                        value={type}
                        onChange={(e) =>
                          setType(
                            e.target.value
                          )
                        }
                        placeholder="e.g. T-shirt"
                        className="
                          w-full
                          rounded-[15px]
                          border
                          border-[#DDD4C8]
                          bg-[#F8F4EE]
                          px-4
                          py-3.5
                          text-[13px]
                          text-[#302D29]
                          outline-none
                          placeholder:text-[#AAA198]
                          focus:border-[#BDA98C]
                        "
                      />
                    </div>

                    <div>
                      <label
                        className="
                          mb-2
                          block
                          text-[9px]
                          font-medium
                          uppercase
                          tracking-[0.18em]
                          text-[#91887D]
                        "
                      >
                        Category
                      </label>

                      <select
                        value={category}
                        onChange={(e) =>
                          setCategory(
                            e.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-[15px]
                          border
                          border-[#DDD4C8]
                          bg-[#F8F4EE]
                          px-4
                          py-3.5
                          text-[13px]
                          text-[#302D29]
                          outline-none
                          focus:border-[#BDA98C]
                        "
                      >
                        <option>Tops</option>
                        <option>Bottoms</option>
                        <option>Dresses</option>
                        <option>Outerwear</option>
                        <option>Shoes</option>
                        <option>Bags</option>
                        <option>Accessories</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          className="
                            mb-2
                            block
                            text-[9px]
                            font-medium
                            uppercase
                            tracking-[0.18em]
                            text-[#91887D]
                          "
                        >
                          Color
                        </label>

                        <input
                          value={color}
                          onChange={(e) =>
                            setColor(
                              e.target.value
                            )
                          }
                          placeholder="Color"
                          className="
                            w-full
                            rounded-[15px]
                            border
                            border-[#DDD4C8]
                            bg-[#F8F4EE]
                            px-4
                            py-3.5
                            text-[13px]
                            outline-none
                            placeholder:text-[#AAA198]
                            focus:border-[#BDA98C]
                          "
                        />
                      </div>

                      <div>
                        <label
                          className="
                            mb-2
                            block
                            text-[9px]
                            font-medium
                            uppercase
                            tracking-[0.18em]
                            text-[#91887D]
                          "
                        >
                          Brand
                        </label>

                        <input
                          value={brand}
                          onChange={(e) =>
                            setBrand(
                              e.target.value
                            )
                          }
                          placeholder="Brand"
                          className="
                            w-full
                            rounded-[15px]
                            border
                            border-[#DDD4C8]
                            bg-[#F8F4EE]
                            px-4
                            py-3.5
                            text-[13px]
                            outline-none
                            placeholder:text-[#AAA198]
                            focus:border-[#BDA98C]
                          "
                        />
                      </div>
                    </div>

                    {(pattern ||
                      material ||
                      style ||
                      season) && (
                      <div
                        className="
                          mt-1
                          rounded-[18px]
                          bg-[#F3EDE4]
                          p-4
                        "
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <span className="text-[14px] text-[#9C7C55]">
                            ✦
                          </span>

                          <p
                            className="
                              text-[9px]
                              font-medium
                              uppercase
                              tracking-[0.2em]
                              text-[#927859]
                            "
                          >
                            IONA details
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                          {pattern && (
                            <div>
                              <p className="text-[9px] text-[#9B9288]">
                                Pattern
                              </p>
                              <p className="mt-1 text-[12px] text-[#403C37]">
                                {pattern}
                              </p>
                            </div>
                          )}

                          {material && (
                            <div>
                              <p className="text-[9px] text-[#9B9288]">
                                Material
                              </p>
                              <p className="mt-1 text-[12px] text-[#403C37]">
                                {material}
                              </p>
                            </div>
                          )}

                          {style && (
                            <div>
                              <p className="text-[9px] text-[#9B9288]">
                                Style
                              </p>
                              <p className="mt-1 text-[12px] text-[#403C37]">
                                {style}
                              </p>
                            </div>
                          )}

                          {season && (
                            <div>
                              <p className="text-[9px] text-[#9B9288]">
                                Season
                              </p>
                              <p className="mt-1 text-[12px] text-[#403C37]">
                                {season}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* SAVE BUTTON */}

              <div className="p-5">
                <button
                  type="button"
                  onClick={
                    addToWardrobe
                  }
                  disabled={
                    !imagePreview ||
                    !selectedFile ||
                    isAnalyzing ||
                    isSaving
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-full
                    bg-[#222220]
                    px-5
                    py-4
                    text-[12px]
                    font-medium
                    text-[#FCF9F4]
                    transition
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-35
                  "
                >
                  {isAnalyzing
                    ? "IONA is analyzing..."
                    : isSaving
                    ? "Saving..."
                    : "Add to wardrobe"}

                  {!isAnalyzing &&
                    !isSaving && (
                      <span className="text-[#D4C1A6]">
                        ✦
                      </span>
                    )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* LOADING */}

        {loadingWardrobe && (
          <section className="px-5 py-8">
            <div
              className="
                rounded-[24px]
                border
                border-[#E4DCD1]
                bg-[#FBF8F3]
                px-6
                py-12
                text-center
              "
            >
              <span className="animate-pulse text-[18px] text-[#B0926D]">
                ✦
              </span>

              <p
                className="
                  mt-3
                  text-[10px]
                  uppercase
                  tracking-[0.18em]
                  text-[#958B80]
                "
              >
                Loading your wardrobe
              </p>
            </div>
          </section>
        )}

        {/* WARDROBE GRID */}

        {!loadingWardrobe &&
          filteredItems.length > 0 && (
            <section className="px-5">
              <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                {filteredItems.map(
                  (item) => (
                    <article
                      key={item.id}
                      onClick={() =>
                        openItem(item)
                      }
                      className="group cursor-pointer"
                    >
                      <div
                        className="
                          relative
                          aspect-[4/5]
                          overflow-hidden
                          rounded-[22px]
                          border
                          border-[#E2D9CD]
                          bg-[#EFE8DE]
                        "
                      >
                        <img
                          src={item.image}
                          alt={
                            item.type ||
                            "Wardrobe item"
                          }
                          className="
                            h-full
                            w-full
                            object-contain
                            p-2
                            transition
                            duration-300
                            group-active:scale-[0.98]
                          "
                        />

                        <button
                          type="button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            deleteItem(
                              item.id,
                              item.image
                            );
                          }}
                          className="
                            absolute
                            right-2.5
                            top-2.5
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-white/70
                            bg-white/85
                            text-[16px]
                            font-light
                            text-[#6D665E]
                            shadow-sm
                            backdrop-blur
                          "
                          aria-label="Remove item"
                        >
                          ×
                        </button>

                        <div
                          className="
                            absolute
                            bottom-2.5
                            left-2.5
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            bg-[#FCFAF6]/90
                            text-[#6D6255]
                            backdrop-blur
                          "
                        >
                          <CategoryIcon
                            category={
                              item.category.toUpperCase()
                            }
                            className="h-[15px] w-[15px]"
                          />
                        </div>
                      </div>

                      <div className="px-1 pt-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3
                              className="
                                truncate
                                font-serif
                                text-[16px]
                                leading-5
                                text-[#2D2A26]
                              "
                            >
                              {item.type ||
                                item.category ||
                                "Wardrobe item"}
                            </h3>

                            {(item.color ||
                              item.brand) && (
                              <p
                                className="
                                  mt-1
                                  truncate
                                  text-[10px]
                                  leading-4
                                  text-[#8A8278]
                                "
                              >
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

                          <span className="mt-0.5 text-[15px] text-[#A98D68]">
                            ›
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          )}

        {/* EMPTY CATEGORY */}

        {!loadingWardrobe &&
          activeCategory !== "ALL" &&
          filteredItems.length === 0 && (
            <section className="px-5 py-6">
              <div
                className="
                  rounded-[26px]
                  border
                  border-[#E3DACE]
                  bg-[#FBF8F3]
                  px-6
                  py-12
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-[#F1E9DE]
                    text-[#8F7659]
                  "
                >
                  <CategoryIcon
                    category={
                      activeCategory
                    }
                    className="h-[21px] w-[21px]"
                  />
                </div>

                <h3 className="mt-4 font-serif text-[20px]">
                  No{" "}
                  {categoryDisplayName(
                    activeCategory
                  ).toLowerCase()}{" "}
                  yet
                </h3>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-[230px]
                    text-[11px]
                    leading-[18px]
                    text-[#8B8379]
                  "
                >
                  Add your first piece to
                  this category and let IONA
                  start styling it.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddItem(true)
                  }
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[#242321]
                    px-5
                    py-3
                    text-[11px]
                    text-white
                  "
                >
                  <PlusIcon />
                  Add item
                </button>
              </div>
            </section>
          )}

        {/* EMPTY WARDROBE */}

        {!loadingWardrobe &&
          activeCategory === "ALL" &&
          items.length === 0 &&
          !showAddItem && (
            <section className="px-5 py-6">
              <div
                className="
                  rounded-[28px]
                  border
                  border-[#E2D9CD]
                  bg-[#FBF8F3]
                  px-6
                  py-12
                  text-center
                "
              >
                <span className="font-serif text-[25px] text-[#A78A64]">
                  ✦
                </span>

                <h2
                  className="
                    mt-4
                    font-serif
                    text-[24px]
                    tracking-[-0.02em]
                  "
                >
                  Your wardrobe starts here
                </h2>

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-[260px]
                    text-[11px]
                    leading-[18px]
                    text-[#8A8278]
                  "
                >
                  Add the pieces you already
                  own. IONA will organize them
                  and use them to create
                  personalized looks.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddItem(true)
                  }
                  className="
                    mt-6
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-[#242321]
                    px-6
                    py-3.5
                    text-[11px]
                    text-[#FBF8F3]
                  "
                >
                  <PlusIcon />
                  Add your first item
                </button>
              </div>
            </section>
          )}

        {/* ADD ANOTHER PIECE */}

        {!loadingWardrobe &&
          items.length > 0 &&
          !showAddItem && (
            <section className="px-5 pb-8 pt-7">
              <button
                type="button"
                onClick={() =>
                  setShowAddItem(true)
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[20px]
                  border
                  border-dashed
                  border-[#CFC3B3]
                  bg-[#F4EEE5]
                  px-5
                  py-5
                  text-[11px]
                  font-medium
                  text-[#6D6255]
                  transition
                  active:scale-[0.995]
                "
              >
                <PlusIcon />
                Add another piece
              </button>
            </section>
          )}
      </div>

      {/* BOTTOM NAVIGATION */}

      <nav
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-50
          border-t
          border-[#E4DCD1]
          bg-[#FBF8F3]/95
          pb-[env(safe-area-inset-bottom)]
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            grid
            max-w-[430px]
            grid-cols-5
            items-end
            px-2
            pb-2
            pt-2.5
          "
        >
          <Link
            href="/home"
            className="
              flex
              flex-col
              items-center
              gap-1
              text-[#8A8279]
            "
          >
            <HomeIcon />
            <span className="text-[9px]">
              Home
            </span>
          </Link>

          <Link
            href="/wardrobe"
            className="
              flex
              flex-col
              items-center
              gap-1
              text-[#252321]
            "
          >
            <WardrobeIcon />
            <span className="text-[9px] font-medium">
              Wardrobe
            </span>
          </Link>

          <Link
            href="/ai-stylist"
            aria-label="AI Stylist"
            className="
              -mt-6
              flex
              flex-col
              items-center
              gap-1
            "
          >
            <span
              className="
                flex
                h-[54px]
                w-[54px]
                items-center
                justify-center
                rounded-full
                bg-[#252321]
                text-[22px]
                text-[#D4C1A6]
                shadow-[0_8px_22px_rgba(40,34,27,0.18)]
              "
            >
              ✦
            </span>

            <span className="text-[9px] text-[#5E5851]">
              Stylist
            </span>
          </Link>

          <Link
            href="/calendar"
            className="
              flex
              flex-col
              items-center
              gap-1
              text-[#8A8279]
            "
          >
            <CalendarIcon />
            <span className="text-[9px]">
              Calendar
            </span>
          </Link>

          <Link
            href="/profile"
            className="
              flex
              flex-col
              items-center
              gap-1
              text-[#8A8279]
            "
          >
            <ProfileIcon />
            <span className="text-[9px]">
              Profile
            </span>
          </Link>
        </div>
      </nav>
    </main>
  );
}