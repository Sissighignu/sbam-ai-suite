import "./globals.css";

export const metadata = {
  title: "SBAM.ai — AI-Powered Creative Suite",
  description: "La suite AI interna per il team SBAM. Radical Simplicity, superpowered by AI.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
