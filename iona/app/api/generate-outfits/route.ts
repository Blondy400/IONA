import OpenAI from "openai";
import { NextResponse } from "next/server";

type WardrobeItem = {
  id: number;
  category?: string | null;
  type?: string | null;
  color?: string | null;
  brand?: string | null;
  pattern?: string | null;
  material?: string | null;
  style?: string | null;
  season?: string | null;
};

type UserProfile = {
  gender?: string | null;

  height_cm?: number | null;
  weight_kg?: number | null;

  bust_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  inseam_cm?: number | null;

  preferred_styles?: string[] | null;
  preferred_colors?: string[] | null;
  avoided_colors?: string[] | null;
};

type RequestBody = {
  occasion?: string;
  request?: string;
  profile?: UserProfile | null;
  wardrobe?: WardrobeItem[];
};

type AIOutfit = {
  name?: string;
  itemIds?: number[];
  explanation?: string;
};

type AIResult = {
  status?: "success" | "insufficient";
  message?: string;
  outfits?: AIOutfit[];
  missingCategories?: string[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    console.log("✦ IONA: Generate outfits route reached");

    /*
     * --------------------------------------------
     * CHECK OPENAI KEY
     * --------------------------------------------
     */

    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "❌ IONA: OPENAI_API_KEY is missing"
      );

      return NextResponse.json(
        {
          status: "error",
          error:
            "IONA AI is not configured correctly.",
          outfits: [],
          missingCategories: [],
        },
        {
          status: 500,
        }
      );
    }

    /*
     * --------------------------------------------
     * READ REQUEST
     * --------------------------------------------
     */

    const body = (await request.json()) as RequestBody;

    const occasion =
      typeof body.occasion === "string"
        ? body.occasion.trim()
        : "";

    const styleRequest =
      typeof body.request === "string"
        ? body.request.trim().slice(0, 1500)
        : "";

    const profile = body.profile ?? null;

    const wardrobe = Array.isArray(body.wardrobe)
      ? body.wardrobe.slice(0, 100)
      : [];

    /*
     * --------------------------------------------
     * BASIC VALIDATION
     * --------------------------------------------
     */

    if (!occasion) {
      return NextResponse.json(
        {
          status: "error",
          error: "Please choose an occasion.",
          outfits: [],
          missingCategories: [],
        },
        {
          status: 400,
        }
      );
    }

    if (wardrobe.length === 0) {
      return NextResponse.json({
        status: "insufficient",
        message:
          "Your wardrobe is still empty. Add a few pieces and I can start creating looks for you.",
        outfits: [],
        missingCategories: [
          "tops",
          "bottoms",
          "shoes",
        ],
      });
    }

    /*
     * --------------------------------------------
     * PREPARE WARDROBE FOR AI
     * --------------------------------------------
     */

    const wardrobeForAI = wardrobe.map(
      (item) => ({
        id: item.id,

        category: item.category ?? null,
        type: item.type ?? null,
        color: item.color ?? null,
        brand: item.brand ?? null,

        pattern: item.pattern ?? null,
        material: item.material ?? null,
        style: item.style ?? null,
        season: item.season ?? null,
      })
    );

    /*
     * --------------------------------------------
     * PREPARE PROFILE FOR AI
     * --------------------------------------------
     */

    const profileForAI = profile
      ? {
          gender: profile.gender ?? null,

          height_cm: profile.height_cm ?? null,
          weight_kg: profile.weight_kg ?? null,

          bust_cm: profile.bust_cm ?? null,
          waist_cm: profile.waist_cm ?? null,
          hips_cm: profile.hips_cm ?? null,

          inside_leg_cm:
            profile.inseam_cm ?? null,

          preferred_styles:
            profile.preferred_styles ?? [],

          preferred_colors:
            profile.preferred_colors ?? [],

          avoided_colors:
            profile.avoided_colors ?? [],
        }
      : null;

    /*
     * --------------------------------------------
     * BUILD AI PROMPT
     * --------------------------------------------
     */

    const prompt = `
You are IONA, a premium personal AI fashion stylist.

Your job is to create thoughtful, wearable and personalized outfits using ONLY items that exist in the user's wardrobe.

You are not a shopping assistant in this mode.

Never invent clothing.
Never invent wardrobe IDs.
Never pretend the user owns an item that is not provided.

----------------------------------------
USER CONTEXT
----------------------------------------

OCCASION:
${occasion}

USER'S WRITTEN REQUEST:
${
  styleRequest ||
  "No additional request was provided."
}

USER PROFILE:
${JSON.stringify(profileForAI, null, 2)}

----------------------------------------
USER'S WARDROBE
----------------------------------------

${JSON.stringify(wardrobeForAI, null, 2)}

----------------------------------------
STYLING PRIORITIES
----------------------------------------

When creating outfits, consider these factors in this general order:

1. The occasion.
2. The user's written request.
3. The user's preferred styles.
4. The user's preferred colors.
5. Colors the user prefers to avoid.
6. Color harmony between wardrobe pieces.
7. Garment type, material, pattern, season and style.
8. The user's body information only when it is genuinely useful.

Body measurements can help you reason about proportions, but do NOT claim that an item will physically fit the user unless the wardrobe data contains enough sizing or fit information to support that conclusion.

Do not make sensitive or negative judgments about the user's body.

Use positive, tasteful, fashion-focused language.

----------------------------------------
WARDROBE RULES
----------------------------------------

You may ONLY recommend items from the supplied wardrobe.

Every item in an outfit MUST reference a real wardrobe item using its exact numeric "id".

Never create a fake ID.

Never recommend an item that is not present.

Never silently add imaginary shoes, trousers, jackets, bags or accessories.

Accessories are optional unless they are genuinely useful for the look.

A complete outfit normally needs enough clothing to be realistically wearable.

Examples:

- top + bottom + shoes
- dress + shoes
- jumpsuit + shoes
- coordinated set + shoes

A bag or accessory alone does not make an outfit complete.

A top plus a bag does not make an outfit complete.

If the wardrobe does NOT contain enough appropriate items to create a complete outfit for the occasion, return:

"status": "insufficient"

and explain naturally what is missing.

In that situation, DO NOT create fake or incomplete outfits.

----------------------------------------
OUTFIT GENERATION
----------------------------------------

If there are enough suitable pieces:

Create up to 3 genuinely different outfits.

Do not create three nearly identical combinations just to reach three results.

Each outfit needs:

- a short editorial name
- the exact wardrobe item IDs
- a concise personalized explanation

The explanation should sound like a premium personal stylist.

It may explain:

- why the colors work
- why the silhouette works
- how the outfit matches the occasion
- how it relates to the user's preferred style
- why a particular combination feels balanced

Do not mention database IDs in the explanation.

----------------------------------------
INSUFFICIENT WARDROBE
----------------------------------------

If the wardrobe is insufficient:

Explain briefly what can already be used and what categories are still needed.

For example:

"You already have a versatile white T-shirt and a feminine shoulder bag, but I still need a bottom and shoes to build a complete dinner look."

missingCategories should contain simple category names such as:

"bottoms"
"shoes"
"dress"
"outerwear"

Only include categories that are actually relevant.

----------------------------------------
OUTPUT FORMAT
----------------------------------------

Return ONLY valid JSON.

No markdown.
No code fences.
No text before or after the JSON.

Use exactly this structure:

{
  "status": "success" | "insufficient",
  "message": "Short natural message from IONA",
  "outfits": [
    {
      "name": "Editorial outfit name",
      "itemIds": [1, 2, 3],
      "explanation": "Why this look works"
    }
  ],
  "missingCategories": []
}

If status is "insufficient", outfits MUST be [].

If status is "success", missingCategories should normally be [].
`;

    /*
     * --------------------------------------------
     * CALL OPENAI
     * --------------------------------------------
     */

    console.log("✦ IONA: Calling OpenAI stylist...");

    const response =
      await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
      });

    console.log("✓ IONA: OpenAI responded");

    /*
     * --------------------------------------------
     * GET TEXT
     * --------------------------------------------
     */

    const outputText =
      response.output_text?.trim();

    if (!outputText) {
      console.error(
        "❌ IONA: OpenAI returned empty output"
      );

      return NextResponse.json(
        {
          status: "error",
          error:
            "IONA received an empty response from the AI.",
          outfits: [],
          missingCategories: [],
        },
        {
          status: 500,
        }
      );
    }

    /*
     * --------------------------------------------
     * PARSE JSON
     * --------------------------------------------
     */

    let aiResult: AIResult;

    try {
      aiResult = JSON.parse(
        outputText
      ) as AIResult;
    } catch (parseError) {
      console.error(
        "❌ IONA: Could not parse AI JSON"
      );

      console.error(
        "AI output:",
        outputText
      );

      console.error(
        "Parse error:",
        parseError
      );

      return NextResponse.json(
        {
          status: "error",
          error:
            "IONA received an invalid AI response.",
          outfits: [],
          missingCategories: [],
        },
        {
          status: 500,
        }
      );
    }

    /*
     * --------------------------------------------
     * SECURITY / HALLUCINATION CHECK
     * --------------------------------------------
     */

    const validIds = new Set(
      wardrobe.map((item) => item.id)
    );

    const safeOutfits = Array.isArray(
      aiResult.outfits
    )
      ? aiResult.outfits
          .map((outfit) => {
            const rawIds = Array.isArray(
              outfit.itemIds
            )
              ? outfit.itemIds
              : [];

            /*
             * Keep only IDs that genuinely exist
             * in this user's wardrobe.
             */

            const filteredIds = rawIds.filter(
              (id): id is number =>
                typeof id === "number" &&
                validIds.has(id)
            );

            /*
             * Remove duplicate IDs.
             */

            const uniqueIds = [
              ...new Set(filteredIds),
            ];

            return {
              name:
                typeof outfit.name === "string" &&
                outfit.name.trim()
                  ? outfit.name.trim()
                  : "IONA Look",

              itemIds: uniqueIds,

              explanation:
                typeof outfit.explanation ===
                  "string" &&
                outfit.explanation.trim()
                  ? outfit.explanation.trim()
                  : "A look created from your wardrobe.",
            };
          })
          .filter(
            (outfit) =>
              outfit.itemIds.length > 0
          )
          .slice(0, 3)
      : [];

    /*
     * --------------------------------------------
     * CLEAN MISSING CATEGORIES
     * --------------------------------------------
     */

    const missingCategories =
      Array.isArray(
        aiResult.missingCategories
      )
        ? [
            ...new Set(
              aiResult.missingCategories
                .filter(
                  (
                    category
                  ): category is string =>
                    typeof category ===
                      "string" &&
                    category.trim().length > 0
                )
                .map((category) =>
                  category
                    .trim()
                    .toLowerCase()
                )
            ),
          ].slice(0, 10)
        : [];

    /*
     * --------------------------------------------
     * DETERMINE FINAL STATUS
     * --------------------------------------------
     */

    const modelSaysSuccess =
      aiResult.status === "success";

    const finalStatus:
      | "success"
      | "insufficient" =
      modelSaysSuccess &&
      safeOutfits.length > 0
        ? "success"
        : "insufficient";

    /*
     * --------------------------------------------
     * SUCCESS
     * --------------------------------------------
     */

    if (finalStatus === "success") {
      console.log(
        `✓ IONA: ${safeOutfits.length} outfit(s) generated`
      );

      return NextResponse.json({
        status: "success",

        message:
          typeof aiResult.message === "string"
            ? aiResult.message
            : "I've styled a few looks from your wardrobe.",

        outfits: safeOutfits,

        missingCategories: [],
      });
    }

    /*
     * --------------------------------------------
     * INSUFFICIENT WARDROBE
     * --------------------------------------------
     */

    console.log(
      "✦ IONA: Wardrobe insufficient for complete outfit"
    );

    return NextResponse.json({
      status: "insufficient",

      message:
        typeof aiResult.message === "string" &&
        aiResult.message.trim()
          ? aiResult.message.trim()
          : "I don't have enough pieces in your wardrobe yet to create a complete look for this occasion.",

      outfits: [],

      missingCategories,
    });
  } catch (error: unknown) {
    /*
     * --------------------------------------------
     * SERVER / OPENAI ERROR
     * --------------------------------------------
     */

    console.error(
      "❌ IONA GENERATE OUTFITS ERROR:",
      error
    );

    let errorMessage =
      "IONA could not generate outfits right now.";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        status: "error",
        error: errorMessage,
        outfits: [],
        missingCategories: [],
      },
      {
        status: 500,
      }
    );
  }
}