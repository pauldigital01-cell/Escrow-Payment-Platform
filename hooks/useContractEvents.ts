import { useEffect, useState } from "react"
import { Horizon } from "@stellar/stellar-sdk"
import { toast } from "sonner"

const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org")

export function useContractEvents(contractId: string) {
  const [lastEvent, setLastEvent] = useState<any>(null)

  useEffect(() => {
    if (!contractId) return

    // Setting up a streaming listener for contract events
    // Usually, you'd filter by contract ID if Horizon supports it,
    // or poll the Soroban RPC getEvents endpoint.
    // For demo purposes, we are simulating a listener setup.

    let isSubscribed = true
    const pollEvents = setInterval(() => {
      // MOCK: simulate fetching an event
      // In production, use `rpcServer.getEvents(...)`
      if (!isSubscribed) return
    }, 10000)

    return () => {
      isSubscribed = false
      clearInterval(pollEvents)
    }
  }, [contractId])

  return lastEvent
}
