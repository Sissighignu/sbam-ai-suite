"use client";

import { useState, useRef, useEffect } from "react";

const G = "#c8e64a";
const DARK = "#0a0a0a";
const DARKER = "#050505";
const CARD = "#111111";
const BORDER = "#1a1a1a";
const MUTED = "#666666";
const TEXT = "#e0e0e0";
const GREEN = "#27ae60";
const YELLOW = "#f39c12";
const RED = "#e74c3c";

const SYSTEM_PROMPT = `Sei il Pitch Screener di SBAM.ai — lo strumento interno di SBAM (agenzia creativa, part of JAKALA) per valutare le opportunità di gara.

IL TUO COMPITO:
Analizzare le informazioni fornite dall'utente (brief di gara e/o testo con contesto aggiuntivo), mappare le informazioni sui 20 criteri di valutazione, e produrre un punteggio su 100 con raccomandazione go/no-go.

FILOSOFIA SBAM:
La filosofia di SBAM è "Radical Simplicity". Non partecipare al maggior numero possibile di gare, ma selezionare con attenzione quelle giuste. Ogni gara a cui si partecipa sottrae risorse creative e organizzative al team. Dato di contesto: il costo medio di partecipazione alle gare per SBAM nel 2025 è stato di circa 13.000€, con picchi fino a 40.000€ per le gare più grandi. ATTENZIONE: questo è un dato medio statistico, NON un costo applicabile a ogni singola gara. Il costo reale varia enormemente in base a complessità dei deliverable, team coinvolto e timeline. Non citare mai questo dato come costo presunto della gara in esame.

FLUSSO DI LAVORO:
1. ACCOGLIENZA: Se l'utente non ha ancora fornito informazioni, chiedi di caricare il brief e/o descrivere la gara.
2. ANALISI SILENZIOSA: Leggi il materiale e mappa le informazioni sui 20 criteri. Per ogni criterio a cui riesci a rispondere, assegna Sì/No/Non so e annota la fonte.
3. PRESENTAZIONE INTERMEDIA: Mostra all'utente quali criteri hai compilato e quali restano scoperti. Chiedi conferma.
4. DOMANDE MIRATE: Poni domande SOLO per i criteri rimasti senza risposta. Raggruppa le domande per area. Sii diretto e conciso.
5. OUTPUT FINALE: Calcola il punteggio e produce il report strutturato.

IMPORTANTE SUL FLUSSO:
- La quantità di domande deve essere inversamente proporzionale alla qualità dell'input
- Se il brief è completo e il contesto è ricco, potresti non dover fare quasi nessuna domanda
- Non chiedere MAI informazioni che puoi dedurre dal brief
- Per i criteri a cui non riesci a rispondere e l'utente non sa rispondere, tratta come "Non so" (0.5x)

SISTEMA DI SCORING — 3 MACRO-AREE, 20 CRITERI, 100 PUNTI:

AREA A — COMMITMENT DEL CLIENTE (30 punti, 9 criteri, ~3.33 pt ciascuno):
A1. Esiste una gara reale con budget già allocato?
A2. Il cliente ha visto le credenziali di SBAM prima dell'invito?
A3. I decisori finali saranno presenti al brief?
A4. I decisori finali saranno presenti alla presentazione?
A5. Il numero di agenzie partecipanti è dichiarato?
A6. I nomi delle agenzie partecipanti sono dichiarati?
A7. Il budget a disposizione è esplicitato?
A8. È previsto un rimborso per le agenzie partecipanti?
A9. Il cliente risponde alle domande chiave su processo e criteri?

AREA B — COMPLETEZZA DELLE INFORMAZIONI (20 punti, 6 criteri, ~3.33 pt ciascuno):
B1. Gli obiettivi della gara sono chiari?
B2. L'output richiesto è chiaro e definito?
B3. I criteri di valutazione delle proposte sono dichiarati?
B4. L'effort richiesto è commisurato al tempo a disposizione?
B5. Sono fornite indicazioni per la predisposizione del budget?
B6. È possibile un confronto diretto col cliente per approfondimenti?

AREA C — OPPORTUNITÀ ECONOMICA (50 punti, 5 criteri, 10 pt ciascuno):
C1. Il budget della gara è adeguato alla tipologia di progetto richiesto?
C2. Il costo stimato di partecipazione è commisurato alla posta in gioco?
C3. Le agenzie in gara sono massimo 4?
C4. La durata contrattuale è pluriennale?
C5. Le agenzie competitor sono di dimensioni e tipologia simili a SBAM?

CALCOLO PUNTEGGIO:
- Sì = 1.0x
- Non so = 0.5x
- No = 0.0x

FASCE SEMAFORO:
- VERDE (75-100): GO
- GIALLO (50-74): VALUTARE
- ROSSO (0-49): NO-GO

DEAL-BREAKER: Se le agenzie in gara sono 7 o più → NO-GO AUTOMATICO.

FORMATO OUTPUT FINALE:
## [EMOJI] PUNTEGGIO: [X]/100 — [COLORE] ([ETICHETTA])
### Breakdown per area
### Criteri critici
### Raccomandazione
### 💡 Tips & Insight

TONO: Professionale ma diretto, italiano, conciso.`;

