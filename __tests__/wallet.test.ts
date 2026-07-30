import { useWalletStore } from "../store/useWalletStore"

jest.mock("../lib/wallet-kit", () => ({
  openWalletModal: jest.fn(),
  disconnectWallet: jest.fn(),
  signWalletKitTx: jest.fn(),
  initWalletKit: jest.fn()
}))

describe("Wallet Store", () => {
  it("should initialize with null address", () => {
    const state = useWalletStore.getState()
    expect(state.address).toBeNull()
    expect(state.isConnecting).toBeFalsy()
  })

  it("should disconnect correctly", () => {
    useWalletStore.setState({ address: "G...TEST", balance: "100" })
    const state = useWalletStore.getState()
    expect(state.address).toBe("G...TEST")
    
    state.disconnect()
    
    const newState = useWalletStore.getState()
    expect(newState.address).toBeNull()
    expect(newState.balance).toBeNull()
  })
})
