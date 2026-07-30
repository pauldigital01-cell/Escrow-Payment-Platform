"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Moon, Sun, Wallet, LayoutDashboard, ArrowRightLeft, UserCircle, RefreshCcw, Home, Shield } from "lucide-react"
import { useTheme } from "next-themes"
import { AccountSwitcherModal } from "@/components/ui/account-switcher-modal"
import { Button } from "@/components/ui/button"
import { useWalletStore } from "@/store/useWalletStore"
import Dock from "@/components/ui/Dock"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { address, connect, disconnect } = useWalletStore()
  const [isAccountModalOpen, setIsAccountModalOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const items = [
    { icon: <Home className="w-5 h-5 text-white" />, label: 'Home', onClick: () => router.push('/') },
    { icon: <LayoutDashboard className="w-5 h-5 text-white" />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <ArrowRightLeft className="w-5 h-5 text-white" />, label: 'Transfer', onClick: () => router.push('/transfer') },
    { icon: <RefreshCcw className="w-5 h-5 text-white" />, label: 'Swap', onClick: () => router.push('/swap') },
    { icon: <Shield className="w-5 h-5 text-white" />, label: 'Vault', onClick: () => router.push('/vault') },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold inline-block text-xl tracking-tight">StellarFlow</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {address ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsAccountModalOpen(true)}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline-block">{address.slice(0, 6)}...{address.slice(-4)}</span>
                  <span className="sm:hidden">Wallet</span>
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={connect} className="touch-manipulation">
                <Wallet className="mr-2 h-4 w-4" />
                Connect
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground touch-manipulation">
                {mounted ? (
                  theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Dock Container */}
      <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Dock items={items} />
        </div>
      </div>

      <AccountSwitcherModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} />
    </>
  )
}
