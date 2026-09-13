"use client";

import { useState } from "react";

export default function AddItemClient() {
  const [image, setImage] = useState<string | null>(null);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F1E8] pb-20">
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <a
          href="/wardrobe"
          className="text-xs uppercase tracking-[0.25em] text-[#8C877F] hover:text-[#C9A96E]"
        >
          ← Wardrobe
        </a>

        <h1 className="text-xl tracking-[0.3em] text-[#C9A96E]">
          IONA
        </h1>

        <div className="w-20" />
      </header>

      <section className="px-6 pt-8 text-center md:px-12">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A96E]">
          Add to your collection
        </p>

        <h2 className="mt-4 text-4xl font-light md:text-5xl">
          New Item
        </h2>

        <p className="mt-4 text-sm text-[#77736C]">
          Photograph or upload a piece from your wardrobe.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-xl px-6">
        <label className="relative flex min-h-[430px] cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-[#4A453C] bg-[#0E0E0E] transition hover:border-[#C9A96E]">
          {image ? (
            <img
              src={image}
              alt="Wardrobe item preview"
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
          ) : (
            <>
              <div className="text-4xl font-light text-[#C9A96E]">+</div>

              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-[#C9A96E]">
                Upload Photo
              </p>

              <p className="mt-3 text-xs text-[#66615A]">
                JPG, PNG or WEBP
              </p>

              <p className="mt-8 max-w-xs px-6 text-center text-xs leading-5 text-[#514D47]">
                For best results, photograph the entire item in good lighting
                against a simple background.
              </p>
            </>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        {image && (
          <div className="mt-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E]">
              Photo ready
            </p>

            <p className="mt-3 text-xs text-[#77736C]">
              Next, IONA will learn what this item is.
            </p>

            <a
  href="/item-details"
  className="mt-6 block w-full border border-[#C9A96E] bg-[#C9A96E] px-6 py-4 text-center text-xs uppercase tracking-[0.3em] text-black transition hover:bg-transparent hover:text-[#C9A96E]"
>
  Continue
</a>
          </div>
        )}
      </section>
    </main>
  );
}
