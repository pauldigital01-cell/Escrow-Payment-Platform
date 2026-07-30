import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/Navbar"
import { Toaster } from "@/components/ui/sonner"
import Background1 from "@/components/ui/Background1"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StellarFlow Treasury",
  description: "Web3 Treasury Dashboard on Stellar",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Background1 
            color="#0ea5e9" // sky-500
            colorTwo="#3b82f6" // blue-500
            ringCount={8}
            followMouse={true}
            mouseInfluence={0.3}
            hoverScale={1.1}
          />
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
