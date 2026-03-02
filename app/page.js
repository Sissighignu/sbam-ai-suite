"use client";

import { useState, useRef, useEffect } from "react";

const G = "#c8e64a";
const DARK = "#0a0a0a";
const DARKER = "#050505";
const CARD = "#111111";
const BORDER = "#1a1a1a";
const MUTED = "#666666";
const TEXT = "#e0e0e0";

// ─── SYSTEM PROMPTS (predisposti per knowledge base SBAM - Fase 3) ───
const SBAM_CONTEXT = `Sei parte di SBAM, agenzia creativa part of JAKALA. La filosofia di SBAM è "Radical Simplicity": idee semplici, forti, che fanno parlare. Rispondi SEMPRE in italiano.`;

const SYSTEM_PROMPTS = {
  brief: `${SBAM_CONTEXT}
Il tuo ruolo è analizzare brief di clienti con occhio critico e costruttivo, come un senior strategist.

Quando ricevi un brief per la prima volta, analizzalo con questo formato:
## Sintesi del Brief
## Insight Chiave
## Gap & Domande Critiche
## Opportunità Nascoste
## Red Flags
## Prossimi Step Consigliati

Nelle risposte successive, rispondi in modo conversazionale: approfondisci, riformula, esplora nuove direzioni. Mantieni sempre il contesto. Sii diretto e concreto.`,

  strategy: `${SBAM_CONTEXT}
Il tuo ruolo è Chief Strategy Officer. Generi proposte strategiche complete.

Quando ricevi un brief per la prima volta, usa questo formato:
## Executive Summary
## Target Audience (Primario e Secondario)
## Posizionamento & Tone of Voice
## Strategia Canali
## Big Idea
## Pillar di Comunicazione
## KPI Suggeriti
## Timeline Indicativa

Nelle risposte successive, approfondisci e raffina la strategia in base al feedback. Sii ambizioso ma realistico.`,

  competitor: `${SBAM_CONTEXT}
Il tuo ruolo è specialista in competitive intelligence e trend analysis per il mercato italiano ed europeo.

Quando ricevi una richiesta per la prima volta, usa questo formato:
## Overview del Mercato
## Analisi Competitor
## Trend Rilevanti (Macro, Micro, Social & Content)
## White Space & Opportunità
## Minacce
## Raccomandazioni per il Brand

Nelle risposte successive, approfondisci specifici competitor, trend o aspetti del mercato. Sii specifico e azionabile.`,

  creative: `${SBAM_CONTEXT}
Il tuo ruolo è Chief Creative Officer. Generi concept creativi Simple & Loud.

Quando ricevi una richiesta per la prima volta, genera 3 concept creativi distinti con questo formato per ciascuno:
### Concept [N]: [Nome]
**Big Idea** · **Insight** · **Esecuzione** · **Headline/Claim** · **Tono** · **Perché funziona**

Nelle risposte successive, sviluppa concept specifici, generane di nuovi, o affina in base al feedback. Sii audace e culturalmente rilevante.`,
};

const TOOL_CONFIG = {
  brief: { icon: "🔍", title: "Brief Analyzer", subtitle: "Analizza brief in conversazione — approfondisci ogni aspetto", tag: "ANALYSIS", welcome: "Carica un brief (PDF) o descrivi il progetto. Analizzerò tutto e poi potrai chiedermi di approfondire qualsiasi aspetto.", starters: ["Analizza i punti deboli del brief", "Identifica il vero obiettivo del cliente", "Suggerisci domande da fare al cliente"] },
  strategy: { icon: "🎯", title: "Strategy Generator", subtitle: "Costruisci la strategia insieme all'AI — itera ogni dettaglio", tag: "STRATEGY", welcome: "Condividi il brief o il contesto. Genererò una proposta strategica completa e potrai affinare ogni aspetto.", starters: ["Focalizzati sul target Gen Z", "Proponi una strategia digital-first", "Includi una fase di branded content"] },
  competitor: { icon: "📡", title: "Competitor & Trend Scanner", subtitle: "Esplora il mercato in profondità — vai oltre la superficie", tag: "INTELLIGENCE", welcome: "Dimmi brand e settore. Mapperò competitor e trend, poi potrai esplorare in profondità.", starters: ["Analizza la comunicazione social dei competitor", "Identifica trend emergenti nel settore", "Trova white space non presidiati"] },
  creative: { icon: "💡", title: "Creative Concept Generator", subtitle: "Genera concept e iterali fino alla perfezione", tag: "CREATIVE", welcome: "Condividi strategia o brief. Genererò concept creativi e potrai svilupparli, modificarli o esplorare nuove direzioni.", starters: ["Sviluppa di più il Concept 1", "Proponi un concept più provocatorio", "Genera concept per una campagna social-first"] },
};

