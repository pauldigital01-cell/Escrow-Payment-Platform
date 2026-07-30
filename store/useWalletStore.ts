import { create } from 'zustand'
import { openWalletModal, disconnectWallet } from '@/lib/wallet-kit'
import { toast } from 'sonner'

interface WalletState {
  address: string | null
  balance: string | null
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  setBalance: (balance: string) => void
  setAddress: (address: string | null) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  balance: null,
  isConnecting: false,
  error: null,
  
  connect: async () => {
    set({ isConnecting: true, error: null })
    try {
      // Use Stellar Wallets Kit Modal for everything
      // Note: In older versions, authModal might just return the public key as a string, 
      // or it might return an object like { address: '...' }. We'll handle both.
      const result: any = await openWalletModal()
      
      const publicKey = typeof result === 'string' ? result : (result?.address || result?.publicKey)

      if (publicKey) {
        set({ address: publicKey, isConnecting: false })
        toast.success(`Wallet connected successfully!`)
      } else {
        set({ isConnecting: false })
        toast.error("User cancelled connection request.")
      }
    } catch (e: any) {
      set({ error: e.message || "Connection failed", isConnecting: false })
      toast.error(e.message || "Connection failed")
    }
  },

  disconnect: () => {
    set({ address: null, balance: null, error: null })
    try {
      disconnectWallet()
    } catch (e) {
      // ignore
    }
    toast.info("Wallet disconnected.")
  },

  setBalance: (balance: string) => set({ balance }),
  setAddress: (address: string | null) => set({ address })
}))


