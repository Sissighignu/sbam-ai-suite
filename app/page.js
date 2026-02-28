"use client";

import { useState } from "react";

const G = "#c8e64a";
const DARK = "#0a0a0a";
const DARKER = "#050505";
const CARD = "#111111";
const BORDER = "#1a1a1a";
const MUTED = "#666666";
const TEXT = "#e0e0e0";

// ─── Secure API call through our backend ───
async function callAI(system, message, file = null) {
  try {
    const body = { system, message };
    if (file) body.file = file;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error) return `Errore: ${data.error}`;
    return data.text || "Nessuna risposta.";
  } catch (e) {
    return `Errore di connessione: ${e.message}`;
  }
}

// ─── File to base64 helper ───
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Errore lettura file"));
    reader.readAsDataURL(file);
  });
}

// ─── Read text from non-PDF files ───
function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Errore lettura file"));
    reader.readAsText(file);
  });
}

// ─── File Upload Component ───
function FileUpload({ onFileReady, uploadedFile, onClear }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = { current: null };

  const ACCEPTED = ".pdf,.txt,.md,.csv,.doc,.docx,.pptx,.rtf";

  const processFile = async (file) => {
    if (!file) return;
    setProcessing(true);
    try {
      // Check file size (max 25MB for PDF, 10MB for text)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        alert(`File troppo grande (${(file.size / 1048576).toFixed(1)} MB). Il limite è 25 MB. Prova a comprimere il PDF.`);
        setProcessing(false);
        return;
      }

      const isPdf = file.type === "application/pdf";
      const isText = file.type.startsWith("text/") || [".txt", ".md", ".csv", ".rtf"].some(ext => file.name.toLowerCase().endsWith(ext));

      if (isPdf) {
        const base64 = await fileToBase64(file);
        onFileReady({
          fileName: file.name,
          fileSize: file.size,
          mediaType: "application/pdf",
          base64,
          extractedText: null,
        });
      } else if (isText) {
        const text = await fileToText(file);
        onFileReady({
          fileName: file.name,
          fileSize: file.size,
          mediaType: file.type || "text/plain",
          base64: null,
          extractedText: text,
        });
      } else {
        // Try reading as text for Word/PPT (basic extraction)
        try {
          const text = await fileToText(file);
          onFileReady({
            fileName: file.name,
            fileSize: file.size,
            mediaType: file.type,
            base64: null,
            extractedText: text,
          });
        } catch {
          // Fallback: send as base64 for Claude to try
          const base64 = await fileToBase64(file);
          onFileReady({
            fileName: file.name,
            fileSize: file.size,
            mediaType: file.type || "application/octet-stream",
            base64,
            extractedText: null,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  const handleSelect = (e) => {
    const file = e.target?.files?.[0];
    if (file) processFile(file);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (uploadedFile) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
        background: `${G}08`, border: `1px solid ${G}30`, borderRadius: 10,
        marginBottom: 12,
      }}>
        <span style={{ fontSize: 22 }}>
          {uploadedFile.mediaType === "application/pdf" ? "📄" : "📝"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{uploadedFile.fileName}</div>
          <div style={{ color: MUTED, fontSize: 12 }}>
            {formatSize(uploadedFile.fileSize)}
            {uploadedFile.mediaType === "application/pdf" && " · PDF — verrà inviato nativamente a Claude"}
            {uploadedFile.extractedText && ` · ${uploadedFile.extractedText.length.toLocaleString()} caratteri estratti`}
          </div>
        </div>
        <button onClick={onClear} style={{
          background: "none", border: `1px solid ${BORDER}`, borderRadius: 6,
          color: MUTED, cursor: "pointer", padding: "4px 10px", fontSize: 12,
          fontFamily: "'Space Mono', monospace",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER; }}
        >✕ Rimuovi</button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-upload-input")?.click()}
      style={{
        border: `2px dashed ${dragging ? G : BORDER}`,
        borderRadius: 10,
        padding: "20px 16px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? `${G}08` : DARKER,
        transition: "all 0.2s",
        marginBottom: 12,
      }}
      onMouseEnter={(e) => { if (!dragging) e.currentTarget.style.borderColor = G + "60"; }}
      onMouseLeave={(e) => { if (!dragging) e.currentTarget.style.borderColor = BORDER; }}
    >
      <input
        id="file-upload-input"
        type="file"
        accept={ACCEPTED}
        onChange={handleSelect}
        style={{ display: "none" }}
      />
      {processing ? (
        <div style={{ color: G, fontSize: 14 }}>
          <span style={{ display: "inline-block", width: 16, height: 16, border: `2px solid ${G}40`, borderTopColor: G, borderRadius: "50%", animation: "spin 0.6s linear infinite", marginRight: 8, verticalAlign: "middle" }} />
          Elaborazione file...
        </div>
      ) : (
        <>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
          <div style={{ color: MUTED, fontSize: 13 }}>
            <span style={{ color: G, fontWeight: 600 }}>Carica un file</span> o trascinalo qui
          </div>
          <div style={{ color: MUTED, fontSize: 11, marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
            PDF, TXT, DOC, DOCX, PPTX, CSV
          </div>
        </>
      )}
    </div>
  );
}

// ─── Rich Text Renderer ───
function RichText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div style={{ lineHeight: 1.7, color: TEXT }}>
      {lines.map((line, i) => {
        if (line.startsWith("### "))
          return <h3 key={i} style={{ color: G, fontSize: 16, fontWeight: 700, margin: "20px 0 8px", fontFamily: "'Space Mono', monospace" }}>{line.slice(4)}</h3>;
        if (line.startsWith("## "))
          return <h2 key={i} style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "24px 0 10px", fontFamily: "'Space Mono', monospace" }}>{line.slice(3)}</h2>;
        if (line.startsWith("# "))
          return <h1 key={i} style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "28px 0 12px", fontFamily: "'Space Mono', monospace" }}>{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("• "))
          return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 8 }}><span style={{ color: G }}>▸</span><span dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} /></div>;
        if (line.startsWith("---"))
          return <hr key={i} style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "16px 0" }} />;
        if (line.trim() === "") return <div key={i} style={{ height: 10 }} />;
        return <p key={i} style={{ margin: "4px 0" }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
      })}
    </div>
  );
}
function boldify(t) {
  return t.replace(/\*\*(.*?)\*\*/g, `<strong style="color:#fff;font-weight:600">$1</strong>`);
}

