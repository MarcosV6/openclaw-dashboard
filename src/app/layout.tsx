import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppShell from './components/AppShell'
import ThemeProvider from './components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OpenClaw Dashboard',
  description: 'AI Usage and Interaction Dashboard',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#111827',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-body text-body`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
