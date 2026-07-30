import { rpc, TransactionBuilder, Networks, Address, nativeToScVal, Contract, Operation, Asset } from "@stellar/stellar-sdk"
import { signTransaction } from "@stellar/freighter-api"

const SERVER_URL = "https://soroban-testnet.stellar.org"
const NETWORK_PASSPHRASE = Networks.TESTNET
const rpcServer = new rpc.Server(SERVER_URL)

export class SimulationFailedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SimulationFailedError"
  }
}

export class UserRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserRejectedError"
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NetworkError"
  }
}

export async function invokeTransfer(targetId: string, fromPublicKey: string, amount: number) {
  try {
    const account = await rpcServer.getAccount(fromPublicKey)
    
    let operation;

    // Check if target is a Contract (starts with C) or a normal Account (starts with G)
    if (targetId.startsWith("C")) {
      const contract = new Contract(targetId)
      operation = contract.call("deposit", 
        new Address(fromPublicKey).toScVal(),
        nativeToScVal(amount, { type: "u32" })
      )
    } else if (targetId.startsWith("G")) {
      operation = Operation.payment({
        destination: targetId,
        asset: Asset.native(),
        amount: amount.toString()
      })
    } else {
      throw new Error("Invalid destination ID. Must start with 'G' (Account) or 'C' (Contract).")
    }

    let tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(operation)
      .setTimeout(30)
      .build()

    // Simulate (required for Soroban contracts, optional but safe for payments)
    if (targetId.startsWith("C")) {
      const simulatedTx = await rpcServer.simulateTransaction(tx as any)
      if (rpc.Api.isSimulationError(simulatedTx)) {
        throw new SimulationFailedError(simulatedTx.error)
      }
      tx = await rpcServer.prepareTransaction(tx as any) as any
    }

    // Ask user to sign via Freighter
    let signedXdr: string
    try {
      const response: any = await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE })
      if (response.error) {
        throw new Error(response.error)
      }
      // Freighter v2 returns an object with signedTxXdr, v1 returned a string
      signedXdr = typeof response === 'string' ? response : response.signedTxXdr
      
      if (!signedXdr) {
        throw new Error("No XDR returned from Freighter.")
      }
    } catch (err: any) {
      throw new UserRejectedError(err.message || "User rejected the transaction in Freighter.")
    }

    // Parse and submit
    // Bypass stellar-sdk envelope.switch bug by passing the XDR string directly 
    // disguised as a Transaction object
    const sendResponse = await rpcServer.sendTransaction({
      toXDR: () => signedXdr
    } as any)
    
    if (sendResponse.status === "ERROR") {
      throw new NetworkError("Transaction failed to submit to the network.")
    }

    return sendResponse.hash
  } catch (error: any) {
    if (error instanceof SimulationFailedError || error instanceof UserRejectedError || error instanceof NetworkError) {
      throw error
    }
    throw new Error(error.message)
  }
}