// ─── Shared Components ───
function TextArea({ value, onChange, placeholder, rows = 8 }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#fff", padding: "14px 16px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
      onFocus={(e) => (e.target.style.borderColor = G)} onBlur={(e) => (e.target.style.borderColor = BORDER)} />
  );
}

function Input({ value, onChange, placeholder, style: extraStyle = {} }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ flex: 1, background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#fff", padding: "10px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", ...extraStyle }}
      onFocus={(e) => (e.target.style.borderColor = G)} onBlur={(e) => (e.target.style.borderColor = BORDER)} />
  );
}

function Btn({ onClick, loading, children, variant = "primary", disabled }) {
  const p = variant === "primary";
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{ padding: "12px 28px", background: p ? G : "transparent", color: p ? "#000" : G, border: p ? "none" : `1px solid ${G}`, borderRadius: 8, fontWeight: 700, fontSize: 14, fontFamily: "'Space Mono', monospace", cursor: loading || disabled ? "not-allowed" : "pointer", opacity: loading || disabled ? 0.5 : 1, transition: "all 0.2s", letterSpacing: "0.5px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
      {loading && <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} />}
      {children}
    </button>
  );
}

function ResultBox({ result, title }) {
  if (!result) return null;
  return (
    <div style={{ marginTop: 24, padding: 24, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, borderLeft: `3px solid ${G}`, animation: "fadeIn 0.4s ease" }}>
      {title && <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: G, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{title}</div>}
      <RichText text={result} />
    </div>
  );
}

function ToolHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'Space Mono', monospace", margin: 0 }}>{title}</h2>
      </div>
      <p style={{ color: MUTED, fontSize: 14, margin: 0, paddingLeft: 42 }}>{subtitle}</p>
    </div>
  );
}