async function callAI(messages) {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: SYSTEM_PROMPT, messages }),
    });
    const data = await res.json();
    if (data.error) return `Errore: ${data.error}`;
    return data.text || "Nessuna risposta.";
  } catch (e) {
    return `Errore di connessione: ${e.message}`;
  }
}

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

function RichText({ text }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.7, color: TEXT, fontSize: 14 }}>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} style={{ color: G, fontSize: 15, fontWeight: 700, margin: "16px 0 6px", fontFamily: "'Space Mono', monospace" }}>{line.slice(4)}</h3>;
        if (line.startsWith("## ")) {
          const hasScore = line.match(/🟢|🟡|🔴/);
          if (hasScore) {
            const color = line.includes("🟢") ? GREEN : line.includes("🟡") ? YELLOW : RED;
            return <h2 key={i} style={{ color, fontSize: 20, fontWeight: 700, margin: "20px 0 10px", fontFamily: "'Space Mono', monospace", padding: "14px 18px", background: `${color}12`, borderRadius: 10, borderLeft: `4px solid ${color}` }}>{line.slice(3)}</h2>;
          }
          return <h2 key={i} style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "20px 0 8px", fontFamily: "'Space Mono', monospace" }}>{line.slice(3)}</h2>;
        }
        if (line.startsWith("# ")) return <h1 key={i} style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "22px 0 10px", fontFamily: "'Space Mono', monospace" }}>{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          const content = line.slice(2);
          const hasRed = content.includes("(No)");
          const hasYellow = content.includes("(Non so)");
          const indicatorColor = hasRed ? RED : hasYellow ? YELLOW : G;
          return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, paddingLeft: 8 }}><span style={{ color: indicatorColor }}>▸</span><span dangerouslySetInnerHTML={{ __html: boldify(content) }} /></div>;
        }
        if (line.startsWith("---")) return <hr key={i} style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "12px 0" }} />;
        if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
        return <p key={i} style={{ margin: "3px 0" }} dangerouslySetInnerHTML={{ __html: boldify(line) }} />;
      })}
    </div>
  );
}
function boldify(t) { return t.replace(/\*\*(.*?)\*\*/g, `<strong style="color:#fff;font-weight:600">$1</strong>`); }

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14, animation: "fadeIn 0.3s ease" }}>
      <div style={{ maxWidth: isUser ? "75%" : "92%", padding: isUser ? "11px 15px" : "18px 22px", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isUser ? `${G}15` : CARD, border: `1px solid ${isUser ? `${G}28` : BORDER}`, borderLeft: isUser ? undefined : `3px solid ${G}` }}>
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

