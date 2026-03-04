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
    
    const status = error?.status || error?.statusCode || 500;
    let userMessage = "Errore nella chiamata API.";
    
    if (status === 429 || (error.message && error.message.includes("rate_limit"))) {
      userMessage = "Limite di richieste raggiunto. Attendi un minuto e riprova.";
    } else if (status === 413 || (error.message && error.message.includes("too many"))) {
      userMessage = "Il contenuto inviato è troppo lungo. Prova con un brief più breve o riduci il testo aggiuntivo.";
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status }
    );
  }
}
