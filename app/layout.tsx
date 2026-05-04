import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'AlphaVest — US Stock Trading Signals',
  description: 'AI-powered US stock trading recommendations powered by Google Gemini',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
