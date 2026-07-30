"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Smartphone, ExternalLink, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

const MOBILE_WALLETS = [
  {
    name: "xBull Wallet",
    description: "The most popular Stellar mobile wallet",
    icon: "🐂",
    deepLink: "https://xbull.app",
    storeLink: "https://xbull.app",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
  },
  {
    name: "Lobstr",
    description: "Simple & secure Stellar wallet",
    icon: "🦞",
    deepLink: "https://lobstr.co",
    storeLink: "https://lobstr.co",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
  },
  {
    name: "SEAT Wallet",
    description: "Stellar Web Wallet — works in browser",
    icon: "🌐",
    deepLink: "https://stellarterm.com",
    storeLink: "https://stellarterm.com",
    color: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/30",
  },
]

export function MobileWalletModal({ isOpen, onClose }: MobileWalletModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-wallet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            key="mobile-wallet-sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border border-white/10 bg-black/90 backdrop-blur-xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
          >
            {/* Handle bar */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <Smartphone className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Connect on Mobile</h2>
                  <p className="text-xs text-white/50">Choose a Stellar mobile wallet</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
              <p className="text-amber-400/90 text-sm leading-relaxed">
                <strong>Freighter</strong> is a browser extension and is not available on mobile.
                To interact with StellarFlow on your phone, use one of these Stellar-compatible wallets.
              </p>
            </div>

            {/* Wallet Options */}
            <div className="space-y-3">
              {MOBILE_WALLETS.map((wallet) => (
                <motion.a
                  key={wallet.name}
                  href={wallet.storeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${wallet.color} border ${wallet.border} transition-all active:scale-95 cursor-pointer`}
                >
                  <span className="text-3xl">{wallet.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{wallet.name}</p>
                    <p className="text-white/50 text-xs truncate">{wallet.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-white/40 shrink-0" />
                </motion.a>
              ))}
            </div>

            {/* OR Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Desktop reminder */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-white/40 shrink-0" />
              <p className="text-white/50 text-xs leading-relaxed">
                For the full experience with smart contract interactions, use a <strong className="text-white/70">desktop browser</strong> with the Freighter extension installed.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
