'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0a;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Mono', monospace;
    overflow: hidden;
  }

  .bg {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 80%, rgba(255,80,0,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 20%, rgba(255,180,0,0.05) 0%, transparent 55%),
      #0a0a0a;
    z-index: 0;
  }

  .noise {
    position: fixed;
    inset: 0;
    z-index: 1;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  .card {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 420px;
    padding: 48px 40px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 2px;
    animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .logo-area { margin-bottom: 40px; }

  .logo-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .logo-dot {
    width: 8px;
    height: 8px;
    background: #ff5000;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .logo-name {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
  }

  .headline {
    font-family: 'DM Serif Display', serif;
    font-size: 32px;
    color: #fff;
    line-height: 1.1;
    margin-bottom: 6px;
  }

  .headline em {
    font-style: italic;
    color: rgba(255,255,255,0.4);
  }

  .subtitle {
    font-size: 11px;
    color: rgba(255,255,255,0.25);
    letter-spacing: 0.05em;
    margin-top: 10px;
  }

  .divider {
    width: 32px;
    height: 1px;
    background: rgba(255,80,0,0.4);
    margin: 32px 0;
  }

  .field { margin-bottom: 16px; }

  .field label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    margin-bottom: 8px;
  }

  .field input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 2px;
    padding: 12px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    color: #fff;
    outline: none;
    transition: border-color 0.2s;
  }

  .field input:focus { border-color: rgba(255,80,0,0.5); }
  .field input::placeholder { color: rgba(255,255,255,0.15); }

  .error-msg {
    font-size: 11px;
    color: #ff5000;
    margin-bottom: 16px;
    letter-spacing: 0.03em;
    min-height: 16px;
  }

  .btn {
    width: 100%;
    padding: 13px;
    background: #ff5000;
    color: #fff;
    border: none;
    border-radius: 2px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    margin-top: 4px;
  }

  .btn:hover:not(:disabled) { background: #e04800; }
  .btn:active:not(:disabled) { transform: scale(0.99); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .footer-note {
    margin-top: 28px;
    font-size: 10px;
    color: rgba(255,255,255,0.15);
    letter-spacing: 0.05em;
    text-align: center;
    line-height: 1.6;
  }
`

function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        const from = searchParams.get('from') || '/'
        router.push(from)
      } else {
        setError('Credenziali non valide. Riprova.')
      }
    } catch {
      setError('Errore di connessione. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="logo-area">
        <div className="logo-badge">
          <div className="logo-dot" />
          <span className="logo-name">SBAM.ai</span>
        </div>
        <h1 className="headline">Accesso <em>riservato</em></h1>
        <p className="subtitle">Internal tool — solo per il team SBAM</p>
      </div>

      <div className="divider" />

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Username</label>
          <input
            type="text"
            placeholder="inserisci username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="error-msg">{error}</div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Accesso in corso...' : 'Entra →'}
        </button>
      </form>

      <p className="footer-note">
        SBAM / JAKALA — uso interno esclusivo<br />
        Non condividere le credenziali
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="bg" />
      <div className="noise" />
      <Suspense fallback={<div className="card" style={{color:'rgba(255,255,255,0.3)',fontFamily:'monospace',fontSize:'12px'}}>Caricamento...</div>}>
        <LoginForm />
      </Suspense>
    </>
  )
}
