import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { SimulationProvider } from "./context/SimulationContext"
import "./globals.css"

export const metadata: Metadata = {
  title: "Microgrid Management System",
  description: "Professional energy management dashboard for renewable microgrids",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SimulationProvider>
          <Suspense fallback={<div>Loading...</div>}>
            {children}
            <Analytics />
          </Suspense>
        </SimulationProvider>
      </body>
    </html>
  )
}
