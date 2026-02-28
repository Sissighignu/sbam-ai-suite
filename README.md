# SBAM.ai — AI-Powered Creative Suite

Suite AI interna per il team SBAM, powered by Claude (Anthropic).

## 🚀 Come metterla online (3 opzioni)

---

### Opzione 1: Vercel (consigliata — gratis, 5 minuti)

1. **Crea un account su [vercel.com](https://vercel.com)** (gratis con GitHub)

2. **Carica il progetto su GitHub:**
   ```bash
   cd sbam-ai-suite
   git init
   git add .
   git commit -m "SBAM AI Suite"
   ```
   Poi crea un repo su github.com e pusha.

3. **Collega a Vercel:**
   - Vai su [vercel.com/new](https://vercel.com/new)
   - Importa il repository GitHub
   - In "Environment Variables" aggiungi:
     - `ANTHROPIC_API_KEY` = la tua API key Anthropic
   - Clicca **Deploy**

4. **Fatto!** Avrai una URL tipo `sbam-ai-suite.vercel.app`
   - Puoi collegare un dominio custom (es. `ai.sbam.wtf`) dalle impostazioni

---

### Opzione 2: Avviare in locale (per test)

```bash
cd sbam-ai-suite
npm install
```

Crea il file `.env.local` e inserisci la tua API key:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

Avvia il server di sviluppo:
```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

### Opzione 3: Deploy su VPS/server proprio

```bash
npm install
npm run build
npm start
```

Il server parte sulla porta 3000. Usa nginx o Caddy come reverse proxy per collegare un dominio.

---

## 📁 Struttura del progetto

```
sbam-ai-suite/
├── app/
│   ├── api/chat/route.js    ← Backend: proxy sicuro verso Claude API
│   ├── globals.css           ← Stili globali
│   ├── layout.js             ← Layout root
│   └── page.js               ← Frontend: tutta la suite UI
├── public/
│   └── logo.png              ← ⚠️ METTI QUI IL LOGO SBAM
├── .env.local                ← La tua API key (NON committare!)
├── package.json
└── next.config.js
```

## ⚠️ Importante: Logo

Copia il file del logo SBAM (`Asset_5_2x.png`) nella cartella `public/` e rinominalo `logo.png`:

```bash
cp Asset_5_2x.png public/logo.png
```

## 🔑 API Key

Ottieni la tua API key Anthropic da: https://console.anthropic.com/settings/keys

La key resta **solo sul server** (nel file `.env.local` o nelle Environment Variables di Vercel). Non viene mai esposta al browser.

## 🛠 Tech Stack

- **Next.js 14** — React framework con API routes
- **Claude Sonnet 4** — AI engine via Anthropic API
- **Vercel** — hosting consigliato (gratis)
