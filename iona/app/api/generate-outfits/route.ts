import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type WardrobeItem = {
  id: number;
  category?: string;
  type?: string;
  color?: string;
  brand?: string;
  pattern?: string | null;
  material?: string | null;
  style?: string | null;
  season?: string | null;
};

type RequestBody = {
  occasion?: string;
  wardrobe?: WardrobeItem[];
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const body = (await request.json()) as RequestBody;

    const occasion = body.occasion?.trim();
    const wardrobe = Array.isArray(body.wardrobe)
      ? body.wardrobe.slice(0, 100)
      : [];

    if (!occasion) {
      return NextResponse.json(
        {
          error: "Occasion is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (wardrobe.length === 0) {
      return NextResponse.json(
        {
          status: "insufficient",
          message:
            "Your wardrobe is empty. Add some pieces before asking IONA to create an outfit.",
          outfits: [],
        }
      );
    }

    const wardrobeForAI = wardrobe.map((item) => ({
      id: item.id,
      type: item.type || "",
      category: item.category || "",
      color: item.color || "",
      brand: item.brand || "",
      pattern: item.pattern || "",
      material: item.material || "",
      style: item.style || "",
      season: item.season || "",
    }));

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      input: `
You are IONA, a premium personal fashion stylist.

The user wants outfit recommendations for this occasion:

${occasion}

Here is the user's REAL wardrobe:

${JSON.stringify(wardrobeForAI, null, 2)}

IMPORTANT RULES:

1. You may ONLY recommend wardrobe items provided above.
2. NEVER invent an item, brand, color, garment or item ID.
3. Every itemId must exactly match an ID from the wardrobe.
4. Prefer complete outfits when the wardrobe contains enough compatible pieces.
5. A normal complete outfit may include:
   - top
   - bottom OR dress
   - shoes
   - optional outerwear
   - optional bag
   - optional accessories
6. Do NOT pretend an outfit is complete when essential pieces are missing.
7. If the wardrobe is too small to create a complete outfit for the occasion,
   return status "insufficient".
8. When the wardrobe allows it, create up to 3 genuinely different outfits.
9. Do not repeat identical combinations just to reach 3 outfits.
10. Give each outfit a short elegant name.
11. Explain briefly why the combination works for the occasion.
12. If useful, identify categories that are missing from the wardrobe.
13. The user may have manually corrected item information. Treat the supplied
    wardrobe data as the source of truth.
14. Return VALID JSON ONLY. No markdown. No code fences. No extra text.

Return exactly this JSON structure:

{
  "status": "success" or "insufficient",
  "message": "short message for the user",
  "outfits": [
    {
      "name": "outfit name",
      "itemIds": [1, 2],
      "explanation": "short styling explanation"
    }
  ],
  "missingCategories": ["Bottoms", "Shoes"]
}

If there are not enough pieces for a complete outfit, outfits may be an empty
array and missingCategories should explain what is needed.
`,
    });

    const rawText = response.output_text?.trim();

    if (!rawText) {
      throw new Error("OpenAI returned an empty response.");
    }

    let result;

    try {
      result = JSON.parse(rawText);
    } catch {
      console.error("Invalid AI response:", rawText);

      return NextResponse.json(
        {
          error: "IONA could not understand the styling response.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Extra safety check:
      Make sure AI never returns IDs that do not exist
      in the user's supplied wardrobe.
    */

    const validIds = new Set(wardrobe.map((item) => item.id));

    const safeOutfits = Array.isArray(result.outfits)
      ? result.outfits
          .map(
            (outfit: {
              name?: string;
              itemIds?: number[];
              explanation?: string;
            }) => {
              const safeItemIds = Array.isArray(outfit.itemIds)
                ? outfit.itemIds.filter((id) => validIds.has(id))
                : [];

              return {
                name: outfit.name || "IONA Look",
                itemIds: safeItemIds,
                explanation: outfit.explanation || "",
              };
            }
          )
          .filter(
            (outfit: {
              name: string;
              itemIds: number[];
              explanation: string;
            }) => outfit.itemIds.length > 0
          )
      : [];

    return NextResponse.json({
      status:
        result.status === "success" && safeOutfits.length > 0
          ? "success"
          : "insufficient",

      message:
        result.message ||
        "IONA has finished analyzing your wardrobe.",

      outfits: safeOutfits,

      missingCategories: Array.isArray(result.missingCategories)
        ? result.missingCategories
        : [],
    });
  } catch (error) {
    console.error("Generate outfits error:", error);

    return NextResponse.json(
      {
        error: "IONA could not generate outfits right now.",
      },
      {
        status: 500,
      }
    );
  }
}