import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
