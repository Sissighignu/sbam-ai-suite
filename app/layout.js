import "./globals.css";

export const metadata = {
  title: "SBAM.ai — Pitch Screener",
  description: "Valuta le opportunità di gara con il sistema di scoring SBAM. Upload del brief, analisi AI, punteggio su 100.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