async function generatePDF(reportText) {
  if (!window.jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210; const ML = 20, MR = 20, MT = 20;
  const contentW = W - ML - MR;
  let y = MT;
  const addPage = () => { doc.addPage(); y = MT; };
  const checkSpace = (needed) => { if (y + needed > 272) addPage(); };
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, W, 16, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(200, 230, 74);
  doc.text("SBAM.ai", ML, 10.5);
  doc.setTextColor(180, 180, 180); doc.setFont("helvetica", "normal");
  doc.text("Pitch Screener — Report di Valutazione", ML + 22, 10.5);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }), W - MR, 10.5, { align: "right" });
  y = 26;
  for (const line of reportText.split("\n")) {
    if (line.startsWith("## ")) {
      const text = line.slice(3).replace(/🟢|🟡|🔴/g, "").trim();
      checkSpace(18);
      if (line.includes("PUNTEGGIO")) {
        const color = line.includes("🟢") ? [39,174,96] : line.includes("🟡") ? [243,156,18] : [231,76,60];
        doc.setFillColor(...color);
        doc.roundedRect(ML, y, contentW, 14, 3, 3, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(255, 255, 255);
        doc.text(text, ML + contentW / 2, y + 9.5, { align: "center" });
        y += 20;
      } else {
        doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(15, 52, 96);
        doc.text(text, ML, y + 5); y += 10;
        doc.setDrawColor(200, 230, 74); doc.setLineWidth(0.5); doc.line(ML, y - 3, ML + 30, y - 3);
      }
    } else if (line.startsWith("### ")) {
      checkSpace(12);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(26, 26, 46);
      doc.text(line.slice(4).replace(/💡/g, "").trim(), ML, y + 5); y += 10;
    } else if (line.startsWith("- ")) {
      checkSpace(10);
      const content = line.slice(2).replace(/\*\*/g, "");
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      const sl = doc.splitTextToSize("• " + content, contentW - 5);
      doc.text(sl, ML + 3, y + 4); y += sl.length * 4.5 + 2;
    } else if (line.trim() && !line.startsWith("---")) {
      checkSpace(8);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      const sl = doc.splitTextToSize(line.replace(/\*\*/g, ""), contentW);
      doc.text(sl, ML, y + 4); y += sl.length * 4.5 + 1;
    }
  }
  y += 8;
  doc.setDrawColor(220, 220, 220); doc.line(ML, y, W - MR, y); y += 6;
  doc.setFontSize(7); doc.setTextColor(150, 150, 150);
  doc.text("SBAM — Part of JAKALA · Pitch Screener powered by Claude AI", ML, y);
  doc.save("SBAM_PitchScreener_Report.pdf");
}

function DownloadButton({ reportText }) {
  const [generating, setGenerating] = useState(false);
  const handleClick = async () => { setGenerating(true); try { await generatePDF(reportText); } catch (e) { alert("Errore PDF."); } setGenerating(false); };
  return (
    <button onClick={handleClick} disabled={generating}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `${G}15`, border: `1px solid ${G}40`, borderRadius: 8, color: G, fontSize: 12, fontFamily: "'Space Mono', monospace", cursor: generating ? "wait" : "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.background = `${G}25`; e.currentTarget.style.borderColor = G; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${G}15`; e.currentTarget.style.borderColor = `${G}40`; }}>
      {generating ? "⏳ Generazione..." : "📥 Scarica Report PDF"}
    </button>
  );
}

const MAIL_SYSTEM_PROMPT = `Sei un membro del team SBAM che scrive una mail informale al board per presentare una nuova opportunità di gara. Formato: Oggetto + corpo. Tono informale, un pizzico di ironia, concisa, in italiano. Scrivi SOLO il testo della mail.`;

