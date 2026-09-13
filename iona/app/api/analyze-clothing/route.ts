import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const image = body.image;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are the visual fashion analysis system for IONA.

Analyze the single main fashion item visible in this image.

Return ONLY valid JSON with this exact structure:

{
  "category": "Tops",
  "type": "T-shirt",
  "color": "White",
  "brand": "Unknown",
  "pattern": "Solid",
  "material": "Cotton",
  "style": "Casual",
  "season": "Spring/Summer",
  "confidence": 90
}

Rules:

category must be exactly one of:
Tops
Bottoms
Dresses
Outerwear
Shoes
Bags
Accessories

brand:
Identify it only if it is clearly visible or confidently identifiable.
Otherwise use "Unknown".
Never invent a brand.

material:
If it cannot reasonably be inferred visually, use "Unknown".

season must be exactly one of:
All Season
Spring/Summer
Autumn/Winter

confidence must be a number from 0 to 100.
              `,
            },
            {
              type: "input_image",
              image_url: image,
              detail: "high",
            },
          ],
        },
      ],
    });

    const text = response.output_text;

    if (!text) {
      throw new Error("IONA received an empty AI response.");
    }

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const analysis = JSON.parse(cleanedText);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("IONA clothing analysis error FULL:", error);

    return NextResponse.json(
      {
        error: error?.message || "Could not analyze clothing item.",
      },
      {
        status: error?.status || 500,
      }
    );
  }
}