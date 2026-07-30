"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useWalletStore } from "@/store/useWalletStore"
import { fetchBalance, fetchRecentActivity, ActivityRecord } from "@/lib/stellar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BentoCard } from "@/components/ui/bento-card"
import { Send, Download, RefreshCcw, Clock, ArrowUpRight, ArrowDownLeft, Shield } from "lucide-react"
import { motion } from "framer-motion"

// Removing mock recentTransactions as it's now dynamically fetched

export default function Dashboard() {
  const { address, balance, setBalance } = useWalletStore()
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState<ActivityRecord[]>([])

  // Mock exchange rate: 1 XLM = $0.10
  const usdValue = balance ? (parseFloat(balance) * 0.10).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : "$0.00"

  useEffect(() => {
    async function loadData() {
      if (address) {
        setLoading(true)
        const [bal, activities] = await Promise.all([
          fetchBalance(address),
          fetchRecentActivity(address)
        ])
        setBalance(bal)
        setHistory(activities)
        setLoading(false)
      } else {
        setHistory([])
      }
    }
    loadData()
  }, [address, setBalance])

  const scrollToHistory = () => {
    document.getElementById("recent-activity")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Treasury Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Balance & Actions Card */}
        <BentoCard delay={0.05} className="md:col-span-2 xl:col-span-4 relative group overflow-hidden flex flex-col justify-between p-6">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Shield className="w-24 h-24" />
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">Total Balance</h2>
            <p className="text-sm text-muted-foreground">Your current assets on the Stellar Testnet.</p>
          </div>
          <div className="space-y-8">
            <div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ) : address ? (
                <div>
                  <div className="text-5xl font-extrabold tracking-tighter">
                    {balance} <span className="text-2xl text-muted-foreground font-normal tracking-normal">XLM</span>
                  </div>
                  <div className="text-muted-foreground mt-2 font-medium">
                    ≈ {usdValue} USD
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Please connect wallet to view balance.</div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 pt-4">
              <Link href="/transfer" className="flex flex-col items-center gap-2 group">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Send className="h-5 w-5" />
                  </Button>
                </motion.div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Send</span>
              </Link>
              
              <div className="flex flex-col items-center gap-2 group cursor-pointer">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Download className="h-5 w-5" />
                  </Button>
                </motion.div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Add</span>
              </div>

              <Link href="/swap" className="flex flex-col items-center gap-2 group cursor-pointer">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <RefreshCcw className="h-5 w-5" />
                  </Button>
                </motion.div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Swap</span>
              </Link>

              <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={scrollToHistory}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Clock className="h-5 w-5" />
                  </Button>
                </motion.div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">History</span>
              </div>
            </div>
            </div>
        </BentoCard>
      </div>

      {/* Recent Activity Feed */}
      <BentoCard delay={0.15} className="md:col-span-2 xl:col-span-4 p-6" id="recent-activity">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Recent Activity Feed</h2>
            <p className="text-sm text-muted-foreground">Your latest operations on the Stellar Testnet.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : history.length > 0 ? (
            history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.type === 'receive' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {tx.type === 'receive' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold capitalize">{tx.type}</div>
                      <div className="text-xs text-muted-foreground">{tx.date} • {tx.status}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-muted-foreground mb-1">Memo: {tx.memo}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-end gap-2">
                      <span>Fee: {tx.fee} XLM</span>
                      <a href={`https://stellar.expert/explorer/testnet/tx/${tx.id}`} target="_blank" rel="noopener noreferrer" className="text-primary transition-colors hover:underline flex items-center gap-1">
                        View on Stellar Expert
                      </a>
                    </div>
                  </div>
              </div>
            ))
          ) : address ? (
            <div className="text-center py-8 text-muted-foreground">No recent activity found.</div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Connect wallet to view history.</div>
          )}
        </div>
      </BentoCard>
    </div>
  )
}