// ─── TOOL 1: Brief Analyzer ───
function BriefAnalyzer() {
  const [brief, setBrief] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const analyze = async () => {
    setLoading(true); setResult("");
    const sys = `Sei un senior strategist di SBAM, agenzia creativa part of JAKALA. Analizzi brief di clienti con occhio critico e costruttivo.\nRispondi SEMPRE in italiano. Usa questo formato:\n\n## Sintesi del Brief\n(riassumi in 2-3 righe l'essenza della richiesta)\n\n## Insight Chiave\n(3-5 insight strategici che emergono dal brief)\n\n## Gap & Domande Critiche\n(cosa manca nel brief? quali informazioni servono?)\n\n## Opportunità Nascoste\n(cosa il cliente non ha chiesto ma potrebbe volere)\n\n## Red Flags\n(potenziali rischi o ambiguità da chiarire subito)\n\n## Prossimi Step Consigliati\n(azioni concrete per procedere)\n\nSii diretto, concreto, e usa il linguaggio tipico di un'agenzia creativa italiana top.`;

    let userMsg = "Analizza questo brief cliente:\n\n";
    if (uploadedFile?.extractedText) userMsg += `[Contenuto del file "${uploadedFile.fileName}"]\n${uploadedFile.extractedText}\n\n`;
    if (brief.trim()) userMsg += brief;

    const filePayload = (uploadedFile?.base64 && uploadedFile.mediaType === "application/pdf")
      ? { base64: uploadedFile.base64, mediaType: uploadedFile.mediaType, fileName: uploadedFile.fileName }
      : null;

    const res = await callAI(sys, userMsg, filePayload);
    setResult(res); setLoading(false);
  };
  const hasContent = brief.trim() || uploadedFile;
  return (
    <div>
      <ToolHeader icon="🔍" title="Brief Analyzer" subtitle="Carica un brief (PDF o testo) → estrai insight, gap e domande chiave" />
      <FileUpload uploadedFile={uploadedFile} onFileReady={setUploadedFile} onClear={() => setUploadedFile(null)} />
      <TextArea value={brief} onChange={setBrief} placeholder={uploadedFile ? "Aggiungi note o contesto aggiuntivo (opzionale)..." : "Oppure incolla qui il brief del cliente..."} rows={uploadedFile ? 4 : 10} />
      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <Btn onClick={analyze} loading={loading} disabled={!hasContent}>Analizza Brief</Btn>
        {hasContent && <Btn variant="secondary" onClick={() => { setBrief(""); setResult(""); setUploadedFile(null); }}>Reset</Btn>}
      </div>
      <ResultBox result={result} title="Analisi del Brief" />
    </div>
  );
}

