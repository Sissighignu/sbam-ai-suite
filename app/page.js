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
C1. La net revenue stimata è superiore a 50.000€?
C2. Il costo stimato di partecipazione è commisurato alla posta in gioco? (Valutazione qualitativa: l'AI stima la complessità della gara — deliverable richiesti, timeline, risorse presumibili — e la rapporta al valore economico dell'opportunità. Non chiedere all'utente di quantificare il costo: non ha gli strumenti per farlo. Usa il dato medio di 13k solo come contesto generico, mai come stima per la gara specifica.)
C3. Le agenzie in gara sono massimo 4?
C4. La durata contrattuale è pluriennale?
C5. Le agenzie competitor sono di dimensioni e tipologia simili a SBAM?

CALCOLO PUNTEGGIO:
- Sì = 1.0x (punteggio pieno del criterio)
- Non so = 0.5x (metà punteggio)
- No = 0.0x (zero punti)
- Punteggio Area = (Peso Area / N. Criteri) × Σ(moltiplicatore di ogni criterio)
- Punteggio Totale = Punteggio A + Punteggio B + Punteggio C

FASCE SEMAFORO:
- VERDE (75-100): GO — Gara solida, partecipare con convinzione.
- GIALLO (50-74): VALUTARE — Opportunità con criticità, servono approfondimenti.
- ROSSO (0-49): NO-GO — Rischio troppo alto, meglio declinare.

DEAL-BREAKER (override automatico):
- Se le agenzie in gara sono 7 o più → NO-GO AUTOMATICO, indipendentemente dal punteggio totale. Indica una conduzione poco seria della gara da parte del cliente. In questo caso calcola comunque il punteggio per completezza, ma il semaforo è ROSSO e la raccomandazione è NO-GO. Nella raccomandazione spiega chiaramente che il numero di agenzie invitate è un segnale di scarsa serietà del processo e rende la partecipazione antieconomica.

Semaforo per singola area: stesse proporzioni (verde >75%, giallo 50-74%, rosso <50%).

FORMATO OUTPUT FINALE (usa ESATTAMENTE questo formato quando hai tutte le info):

## [EMOJI] PUNTEGGIO: [X]/100 — [COLORE] ([ETICHETTA])

### Breakdown per area
- **Commitment del Cliente**: [X]/30 [emoji semaforo]
- **Completezza Informazioni**: [X]/20 [emoji semaforo]
- **Opportunità Economica**: [X]/50 [emoji semaforo]

### Criteri critici
[Elenco dei soli criteri con risposta No o Non so, con codice, descrizione e motivazione]

### Raccomandazione
[Paragrafo di 3-5 righe con azione concreta]

Dove:
- [EMOJI]: 🟢 per verde, 🟡 per giallo, 🔴 per rosso
- [COLORE]: VERDE, GIALLO, ROSSO
- [ETICHETTA]: GO, VALUTARE, NO-GO

TONO:
- Professionale ma diretto, come un senior partner che parla al team
- Mai prolisso: ogni frase deve aggiungere valore
- Italiano
- Quando fai domande, sii specifico e concreto`;

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
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleFile = async (file) => {
    if (!file) return;
    setProcessingFile(true);
    try {
      if (file.size > 50 * 1024 * 1024) { alert("File troppo grande (max 50 MB)"); setProcessingFile(false); return; }
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      let text;
      if (isPdf) {
        text = await extractPdfText(file);
        if (text.trim().length < 50) alert("Il PDF sembra contenere principalmente immagini. Prova ad aggiungere le informazioni nel campo di testo.");
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

      {/* Header */}
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
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
          >Nuova valutazione</button>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", maxWidth: 860, width: "100%", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          {!started ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "40px 0" }}>
              <div style={{ position: "relative", marginBottom: 28 }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, background: `${G}10`, border: `1px solid ${G}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, animation: "float 3s ease-in-out infinite" }}>⚖️</div>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", fontFamily: "'Space Mono', monospace", margin: "0 0 8px", textAlign: "center" }}>Nuova gara in arrivo?</h2>
              <p style={{ color: MUTED, fontSize: 15, maxWidth: 480, textAlign: "center", lineHeight: 1.6, margin: "0 0 32px" }}>
                Carica il brief e aggiungi tutte le info che hai. Ti restituisco un punteggio su 100 con la raccomandazione go/no-go.
              </p>

              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                width: "100%", maxWidth: 520, padding: "32px 24px",
                background: uploadedFile ? `${G}08` : CARD,
                border: `2px dashed ${uploadedFile ? G : BORDER}`,
                borderRadius: 14, cursor: "pointer", transition: "all 0.25s", marginBottom: 16,
              }}
                onMouseEnter={e => { if (!uploadedFile) { e.currentTarget.style.borderColor = G; e.currentTarget.style.background = `${G}05`; } }}
                onMouseLeave={e => { if (!uploadedFile) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD; } }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = G; e.currentTarget.style.background = `${G}08`; }}
                onDragLeave={e => { if (!uploadedFile) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CARD; } }}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
              >
                <input type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,.pptx" style={{ display: "none" }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
                {processingFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 20, height: 20, border: `2px solid ${G}40`, borderTopColor: G, borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} />
                    <span style={{ color: G, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>Elaborazione in corso...</span>
                  </div>
                ) : uploadedFile ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                    <span style={{ fontSize: 28 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{uploadedFile.name}</div>
                      <div style={{ color: MUTED, fontSize: 12 }}>{formatSize(uploadedFile.size)} · Pronto per l'analisi</div>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUploadedFile(null); }}
                      style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, color: MUTED, cursor: "pointer", padding: "4px 8px", fontSize: 11 }}>✕</button>
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
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Aggiungi contesto: budget, numero agenzie, rimborso spese, relazioni col cliente, info da email o call..."
                  rows={4}
                  style={{
                    width: "100%", background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 10,
                    color: "#fff", padding: "12px 15px", fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    resize: "vertical", outline: "none", transition: "border-color 0.15s", lineHeight: 1.6,
                  }}
                  onFocus={e => e.target.style.borderColor = G}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
              </div>

              <button onClick={send} disabled={loading || (!input.trim() && !uploadedFile)}
                style={{
                  padding: "12px 32px", background: G, border: "none", borderRadius: 10,
                  cursor: loading || (!input.trim() && !uploadedFile) ? "not-allowed" : "pointer",
                  opacity: loading || (!input.trim() && !uploadedFile) ? 0.3 : 1,
                  transition: "all 0.2s", fontSize: 14, fontWeight: 700, color: "#000",
                  fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 8,
                }}>
                {loading ? (
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#000", borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} />
                ) : (
                  <>Analizza la gara →</>
                )}
              </button>

              <p style={{ color: MUTED, fontSize: 11, marginTop: 16, fontFamily: "'Space Mono', monospace", textAlign: "center" }}>
                Puoi caricare solo il brief, solo il testo, o entrambi.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
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
              <label style={{ cursor: "pointer", padding: "9px 11px", background: DARKER, border: `1px solid ${BORDER}`, borderRadius: 9, display: "flex", alignItems: "center", flexShrink: 0, transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
                <input type="file" accept=".pdf,.txt,.md,.csv,.doc,.docx,.pptx" style={{ display: "none" }} onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
                {processingFile ? <span style={{ width: 16, height: 16, border: `2px solid ${G}40`, borderTopColor: G, borderRadius: "50%", display: "block", animation: "spin 0.6s linear infinite" }} /> : <span style={{ fontSize: 16 }}>📎</span>}
              </label>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Rispondi alle domande o aggiungi nuove informazioni..."
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
        )}
      </div>

      <div style={{ textAlign: "center", padding: "6px 0", flexShrink: 0 }}>
        <span style={{ color: MUTED, fontSize: 9, fontFamily: "'Space Mono', monospace" }}>SBAM — Part of JAKALA · Powered by Claude AI · 2026</span>
      </div>
    </div>
  );
}
