"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Lock, Unlock, Clock, AlertTriangle, CheckCircle2, ChevronRight, Activity, ArrowRight, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWalletStore } from "@/store/useWalletStore"
import { submitEscrowDeposit, submitEscrowWithdraw } from "@/lib/stellar"
import { Horizon } from "@stellar/stellar-sdk"

const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org")

export default function VaultPage() {
  const { address } = useWalletStore()
  const [amount, setAmount] = useState("")
  const [duration, setDuration] = useState("1") // minutes
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [liveEvent, setLiveEvent] = useState<string | null>(null)

  // Real-Time Event Streaming (L3 Requirement)
  useEffect(() => {
    if (!address) return;
    
    // Subscribe to all new transactions for the connected wallet using Server-Sent Events (SSE)
    const txStream = horizonServer.transactions()
      .forAccount(address)
      .cursor("now")
      .stream({
        onmessage: (tx: any) => {
          if (tx.successful) {
            setLiveEvent(`Blockchain Event: New Transaction Confirmed! Hash: ${tx.hash.slice(0,8)}...`);
            setTimeout(() => setLiveEvent(null), 5000); // Clear after 5s
          }
        },
        onerror: (err) => {
          console.error("SSE Stream Error:", err);
        }
      });

    return () => {
      txStream(); // Close stream on unmount
    };
  }, [address]);

  const handleDeposit = async () => {
    if (!address) {
      setError("Please connect your wallet first.")
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const hash = await submitEscrowDeposit(address, amount, parseInt(duration))
      setSuccess(`Successfully locked ${amount} XLM! Tx: ${hash.slice(0, 8)}...`)
      setAmount("")
    } catch (err: any) {
      setError(err.message || "Failed to lock funds.")
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!address) {
      setError("Please connect your wallet first.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const hash = await submitEscrowWithdraw(address)
      setSuccess(`Successfully withdrew your funds! Tx: ${hash.slice(0, 8)}...`)
    } catch (err: any) {
      setError(err.message || "Failed to withdraw funds.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col space-y-6 p-4 md:p-8 pb-28 md:pb-32 max-w-5xl mx-auto w-full">
      
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="w-7 h-7 md:w-8 md:h-8 text-indigo-500" />
          Time-Locked Escrow
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm md:text-lg">
          Securely lock your funds in a decentralized, time-locked Soroban smart contract. 
          Withdrawals are protected by cross-contract policy authentication.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        
        {/* Deposit Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl p-8 flex flex-col gap-6 shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Lock className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <Lock className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Lock Funds</h2>
              <p className="text-sm text-muted-foreground">Deposit XLM into the vault</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Amount (XLM)</label>
              <Input 
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/5 border-white/10 text-lg h-12 rounded-xl focus-visible:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Lock Duration (Minutes)</label>
              <Input 
                type="number"
                placeholder="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-white/5 border-white/10 text-lg h-12 rounded-xl focus-visible:ring-indigo-500/50"
              />
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-lg mt-auto shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            onClick={handleDeposit}
            disabled={loading || !address}
          >
            {loading ? "Processing..." : "Lock Funds"}
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Withdraw Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl p-8 flex flex-col gap-6 shadow-2xl">
           <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Unlock className="w-32 h-32" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Unlock className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Withdraw Funds</h2>
              <p className="text-sm text-muted-foreground">Requires policy auth & expired lock</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-center text-center px-4">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mx-auto mb-2 border border-white/10">
                <Clock className="w-8 h-8 text-foreground/50" />
             </div>
             <p className="text-muted-foreground leading-relaxed">
               When you withdraw, the Escrow contract will automatically perform a <strong>Cross-Contract Call</strong> to the Policy Authenticator to verify your access.
             </p>
          </div>

          <Button 
            size="lg" 
            variant="outline"
            className="w-full h-14 rounded-xl border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-lg mt-auto transition-all"
            onClick={handleWithdraw}
            disabled={loading || !address}
          >
            {loading ? "Verifying Policy..." : "Withdraw Funds"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Status Toasts */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            key="error-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-4 backdrop-blur-md"
          >
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Contract Error</h3>
              <p className="text-red-400/80 text-sm leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div 
            key="success-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-4 backdrop-blur-md"
          >
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-emerald-400 font-semibold mb-1">Transaction Successful</h3>
              <p className="text-emerald-400/80 text-sm leading-relaxed">{success}</p>
            </div>
          </motion.div>
        )}

        {liveEvent && (
          <motion.div 
            key="live-event-toast"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 z-50 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 flex items-center gap-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="relative">
              <BellRing className="w-6 h-6 text-blue-400" />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            </div>
            <div>
              <h3 className="text-blue-400 font-semibold text-sm">Real-Time Event Stream (L3)</h3>
              <p className="text-blue-400/80 text-xs">{liveEvent}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