// ─── API Call (multi-turn conversation) ───
async function callAI(system, messages) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages }),
    });
    const data = await res.json();
    if (data.error) return `Errore: ${data.error}`;
    return data.text || "Nessuna risposta.";
  } catch (e) {
    return `Errore di connessione: ${e.message}`;
  }
}

// ─── PDF Text Extraction (client-side) ───
async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(" ");
    if (text.trim()) pages.push(`[Pagina ${i}]\n${text}`);
  }
  return pages.join("\n\n");
}

// ─── Rich Text Renderer ───
function RichText({ text }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.7, color: TEXT, fontSize: 14 }}>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} style={{ color: G, fontSize: 15, fontWeight: 700, margin: "16px 0 6px", fontFamily: "'Space Mono', monospace" }}>{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={i} style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "20px 0 8px", fontFamily: "'Space Mono', monospace" }}>{line.slice(3)}</h2>;
        if (line.startsWith("# ")) return <h1 key={i} style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "22px 0 10px", fontFamily: "'Space Mono', monospace" }}>{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, paddingLeft: 8 }}><span style={{ color: G }}>▸</span><span dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} /></div>;
        if (line.startsWith("---")) return <hr key={i} style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "12px 0" }} />;
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ margin: "3px 0" }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
      })}
    </div>
  );
}
function boldify(t) { return t.replace(/\*\*(.*?)\*\*/g, `<strong style="color:#fff;font-weight:600">$1</strong>`); }

// ─── Chat Message ───
function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14, animation: "fadeIn 0.3s ease" }}>
      <div style={{
        maxWidth: isUser ? "75%" : "92%",
        padding: isUser ? "11px 15px" : "18px 22px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isUser ? `${G}15` : CARD,
        border: `1px solid ${isUser ? `${G}28` : BORDER}`,
        borderLeft: isUser ? undefined : `3px solid ${G}`,
      }}>
        {isUser ? (
          <>
            {msg.fileName && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: "5px 9px", background: `${G}10`, borderRadius: 6, fontSize: 12, color: G }}>📄 {msg.fileName}</div>}
            <div style={{ color: TEXT, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.displayText || msg.content}</div>
          </>
        ) : <RichText text={msg.content} />}
      </div>
    </div>
  );
}

