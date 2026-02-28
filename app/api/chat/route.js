import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// Allow larger request bodies for PDF uploads (up to 30MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
};

// For App Router: increase max duration for large PDF processing
export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      return NextResponse.json({ error: "Request body troppo grande o non valido. Prova con un PDF più piccolo (max 25MB)." }, { status: 413 });
    }

    const { system, message, file } = body;
    // file = { base64, mediaType, fileName } (optional)

    if (!system) {
      return NextResponse.json({ error: "Missing system prompt" }, { status: 400 });
    }

    // Build user message content blocks
    const content = [];

    // If a PDF is attached, send it natively to Claude
    if (file && file.base64 && file.mediaType === "application/pdf") {
      content.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: file.base64,
        },
      });
    }

    // Add the text message
    if (message) {
      content.push({ type: "text", text: message });
    }

    if (content.length === 0) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: system,
      messages: [{ role: "user", content }],
    });

    const text = response.content
      .map((block) => block.text || "")
      .join("\n");

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Anthropic API error:", error);
    return NextResponse.json(
      { error: error.message || "API call failed" },
      { status: 500 }
    );
  }
}
