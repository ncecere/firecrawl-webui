import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Firecrawl WebUI',
  description: 'Firecrawl WebUI',
  generator: 'bitop.dev',
  icons: {
    icon: '/firecrawl-webui.png',
    shortcut: '/firecrawl-webui.png',
    apple: '/firecrawl-webui.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