// ─── TOOL 2: Strategy Generator ───
function StrategyGenerator() {
  const [brief, setBrief] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [industry, setIndustry] = useState("");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setResult("");
    const sys = `Sei il Chief Strategy Officer di SBAM (part of JAKALA). Generi proposte strategiche complete partendo da brief.\nRispondi SEMPRE in italiano. Il tuo approccio è "Radical Simplicity": idee semplici, forti, che fanno parlare.\n\nUsa questo formato:\n\n## Executive Summary\n(la strategia in 3 righe)\n\n## Target Audience\n### Primario\n(descrizione dettagliata, insight comportamentali)\n### Secondario\n(audience secondaria)\n\n## Posizionamento & Tone of Voice\n(come il brand deve posizionarsi e parlare)\n\n## Strategia Canali\n(quali canali usare e perché, con priorità)\n\n## Big Idea\n(il concept creativo centrale — simple & loud)\n\n## Pillar di Comunicazione\n(3-4 pillar tematici su cui costruire i contenuti)\n\n## KPI Suggeriti\n(metriche concrete per misurare il successo)\n\n## Timeline Indicativa\n(macro fasi del progetto)\n\nSii ambizioso ma realistico. Pensa come un'agenzia che deve vincere la gara.`;

    let userMsg = "";
    if (uploadedFile?.extractedText) userMsg += `[Contenuto del file "${uploadedFile.fileName}"]\n${uploadedFile.extractedText}\n\n`;
    if (brief.trim()) userMsg += `Brief: ${brief}\n`;
    if (industry) userMsg += `Settore: ${industry}\n`;
    if (budget) userMsg += `Budget indicativo: ${budget}\n`;

    const filePayload = (uploadedFile?.base64 && uploadedFile.mediaType === "application/pdf")
      ? { base64: uploadedFile.base64, mediaType: uploadedFile.mediaType, fileName: uploadedFile.fileName }
      : null;

    const res = await callAI(sys, userMsg, filePayload);
    setResult(res); setLoading(false);
  };
  const hasContent = brief.trim() || uploadedFile;
  return (
    <div>
      <ToolHeader icon="🎯" title="Strategy Generator" subtitle="Dal brief alla proposta strategica con target, tone of voice e canali" />
      <FileUpload uploadedFile={uploadedFile} onFileReady={setUploadedFile} onClear={() => setUploadedFile(null)} />
      <TextArea value={brief} onChange={setBrief} placeholder={uploadedFile ? "Aggiungi contesto o indicazioni aggiuntive..." : "Inserisci il brief o il contesto del progetto..."} rows={uploadedFile ? 4 : 8} />
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Input value={industry} onChange={setIndustry} placeholder="Settore (es. Fashion, Food...)" />
        <Input value={budget} onChange={setBudget} placeholder="Budget (opzionale)" />
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn onClick={generate} loading={loading} disabled={!hasContent}>Genera Strategia</Btn>
      </div>
      <ResultBox result={result} title="Proposta Strategica" />
    </div>
  );
}

// ─── TOOL 3: Competitor & Trend Scanner ───
function CompetitorScanner() {
  const [brand, setBrand] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [competitors, setCompetitors] = useState("");
  const [sector, setSector] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const scan = async () => {
    setLoading(true); setResult("");
    const sys = `Sei un senior strategist di SBAM specializzato in competitive intelligence e trend analysis per il mercato italiano ed europeo.\nRispondi SEMPRE in italiano. Analizza il panorama competitivo e i trend rilevanti.\n\nUsa questo formato:\n\n## Overview del Mercato\n(contesto e dinamiche principali del settore)\n\n## Analisi Competitor\n(per ogni competitor: posizionamento, punti di forza, debolezze, strategia di comunicazione)\n\n## Trend Rilevanti\n### Macro Trend\n(trend di settore a livello macro)\n### Micro Trend\n(trend emergenti e nicchie da esplorare)\n### Trend Social & Content\n(cosa funziona in comunicazione nel settore)\n\n## White Space & Opportunità\n(dove i competitor non sono presenti? dove c'è spazio?)\n\n## Minacce\n(rischi competitivi da monitorare)\n\n## Raccomandazioni per il Brand\n(come differenziarsi concretamente)\n\nBasa la tua analisi sulla tua conoscenza del mercato. Sii specifico e azionabile.`;

    let userMsg = "";
    if (uploadedFile?.extractedText) userMsg += `[Contenuto del file "${uploadedFile.fileName}"]\n${uploadedFile.extractedText}\n\n`;
    userMsg += `Brand/Azienda: ${brand}\n`;
    if (competitors) userMsg += `Competitor principali: ${competitors}\n`;
    if (sector) userMsg += `Settore: ${sector}\n`;

    const filePayload = (uploadedFile?.base64 && uploadedFile.mediaType === "application/pdf")
      ? { base64: uploadedFile.base64, mediaType: uploadedFile.mediaType, fileName: uploadedFile.fileName }
      : null;

    const res = await callAI(sys, userMsg, filePayload);
    setResult(res); setLoading(false);
  };
  return (
    <div>
      <ToolHeader icon="📡" title="Competitor & Trend Scanner" subtitle="Analisi competitor e trend di settore dal brief" />
      <FileUpload uploadedFile={uploadedFile} onFileReady={setUploadedFile} onClear={() => setUploadedFile(null)} />
      <Input value={brand} onChange={setBrand} placeholder="Brand o azienda da analizzare" style={{ width: "100%", marginBottom: 12, flex: "none" }} />
      <div style={{ display: "flex", gap: 12 }}>
        <Input value={competitors} onChange={setCompetitors} placeholder="Competitor noti (opzionale)" />
        <Input value={sector} onChange={setSector} placeholder="Settore" />
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn onClick={scan} loading={loading} disabled={!brand.trim()}>Scansiona Mercato</Btn>
      </div>
      <ResultBox result={result} title="Analisi Competitiva & Trend" />
    </div>
  );
}

