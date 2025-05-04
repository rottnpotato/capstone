import type React from "react"
import type { Metadata } from "next"
import { Figtree } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const figtree = Figtree({ 
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-figtree'
})

export const metadata: Metadata = {
  title: "Pandol Cooperative - POS & Credit Management",
  description: "A member-owned financial institution with integrated POS and credit management system",
    generator: 'rottenpotato'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No need for external font import as we're using Next.js font optimization */}
      </head>
      <body className={`${figtree.className} ${figtree.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
