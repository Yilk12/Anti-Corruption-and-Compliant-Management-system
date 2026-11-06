 import React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display } from "next/font/google"
import "./globals.css"
import Footer from "@/app/components/footer"
import AppHeader from "@/app/components/app-header"
import SidebarContainer from "@/app/components/sidebar/sidebar-container"
import { LocalizationProvider } from "@/app/hooks/use-localization"
import { ToastProvider } from "@/app/components/toast-provider"
import ToastView from "@/app/components/toast-view"
import { QueryClientProvider } from "./components/query-client-provider"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700"],
})

const HEADER_HEIGHT = 84

export const metadata: Metadata = {
  title: "ICSDS",
  icons: {
    icon: "/gallery/ecsc.jpg",
  },
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`font-sans min-h-screen flex flex-col ${GeistSans.variable} ${GeistMono.variable} ${playfairDisplay.variable}`}
        style={{ margin: 0, padding: 0, overflow: 'hidden' }}
      >
        <LocalizationProvider>
          <QueryClientProvider>
            <ToastProvider>
              <div className="flex flex-col h-screen overflow-hidden" style={{ gap: 0 }}>
                <div className="shrink-0 z-50" style={{ margin: 0, padding: 0 }}>
                  <AppHeader />
                </div>
                <div
                  className="flex flex-1 overflow-hidden"
                  style={{ gap: 0, margin: 0, padding: 0 }}
                >
                  <SidebarContainer />
                  <main
                    className="flex-1 overflow-y-auto bg-transparent"
                    style={{ paddingTop: '8px' }}
                  >
                    {children}
                  </main>
                </div>
                <div className="shrink-0 z-50">
                  <Footer />
                </div>
              </div>
              <ToastView />
            </ToastProvider>
          </QueryClientProvider>
        </LocalizationProvider>
      </body>
    </html>
  )
}
