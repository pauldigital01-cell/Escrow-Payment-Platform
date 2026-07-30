import { create } from 'zustand'
import { fetchBalance } from '@/lib/stellar'

export interface Account {
  id: string
  name: string
  publicKey: string
  balanceXlm?: number
  balanceUsd?: number
}

interface AccountStore {
  accounts: Account[]
  activeAccountId: string | null
  setActiveAccount: (id: string) => void
  addAccount: (name: string, publicKey: string) => Promise<void>
  removeAccount: (id: string) => void
  refreshBalances: () => Promise<void>
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  activeAccountId: null,
  setActiveAccount: (id) => set({ activeAccountId: id }),
  addAccount: async (name, publicKey) => {
    set((state) => {
      if (state.accounts.some(a => a.id === publicKey)) return state;
      return { accounts: [...state.accounts, { id: publicKey, name, publicKey }] };
    })
  },
  removeAccount: (id) => set((state) => ({
    accounts: state.accounts.filter(a => a.id !== id),
    activeAccountId: state.activeAccountId === id ? null : state.activeAccountId
  })),
  refreshBalances: async () => {
    const { accounts } = get();
    if (accounts.length === 0) return;
    
    const updatedAccounts = await Promise.all(
      accounts.map(async (acc) => {
        try {
          const balStr = await fetchBalance(acc.publicKey);
          const balanceXlm = parseFloat(balStr);
          const balanceUsd = balanceXlm * 0.10; // Mock $0.10 exchange rate
          return { ...acc, balanceXlm, balanceUsd };
        } catch (e) {
          return acc;
        }
      })
    );
    
    set({ accounts: updatedAccounts });
  }
}))
