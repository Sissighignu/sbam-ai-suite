import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { system, messages, message } = body;

    if (!system) {
      return NextResponse.json({ error: "Missing system prompt" }, { status: 400 });
    }

    // Support both multi-turn (messages array) and single-turn (message string)
    let apiMessages;
    if (messages && Array.isArray(messages)) {
      apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
    } else if (message) {
      apiMessages = [{ role: "user", content: message }];
    } else {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: system,
      messages: apiMessages,
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
