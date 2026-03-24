import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { system, messages, message } = body;

    // Support both array (messages) and single string (message) formats
    const resolvedMessages = messages
      ? messages
      : message
      ? [{ role: "user", content: message }]
      : null;

    if (!resolvedMessages || !system) {
      return NextResponse.json(
        { error: "Missing system or message" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: system,
      messages: resolvedMessages,
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