// ─── TOOL 4: Creative Concept Generator ───
function CreativeConceptGen() {
  const [strategy, setStrategy] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [constraints, setConstraints] = useState("");
  const [numConcepts, setNumConcepts] = useState("3");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true); setResult("");
    const sys = `Sei il Chief Creative Officer di SBAM. Generi concept creativi brillanti, semplici e impattanti, seguendo la filosofia "Radical Simplicity".\nRispondi SEMPRE in italiano. Genera ${numConcepts} concept creativi distinti. Per ciascuno usa questo formato:\n\n### Concept [N]: [Nome del Concept]\n\n**La Big Idea in una frase**\n(il concept sintetizzato in modo memorabile)\n\n**Insight di partenza**\n(l'insight umano/culturale su cui si basa)\n\n**Esecuzione**\n(come prende vita concretamente: canali, formati, meccaniche)\n\n**Headline/Claim**\n(proposta di headline o claim principale)\n\n**Tono**\n(registro comunicativo)\n\n**Perché funziona**\n(motivazione strategica)\n\n---\n\nSii audace, sorprendente, culturalmente rilevante. I concept devono essere "simple & loud" — facili da capire, impossibili da ignorare.`;

    let userMsg = "Strategia/Brief di partenza:\n";
    if (uploadedFile?.extractedText) userMsg += `[Contenuto del file "${uploadedFile.fileName}"]\n${uploadedFile.extractedText}\n\n`;
    if (strategy.trim()) userMsg += strategy;
    if (constraints) userMsg += `\n\nVincoli/Note: ${constraints}`;

    const filePayload = (uploadedFile?.base64 && uploadedFile.mediaType === "application/pdf")
      ? { base64: uploadedFile.base64, mediaType: uploadedFile.mediaType, fileName: uploadedFile.fileName }
      : null;

    const res = await callAI(sys, userMsg, filePayload);
    setResult(res); setLoading(false);
  };
  const hasContent = strategy.trim() || uploadedFile;
  return (
    <div>
      <ToolHeader icon="💡" title="Creative Concept Generator" subtitle="Genera concept creativi a partire dalla strategia — Simple & Loud" />
      <FileUpload uploadedFile={uploadedFile} onFileReady={setUploadedFile} onClear={() => setUploadedFile(null)} />
      <TextArea value={strategy} onChange={setStrategy} placeholder={uploadedFile ? "Aggiungi indicazioni o contesto aggiuntivo..." : "Incolla la strategia o il brief su cui generare i concept..."} rows={uploadedFile ? 4 : 8} />
      <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
        <Input value={constraints} onChange={setConstraints} placeholder="Vincoli o note aggiuntive (opzionale)" />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: MUTED, fontSize: 13, fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>N° concept:</span>
          <select value={numConcepts} onChange={(e) => setNumConcepts(e.target.value)}
            style={{ background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#fff", padding: "10px 12px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "pointer" }}>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <Btn onClick={generate} loading={loading} disabled={!hasContent}>Genera Concept</Btn>
      </div>
      <ResultBox result={result} title="Concept Creativi" />
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

// ─── Home Page ───
function Home({ onNavigate }) {
  const cards = [
    { id: "brief", icon: "🔍", title: "Brief Analyzer", desc: "Analizza brief clienti, estrai insight strategici, identifica gap e domande chiave.", tag: "ANALYSIS" },
    { id: "strategy", icon: "🎯", title: "Strategy Generator", desc: "Dal brief alla proposta strategica completa: target, posizionamento, canali, KPI.", tag: "STRATEGY" },
    { id: "competitor", icon: "📡", title: "Competitor & Trend Scanner", desc: "Scansiona il mercato: analisi competitor, trend emergenti, white space.", tag: "INTELLIGENCE" },
    { id: "creative", icon: "💡", title: "Creative Concept Generator", desc: "Genera concept creativi Simple & Loud a partire dalla strategia.", tag: "CREATIVE" },
  ];
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "60px 20px 50px", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, height: 400, background: `radial-gradient(circle, ${G}08 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: G, letterSpacing: 4, textTransform: "uppercase", marginBottom: 20 }}>AI-Powered Creative Suite</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <img src="/logo.png" alt="SBAM" style={{ height: 52, objectFit: "contain" }} />
          <span style={{ fontSize: 48, fontWeight: 800, color: G, fontFamily: "'Space Mono', monospace", opacity: 0.6 }}>.ai</span>
        </div>
        <p style={{ fontSize: 18, color: MUTED, maxWidth: 500, margin: "0 auto 8px", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>La suite AI interna per il team SBAM.</p>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>Radical Simplicity, superpowered by AI.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, padding: "0 20px" }}>
        {cards.map((card) => (
          <div key={card.id} onClick={() => onNavigate(card.id)}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28, cursor: "pointer", transition: "all 0.25s ease", position: "relative", overflow: "hidden" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${G}15`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: G, letterSpacing: 2, marginBottom: 14 }}>{card.tag}</div>
            <div style={{ fontSize: 30, marginBottom: 12 }}>{card.icon}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px", fontFamily: "'Space Mono', monospace" }}>{card.title}</h3>
            <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
            <div style={{ position: "absolute", bottom: 16, right: 20, color: G, fontSize: 20, opacity: 0.5 }}>→</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", padding: "50px 20px 30px", color: MUTED, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
        SBAM — Part of JAKALA · AI Suite Internal Tool · 2026
      </div>
    </div>
  );
}