// ─── Loading Indicator ───
function LoadingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
      <div style={{ padding: "14px 20px", borderRadius: "14px 14px 14px 4px", background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${G}` }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 0.15, 0.3].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: G, animation: `pulse 1s ease-in-out ${d}s infinite` }} />)}
          <span style={{ color: MUTED, fontSize: 11, marginLeft: 6, fontFamily: "'Space Mono', monospace" }}>Sto elaborando...</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Tool (universal for all 4 tools) ───
function ChatTool({ toolId, initialContent, onSendToTool }) {
  const config = TOOL_CONFIG[toolId];
  const systemPrompt = SYSTEM_PROMPTS[toolId];

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingFile, setProcessingFile] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Handle pipeline: if this tool receives content from another tool, auto-send it
  useEffect(() => {
    if (initialContent && messages.length === 0) {
      const msg = { role: "user", content: `Ecco l'output del tool precedente su cui lavorare:\n\n${initialContent}`, displayText: "(Output ricevuto dal tool precedente — vedi sotto)", fileName: null };
      const newMsgs = [msg];
      setMessages(newMsgs);
      setLoading(true);
      callAI(systemPrompt, newMsgs.map(m => ({ role: m.role, content: m.content }))).then(reply => {
        setMessages([...newMsgs, { role: "assistant", content: reply }]);
        setLoading(false);
      });
    }
  }, [initialContent]);

  const handleFile = async (file) => {
    if (!file) return;
    setProcessingFile(true);
    try {
      if (file.size > 50 * 1024 * 1024) { alert("File troppo grande (max 50 MB)"); setProcessingFile(false); return; }
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let text;
      if (isPdf) {
        text = await extractPdfText(file);
        if (text.trim().length < 50) alert("Il PDF sembra contenere principalmente immagini.");
      } else {
        text = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
      }
      setUploadedFile({ name: file.name, text, size: file.size });
    } catch { alert("Errore nella lettura del file."); }
    setProcessingFile(false);
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed && !uploadedFile) return;

    let fullContent = "";
    let displayText = trimmed;
    let fileName = null;
    if (uploadedFile) { fullContent += `[Contenuto del file "${uploadedFile.name}"]\n${uploadedFile.text}\n\n`; fileName = uploadedFile.name; }
    if (trimmed) fullContent += trimmed;

    const userMsg = { role: "user", content: fullContent, displayText, fileName };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput(""); setUploadedFile(null); setLoading(true);

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
    const reply = await callAI(systemPrompt, apiMessages);
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
  const pipeline = { brief: [{ id: "strategy", label: "Genera Strategia", icon: "🎯" }, { id: "competitor", label: "Scansiona Competitor", icon: "📡" }], strategy: [{ id: "creative", label: "Genera Concept", icon: "💡" }], competitor: [{ id: "strategy", label: "Genera Strategia", icon: "🎯" }], creative: [] };
  const formatSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 20px)", maxWidth: 840, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "12px 0 10px", borderBottom: `1px solid ${BORDER}`, marginBottom: 4, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{config.icon}</span>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Space Mono', monospace", margin: 0 }}>{config.title}</h2>
          <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{config.subtitle}</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setUploadedFile(null); setInput(""); }}
            style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, cursor: "pointer", padding: "4px 10px", fontSize: 10, fontFamily: "'Space Mono', monospace" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
          >Nuova sessione</button>
        )}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>{config.icon}</div>
            <p style={{ color: MUTED, fontSize: 14, maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.6 }}>{config.welcome}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {config.starters.map(q => (
                <button key={q} onClick={() => setInput(q)}
                  style={{ padding: "7px 13px", background: `${G}08`, border: `1px solid ${G}20`, borderRadius: 18, color: G, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${G}18`}
                  onMouseLeave={e => e.currentTarget.style.background = `${G}08`}
                >{q}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {loading && <LoadingBubble />}
          </>
        )}

        {/* Pipeline buttons */}
        {lastAssistantMsg && !loading && pipeline[toolId]?.length > 0 && (
          <div style={{ padding: "10px 0 6px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: MUTED, fontSize: 10, fontFamily: "'Space Mono', monospace" }}>PROSEGUI CON →</span>
            {pipeline[toolId].map(t => (
              <button key={t.id} onClick={() => onSendToTool(t.id, lastAssistantMsg.content)}
                style={{ padding: "6px 12px", background: `${G}08`, border: `1px solid ${G}25`, borderRadius: 7, color: G, fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono', monospace", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}
                onMouseEnter={e => { e.currentTarget.style.background = `${G}18`; e.currentTarget.style.borderColor = G; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${G}08`; e.currentTarget.style.borderColor = `${G}25`; }}
              >{t.icon} {t.label} →</button>
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}`, padding: "10px 0 6px" }}>
        {uploadedFile && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: `${G}08`, border: `1px solid ${G}20`, borderRadius: 7, marginBottom: 8, fontSize: 12 }}>
            <span>📄</span>
            <span style={{ color: "#fff", flex: 1 }}>{uploadedFile.name} <span style={{ color: MUTED }}>({formatSize(uploadedFile.size)})</span></span>
            <button onClick={() => setUploadedFile(null)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}>✕</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
          <label style={{ cursor: "pointer", padding: "9px 11px", background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 9, display: "flex", alignItems: "center", flexShrink: 0, transition: "border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = G}
            onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
            <input type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,.pptx" style={{ display: "none" }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            {processingFile ? <span style={{ width: 16, height: 16, border: `2px solid ${G}40`, borderTopColor: G, borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} /> : <span style={{ fontSize: 16 }}>📎</span>}
          </label>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={messages.length === 0 ? "Descrivi il progetto o carica un file..." : "Chiedi di approfondire, modificare, esplorare..."}
            rows={Math.min(input.split("\n").length, 4) || 1}
            style={{ flex: 1, background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 9, color: "#fff", padding: "9px 13px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "none", outline: "none", transition: "border-color 0.15s" }}
            onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = BORDER} />
          <button onClick={send} disabled={loading || (!input.trim() && !uploadedFile)}
            style={{ padding: "9px 14px", background: G, border: "none", borderRadius: 9, cursor: loading || (!input.trim() && !uploadedFile) ? "not-allowed" : "pointer", opacity: loading || (!input.trim() && !uploadedFile) ? 0.25 : 1, transition: "opacity 0.15s", display: "flex", alignItems: "center", flexShrink: 0 }}>
            {loading ? <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} /> : <span style={{ fontSize: 16, color: "#000", fontWeight: 700 }}>↑</span>}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span style={{ color: MUTED, fontSize: 9, fontFamily: "'Space Mono', monospace" }}>Shift+Enter per andare a capo · Enter per inviare</span>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation ───
const TOOLS = [
  { id: "home", label: "Home", icon: "⚡" },
  { id: "brief", label: "Brief Analyzer", icon: "🔍" },
  { id: "strategy", label: "Strategy Gen", icon: "🎯" },
  { id: "competitor", label: "Trend Scanner", icon: "📡" },
  { id: "creative", label: "Concept Gen", icon: "💡" },
];

// ─── Home ───
function Home({ onNavigate }) {
  const cards = [
    { id: "brief", icon: "🔍", title: "Brief Analyzer", desc: "Analizza brief in una conversazione guidata. Carica un PDF, esplora insight, affina l'analisi.", tag: "ANALYSIS" },
    { id: "strategy", icon: "🎯", title: "Strategy Generator", desc: "Costruisci la strategia insieme all'AI. Target, canali, big idea — itera fino alla perfezione.", tag: "STRATEGY" },
    { id: "competitor", icon: "📡", title: "Trend Scanner", desc: "Esplora il mercato in profondità. Competitor, trend, white space — approfondisci con domande.", tag: "INTELLIGENCE" },
    { id: "creative", icon: "💡", title: "Concept Generator", desc: "Genera concept Simple & Loud. Sviluppali, cambiali, affinali attraverso il dialogo.", tag: "CREATIVE" },
  ];
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "55px 20px 45px", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 380, height: 380, background: `radial-gradient(circle, ${G}08 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: G, letterSpacing: 4, textTransform: "uppercase", marginBottom: 18 }}>AI-Powered Creative Suite</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
          <img src="/logo.png" alt="SBAM" style={{ height: 48, objectFit: "contain" }} />
          <span style={{ fontSize: 44, fontWeight: 800, color: G, fontFamily: "'Space Mono', monospace", opacity: 0.55 }}>.ai</span>
        </div>
        <p style={{ fontSize: 16, color: MUTED, maxWidth: 460, margin: "0 auto 6px", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>La suite AI interna per il team SBAM.</p>
        <p style={{ fontSize: 14, color: MUTED, maxWidth: 460, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>Radical Simplicity, superpowered by AI.</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 28, padding: "10px 16px", background: `${G}06`, borderRadius: 10, maxWidth: 440, margin: "28px auto 0" }}>
          <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: G }}>WORKFLOW</span>
          <span style={{ color: MUTED, fontSize: 10 }}>│</span>
          {["🔍", "🎯", "📡", "💡"].map((e, i) => <span key={i}><span style={{ fontSize: 12 }}>{e}</span>{i < 3 && <span style={{ color: MUTED, fontSize: 10, margin: "0 2px" }}>→</span>}</span>)}
          <span style={{ color: MUTED, fontSize: 10 }}>│</span>
          <span style={{ fontSize: 10, color: MUTED, fontFamily: "'Space Mono', monospace" }}>Brief → Strategy → Concept</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, padding: "0 20px" }}>
        {cards.map(card => (
          <div key={card.id} onClick={() => onNavigate(card.id)}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 13, padding: 24, cursor: "pointer", transition: "all 0.25s ease", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${G}12`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: G, letterSpacing: 2, marginBottom: 12 }}>{card.tag}</div>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px", fontFamily: "'Space Mono', monospace" }}>{card.title}</h3>
            <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
            <div style={{ position: "absolute", bottom: 14, right: 18, color: G, fontSize: 18, opacity: 0.4 }}>→</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", padding: "40px 20px 24px", color: MUTED, fontSize: 11, fontFamily: "'Space Mono', monospace" }}>SBAM — Part of JAKALA · AI Suite Internal Tool · 2026</div>
    </div>
  );
}

// ─── Main App ───
export default function Page() {
  const [activeTool, setActiveTool] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pipelineData, setPipelineData] = useState({});

  const handleSendToTool = (targetId, content) => {
    setPipelineData(prev => ({ ...prev, [targetId]: content }));
    setActiveTool(targetId);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: DARK, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.25; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
        ::selection { background: ${G}33; color: #fff; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 52 : 200, background: DARKER, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", transition: "width 0.25s ease", flexShrink: 0 }}>
        <div style={{ padding: sidebarCollapsed ? "14px 6px" : "14px 12px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
          {!sidebarCollapsed && <div style={{ display: "flex", alignItems: "center", gap: 4 }}><img src="/logo.png" alt="SBAM" style={{ height: 18, objectFit: "contain" }} /><span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 12, color: G, opacity: 0.65 }}>.ai</span></div>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 12, padding: 2, display: "flex", margin: sidebarCollapsed ? "0 auto" : 0 }}>{sidebarCollapsed ? "▶" : "◀"}</button>
        </div>
        <nav style={{ flex: 1, padding: "8px 5px" }}>
          {TOOLS.map(tool => {
            const active = activeTool === tool.id;
            return (
              <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: sidebarCollapsed ? "8px 0" : "8px 10px", justifyContent: sidebarCollapsed ? "center" : "flex-start", background: active ? `${G}12` : "transparent", border: "none", borderRadius: 6, color: active ? G : MUTED, cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace", fontWeight: active ? 700 : 400, marginBottom: 2, transition: "all 0.15s", borderLeft: active ? `2px solid ${G}` : "2px solid transparent" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = active ? G : MUTED; }}
                title={sidebarCollapsed ? tool.label : ""}>
                <span style={{ fontSize: 14 }}>{tool.icon}</span>
                {!sidebarCollapsed && <span>{tool.label}</span>}
              </button>
            );
          })}
        </nav>
        {!sidebarCollapsed && <div style={{ padding: "10px 12px", borderTop: `1px solid ${BORDER}`, fontSize: 9, color: MUTED, fontFamily: "'Space Mono', monospace" }}>Powered by Claude AI<br />Part of JAKALA</div>}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: activeTool === "home" ? "auto" : "hidden", padding: activeTool === "home" ? 0 : "8px 20px" }}>
        {activeTool === "home"
          ? <Home onNavigate={setActiveTool} />
          : <ChatTool key={activeTool + (pipelineData[activeTool] ? "-pipe" : "")} toolId={activeTool} initialContent={pipelineData[activeTool] || null} onSendToTool={handleSendToTool} />
        }
      </div>
    </div>
  );
}
