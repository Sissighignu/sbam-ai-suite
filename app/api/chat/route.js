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
      return NextResponse.json({ error: "Configurazione mancante. Ricarica la pagina." }, { status: 400 });
    }

    let apiMessages;
    if (messages && Array.isArray(messages)) {
      apiMessages = messages.map(m => ({ role: m.role, content: m.content }));
    } else if (message) {
      apiMessages = [{ role: "user", content: message }];
    } else {
      return NextResponse.json({ error: "Nessun messaggio da analizzare." }, { status: 400 });
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
    console.error("Anthropic API error:", JSON.stringify({
      status: error?.status,
      message: error?.message,
      type: error?.error?.type,
    }));
    
    const status = error?.status || error?.statusCode || 500;
    const errorType = error?.error?.type || "";
    const errorMsg = error?.message || "";
    
    let userMessage;
    
    if (status === 429 || errorType === "rate_limit_error" || errorMsg.includes("rate_limit")) {
      userMessage = "⏳ Limite di richieste raggiunto. Attendi un minuto e riprova.";
    } else if (status === 413 || errorMsg.includes("too long") || errorMsg.includes("too many tokens")) {
      userMessage = "📄 Il brief è troppo lungo per essere elaborato. Prova a caricare un file più breve o aggiungi le informazioni chiave nel campo di testo.";
    } else if (status === 401) {
      userMessage = "🔑 Errore di autenticazione API. Verifica che la chiave API sia configurata correttamente su Vercel.";
    } else if (status === 400) {
      userMessage = "⚠️ Errore nella richiesta. Prova a ricaricare la pagina e riprovare.";
    } else if (status === 500 || status === 503) {
      userMessage = "🔧 Servizio temporaneamente non disponibile. Riprova tra qualche minuto.";
    } else {
      userMessage = `Errore imprevisto (${status}). Riprova tra qualche minuto. Se il problema persiste, verifica la configurazione API su Vercel.`;
    }
    
    return NextResponse.json(
      { error: userMessage },
      { status: status || 500 }
    );
  }
}