function BoardMailButton({ reportText }) {
  const [state, setState] = useState("idle");
  const [mailText, setMailText] = useState("");
  const [copied, setCopied] = useState(false);
  const handleGenerate = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: MAIL_SYSTEM_PROMPT, messages: [{ role: "user", content: `Scrivi la mail per il board basandoti su questo report:\n\n${reportText}` }] }) });
      const data = await res.json();
      if (data.error) { alert(data.error); setState("idle"); return; }
      setMailText(data.text || "Errore."); setState("done");
    } catch (e) { alert("Errore."); setState("idle"); }
  };
  const handleCopy = () => { navigator.clipboard.writeText(mailText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  if (state === "done") return (
    <div style={{ marginTop: 10, animation: "fadeIn 0.3s ease" }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px", maxWidth: "92%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: G }}>✉️ MAIL PER IL BOARD</span>
          <button onClick={handleCopy} style={{ padding: "5px 12px", background: copied ? `${GREEN}20` : `${G}15`, border: `1px solid ${copied ? GREEN : `${G}40`}`, borderRadius: 6, color: copied ? GREEN : G, fontSize: 11, fontFamily: "'Space Mono', monospace", cursor: "pointer" }}>{copied ? "✓ Copiato!" : "📋 Copia"}</button>
        </div>
        <div style={{ color: TEXT, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", background: DARKER, borderRadius: 8, padding: "14px 16px", border: `1px solid ${BORDER}`, maxHeight: 400, overflowY: "auto" }}>{mailText}</div>
      </div>
    </div>
  );
  return (
    <button onClick={handleGenerate} disabled={state === "loading"}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `${G}15`, border: `1px solid ${G}40`, borderRadius: 8, color: G, fontSize: 12, fontFamily: "'Space Mono', monospace", cursor: state === "loading" ? "wait" : "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.background = `${G}25`; e.currentTarget.style.borderColor = G; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${G}15`; e.currentTarget.style.borderColor = `${G}40`; }}>
      {state === "loading" ? "⏳ Generazione mail..." : "✉️ Genera mail per il board"}
    </button>
  );
}

function LoadingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
      <div style={{ padding: "14px 20px", borderRadius: "14px 14px 14px 4px", background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${G}` }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[0, 0.15, 0.3].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: G, animation: `pulse 1s ease-in-out ${d}s infinite` }} />)}
          <span style={{ color: MUTED, fontSize: 11, marginLeft: 6, fontFamily: "'Space Mono', monospace" }}>Sto analizzando...</span>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [started, setStarted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("sbam_auth") !== "ok") {
        window.location.href = "/login";
      } else {
        setAuthed(true);
      }
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  if (!authed) return null;

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
    if (uploadedFile) { fullContent += `[Contenuto del brief: "${uploadedFile.name}"]\n${uploadedFile.text}\n\n`; fileName = uploadedFile.name; }
    if (trimmed) fullContent += `[Contesto aggiuntivo fornito dall'utente]\n${trimmed}`;
    const userMsg = { role: "user", content: fullContent, displayText: displayText || "(Brief caricato)", fileName };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput(""); setUploadedFile(null); setLoading(true); setStarted(true);
    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
    const reply = await callAI(apiMessages);
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const formatSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
  const resetSession = () => { setMessages([]); setUploadedFile(null); setInput(""); setStarted(false); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: DARK, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0.25; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
        ::selection { background: ${G}33; color: #fff; }
      `}</style>

      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: DARKER }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <img src="/logo.png" alt="SBAM" style={{ height: 22, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 14, color: G, opacity: 0.65 }}>.ai</span>
        </div>
        <div style={{ width: 1, height: 20, background: BORDER }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚖️</span>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Space Mono', monospace", margin: 0 }}>Pitch Screener</h1>
            <p style={{ color: MUTED, fontSize: 10, margin: 0, fontFamily: "'Space Mono', monospace" }}>Sistema di valutazione gare</p>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {started && (
          <button onClick={resetSession}
            style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, cursor: "pointer", padding: "5px 12px", fontSize: 11, fontFamily: "'Space Mono', monospace", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
            Nuova valutazione
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: 860, width: "100%", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {!started ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "40px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: `${G}10`, border: `1px solid ${G}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, animation: "float 3s ease-in-out infinite", marginBottom: 28 }}>⚖️</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "'Space Mono', monospace", margin: "0 0 8px", textAlign: "center" }}>Nuova gara in arrivo?</h2>
              <p style={{ color: MUTED, fontSize: 15, maxWidth: 480, textAlign: "center", lineHeight: 1.6, margin: "0 0 32px" }}>
                Carica il brief e aggiungi tutte le info che hai. Ti restituisco un punteggio su 100 con la raccomandazione go/no-go.
              </p>
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: 520, padding: "32px 24px", background: uploadedFile ? `${G}08` : CARD, border: `2px dashed ${uploadedFile ? G : BORDER}`, borderRadius: 14, cursor: "pointer", transition: "all 0.25s", marginBottom: 16 }}
                onMouseEnter={e => { if (!uploadedFile) { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = `${G}05`; } }}
                onMouseLeave={e => { if (!uploadedFile) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD; } }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = G; }}
                onDragLeave={e => { if (!uploadedFile) e.currentTarget.style.borderColor = BORDER; }}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}>
                <input type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,.pptx" style={{ display: "none" }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
                {processingFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 20, height: 20, border: `2px solid ${G}40`, borderTopColor: G, borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} />
                    <span style={{ color: G, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>Elaborazione...</span>
                  </div>
                ) : uploadedFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                    <span style={{ fontSize: 28 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{uploadedFile.name}</div>
                      <div style={{ color: MUTED, fontSize: 12 }}>{formatSize(uploadedFile.size)} · Pronto per l'analisi</div>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUploadedFile(null); }} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, cursor: "pointer", padding: "4px 8px", fontSize: 11 }}>✕</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: 32, marginBottom: 10, opacity: 0.6 }}>📎</span>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Carica il brief della gara</span>
                    <span style={{ color: MUTED, fontSize: 12 }}>PDF, Word, TXT — oppure trascina qui</span>
                  </>
                )}
              </label>
              <div style={{ width: "100%", maxWidth: 520, marginBottom: 16 }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Aggiungi contesto: budget, numero agenzie, rimborso spese, relazioni col cliente..."
                  rows={4}
                  style={{ width: "100%", background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 10, color: "#fff", padding: "12px 15px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "vertical", outline: "none", transition: "border-color 0.15s", lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = BORDER} />
              </div>
              <button onClick={send} disabled={loading || (!input.trim() && !uploadedFile)}
                style={{ padding: "12px 32px", background: G, border: "none", borderRadius: 10, cursor: loading || (!input.trim() && !uploadedFile) ? "not-allowed" : "pointer", opacity: loading || (!input.trim() && !uploadedFile) ? 0.3 : 1, transition: "all 0.2s", fontSize: 14, fontWeight: 700, color: "#000", fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 8 }}>
                {loading ? <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} /> : <>Analizza la gara →</>}
              </button>
              <p style={{ color: MUTED, fontSize: 11, marginTop: 16, fontFamily: "'Space Mono', monospace", textAlign: "center" }}>Puoi caricare solo il brief, solo il testo, o entrambi.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isLastAssistant = msg.role === "assistant" && !messages.slice(i + 1).some(m => m.role === "assistant");
                const hasScore = msg.role === "assistant" && msg.content && msg.content.includes("PUNTEGGIO:");
                return (
                  <div key={i}>
                    <ChatMessage msg={msg} />
                    {isLastAssistant && hasScore && !loading && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, marginTop: -4 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <DownloadButton reportText={msg.content} />
                          <BoardMailButton reportText={msg.content} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {loading && <LoadingBubble />}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {started && (
          <div style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}`, padding: "10px 0 6px" }}>
            {uploadedFile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: `${G}08`, border: `1px solid ${G}20`, borderRadius: 7, marginBottom: 8, fontSize: 12 }}>
                <span>📄</span>
                <span style={{ color: "#fff", flex: 1 }}>{uploadedFile.name} <span style={{ color: MUTED }}>({formatSize(uploadedFile.size)})</span></span>
                <button onClick={() => setUploadedFile(null)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}>✕</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
              <label style={{ cursor: "pointer", padding: "9px 11px", background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 9, display: "flex", alignItems: "center", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G} onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                <input type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,.pptx" style={{ display: "none" }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
                {processingFile ? <span style={{ width: 16, height: 16, border: `2px solid ${G}40`, borderTopColor: G, borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} /> : <span style={{ fontSize: 16 }}>📎</span>}
              </label>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Rispondi alle domande o aggiungi nuove informazioni..."
                rows={Math.min(input.split("\n").length, 4) || 1}
                style={{ flex: 1, background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 9, color: "#fff", padding: "9px 13px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: "none", outline: "none", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = G} onBlur={e => e.target.style.borderColor = BORDER} />
              <button onClick={send} disabled={loading || (!input.trim() && !uploadedFile)}
                style={{ padding: "9px 14px", background: G, border: "none", borderRadius: 9, cursor: loading || (!input.trim() && !uploadedFile) ? "not-allowed" : "pointer", opacity: loading || (!input.trim() && !uploadedFile) ? 0.25 : 1, display: "flex", alignItems: "center", flexShrink: 0 }}>
                {loading ? <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} /> : <span style={{ fontSize: 16, color: "#000", fontWeight: 700 }}>↑</span>}
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <span style={{ color: MUTED, fontSize: 9, fontFamily: "'Space Mono', monospace" }}>Shift+Enter per andare a capo · Enter per inviare</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", padding: "6px 0", flexShrink: 0 }}>
        <span style={{ color: MUTED, fontSize: 9, fontFamily: "'Space Mono', monospace" }}>SBAM — Part of JAKALA · Powered by Claude AI · 2026</span>
      </div>
    </div>
  );
}
