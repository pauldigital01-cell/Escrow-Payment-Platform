"use client"

import { SwapWidget } from "@/components/ui/swap-widget"
import { useWalletStore } from "@/store/useWalletStore"

export default function SwapPage() {
  const { address, connect } = useWalletStore()

  return (
    <div className="container mx-auto p-4 sm:p-8 flex flex-col justify-center items-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md">
        <SwapWidget walletKey={address || null} onConnect={connect} />
      </div>
    </div>
  )
}
