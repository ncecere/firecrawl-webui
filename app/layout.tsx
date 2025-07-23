import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Firecrawl WebUI',
  description: 'Firecrawl WebUI',
  generator: 'bitop.dev',
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
