"use client"

import { useState } from "react"
import { useWalletStore } from "@/store/useWalletStore"
import { invokeTransfer } from "@/lib/contract"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, FileSignature, Send, ExternalLink } from "lucide-react"

type TxState = "idle" | "simulating" | "signing" | "submitting" | "confirmed" | "failed"

export default function TransferPage() {
  const { address } = useWalletStore()
  const [amount, setAmount] = useState("")
  const [destId, setDestId] = useState("")
  const [txState, setTxState] = useState<TxState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [txHash, setTxHash] = useState("")

  const handleTransfer = async () => {
    if (!address) {
      toast.error("Please connect your wallet first.")
      return
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.")
      return
    }

    if (!destId || destId.trim() === "") {
      toast.error("Please enter a destination address or contract ID.")
      return
    }

    const targetId = destId.trim()

    try {
      setTxState("simulating")
      // Artificial delay to show state
      await new Promise(r => setTimeout(r, 1000))
      
      setTxState("signing")
      const hash = await invokeTransfer(targetId, address, Number(amount))
      
      setTxState("submitting")
      // Artificial delay to show state
      await new Promise(r => setTimeout(r, 1500))

      setTxHash(hash)
      setTxState("confirmed")
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Transaction Confirmed!</span>
          <a 
            href={`https://stellar.expert/explorer/testnet/tx/${hash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs underline"
          >
            View on Stellar Expert <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )
      setAmount("")
    } catch (e: any) {
      setErrorMsg(e.message || "An unknown error occurred")
      setTxState("failed")
      toast.error(`Transaction Failed: ${e.message}`)
    }
  }

  const resetState = () => {
    setTxState("idle")
    setErrorMsg("")
    setTxHash("")
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md shadow-2xl glass border-primary/20">
        <CardHeader>
          <CardTitle>Transfer XLM</CardTitle>
          <CardDescription>Send XLM to any Account or Smart Contract</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destId">Destination Address / Contract ID</Label>
              <Input 
                id="destId" 
                placeholder="G... or C..." 
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                disabled={txState !== "idle" && txState !== "failed" && txState !== "confirmed"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (XLM)</Label>
            <Input 
              id="amount" 
              placeholder="0.00" 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={txState !== "idle" && txState !== "failed" && txState !== "confirmed"}
            />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {txState !== "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border bg-muted/50 p-4"
              >
                <div className="flex flex-col gap-3">
                  <TxStep 
                    active={txState === "simulating"} 
                    done={["signing", "submitting", "confirmed"].includes(txState)}
                    error={txState === "failed" && errorMsg.includes("Simulation")}
                    label="Simulating Contract..."
                    icon={<Loader2 className="w-4 h-4 animate-spin" />}
                  />
                  <TxStep 
                    active={txState === "signing"} 
                    done={["submitting", "confirmed"].includes(txState)}
                    error={txState === "failed" && errorMsg.includes("User rejected")}
                    label="Waiting for Wallet Signature..."
                    icon={<FileSignature className="w-4 h-4 animate-pulse" />}
                  />
                  <TxStep 
                    active={txState === "submitting"} 
                    done={txState === "confirmed"}
                    error={txState === "failed" && errorMsg.includes("Network")}
                    label="Submitting to Network..."
                    icon={<Send className="w-4 h-4 animate-bounce" />}
                  />
                  
                  {txState === "confirmed" && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2 text-emerald-500 font-medium">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirmed!</span>
                      </div>
                      <a 
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {txHash.slice(0,8)}...{txHash.slice(-8)} <ExternalLink className="w-3 h-3" />
                      </a>
                    </motion.div>
                  )}

                  {txState === "failed" && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-destructive mt-2 font-medium text-sm">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <span className="break-words">{errorMsg}</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter>
          {txState === "confirmed" || txState === "failed" ? (
            <Button className="w-full" variant="outline" onClick={resetState}>
              Start New Transfer
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleTransfer}
              disabled={!amount || txState !== "idle"}
            >
              Submit Transaction
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

function TxStep({ active, done, error, label, icon }: { active: boolean, done: boolean, error: boolean, label: string, icon: React.ReactNode }) {
  let color = "text-muted-foreground"
  if (active) color = "text-primary"
  if (done) color = "text-emerald-500"
  if (error) color = "text-destructive"

  return (
    <div className={`flex items-center gap-3 text-sm font-medium transition-colors ${color}`}>
      <div className="w-5 h-5 flex items-center justify-center">
        {error ? <XCircle className="w-4 h-4" /> : done ? <CheckCircle2 className="w-4 h-4" /> : active ? icon : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
      </div>
      <span>{label}</span>
    </div>
  )
}