// ─── Main App ───
export default function Page() {
  const [activeTool, setActiveTool] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderTool = () => {
    switch (activeTool) {
      case "brief": return <BriefAnalyzer />;
      case "strategy": return <StrategyGenerator />;
      case "competitor": return <CompetitorScanner />;
      case "creative": return <CreativeConceptGen />;
      default: return <Home onNavigate={setActiveTool} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: DARK, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 60 : 220, background: DARKER, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", transition: "width 0.25s ease", flexShrink: 0 }}>
        <div style={{ padding: sidebarCollapsed ? "20px 10px" : "20px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 65 }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src="/logo.png" alt="SBAM" style={{ height: 22, objectFit: "contain" }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14, color: G, opacity: 0.7 }}>.ai</span>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 16, padding: 4, display: "flex", margin: sidebarCollapsed ? "0 auto" : 0 }}>
            {sidebarCollapsed ? "▶" : "◀"}
          </button>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {TOOLS.map((tool) => {
            const active = activeTool === tool.id;
            return (
              <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: sidebarCollapsed ? "10px 0" : "10px 12px",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  background: active ? `${G}12` : "transparent",
                  border: "none", borderRadius: 8,
                  color: active ? G : MUTED,
                  cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono', monospace",
                  fontWeight: active ? 700 : 400, marginBottom: 4, transition: "all 0.15s",
                  borderLeft: active ? `2px solid ${G}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = active ? G : MUTED; }}
                title={sidebarCollapsed ? tool.label : ""}>
                <span style={{ fontSize: 16 }}>{tool.icon}</span>
                {!sidebarCollapsed && <span>{tool.label}</span>}
              </button>
            );
          })}
        </nav>
        {!sidebarCollapsed && (
          <div style={{ padding: "16px 18px", borderTop: `1px solid ${BORDER}`, fontSize: 10, color: MUTED, fontFamily: "'Space Mono', monospace" }}>
            Powered by Claude AI<br />Part of JAKALA
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto", padding: activeTool === "home" ? 0 : "32px 40px" }}>
        <div style={{ maxWidth: activeTool === "home" ? "100%" : 800, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
          {renderTool()}
        </div>
      </div>
    </div>
  );
}
