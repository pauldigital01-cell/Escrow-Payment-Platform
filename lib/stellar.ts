import { Horizon } from "@stellar/stellar-sdk"
import { getAddress, isAllowed, setAllowed } from "@stellar/freighter-api"

const horizonServer = new Horizon.Server("https://horizon-testnet.stellar.org")

export async function fetchBalance(publicKey: string): Promise<string> {
  try {
    const account = await horizonServer.loadAccount(publicKey)
    const xlmBalance = account.balances.find((b) => b.asset_type === "native")
    return xlmBalance ? xlmBalance.balance : "0.00"
  } catch (error) {
    console.error("Error fetching balance:", error)
    return "0.00"
  }
}

export async function connectFreighterWallet(): Promise<string> {
  if (await isAllowed()) {
    const { address } = await getAddress();
    return address;
  } else {
    await setAllowed();
    const { address } = await getAddress();
    return address;
  }
}

export type SwapAsset = {
  code: string;
  issuer?: string;
};

export async function fetchSwapQuote(sendAsset: SwapAsset, destAsset: SwapAsset, amount: string) {
  // Mock implementation for the Swap Widget UI
  return {
    destAmount: (parseFloat(amount) * 0.95).toFixed(2),
    exchangeRate: "0.95",
    path: []
  };
}

export async function executePathPaymentSwap(walletKey: string, sendAsset: SwapAsset, destAsset: SwapAsset, amount: string, destAmount: string, path: any[]): Promise<{ success: boolean; hash?: string; error?: string }> {
  // Mock implementation for the Swap Widget UI
  return { success: true, hash: "MOCK_SWAP_TX_HASH" };
}

export type ActivityRecord = {
  id: string;
  type: string;
  amount?: number;
  date: string;
  status: string;
  fee: string;
  memo: string;
}

export async function fetchRecentActivity(publicKey: string): Promise<ActivityRecord[]> {
  try {
    const response = await horizonServer.transactions().forAccount(publicKey).limit(10).order("desc").call();
    return response.records.map((tx: any) => {
      const isOutbound = tx.source_account === publicKey;
      const type = isOutbound ? 'send / contract' : 'receive';
      
      const date = new Date(tx.created_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });

      const feeXlm = (parseInt(tx.fee_charged) / 10000000).toFixed(5);
      const memo = tx.memo_type !== 'none' ? tx.memo : 'No Memo';

      return {
        id: tx.hash,
        type,
        date,
        status: tx.successful ? "Completed" : "Failed",
        fee: feeXlm,
        memo
      };
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return [];
  }
}

// ---------------------------------------------------------
// Soroban Smart Contract Integration (L2 & L3 Requirements)
// ---------------------------------------------------------

import { rpc, TransactionBuilder, Networks, Address, nativeToScVal, xdr, Contract } from "@stellar/stellar-sdk";
import { signWalletKitTx } from "@/lib/wallet-kit";

const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org:443");
export const ESCROW_CONTRACT_ID = "CCQYG4ISLQD4KOSGWEN3YBP5FOLIT34V2EMJVKRERW2ZC5AE6JPSUCCR";
export const POLICY_CONTRACT_ID = "CCIHX5MY44KTE3MKLUIAOYGBA3NHRF6DTPPGVSDHQPZHGRVCCNMOU7VE";

export async function submitEscrowDeposit(publicKey: string, amountXlm: string, lockDurationMinutes: number): Promise<string> {
  const account = await rpcServer.getAccount(publicKey);
  const contract = new Contract(ESCROW_CONTRACT_ID);
  
  // Calculate unlock time (current ledger time + duration)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const unlockTime = currentTimestamp + (lockDurationMinutes * 60);
  
  // amount in stroops (1 XLM = 10,000,000 stroops)
  const amountStroops = Math.floor(parseFloat(amountXlm) * 10000000);

  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call("deposit",
      new Address(publicKey).toScVal(),
      nativeToScVal(amountStroops, { type: "i128" }),
      nativeToScVal(unlockTime, { type: "u64" })
    ))
    .setTimeout(30)
    .build();

  // Simulate to get footprint & fee
  const sim = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation Failed: ${sim.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, sim as any).build();
  
  // Sign with Wallet Kit
  const signRes = await signWalletKitTx(preparedTx.toXDR(), publicKey);
  
  // Kit returns either signedTxXdr or signedXDR depending on version
  const signedXdrStr = (signRes as any).signedTxXdr || (signRes as any).signedXDR || signRes;
  
  const signedTx = TransactionBuilder.fromXDR(signedXdrStr, Networks.TESTNET);
  
  // Submit
  const sendRes = await rpcServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR") {
    throw new Error(`Transaction failed: ${sendRes.errorResult?.toXDR("base64")}`);
  }
  return sendRes.hash;
}

export async function submitEscrowWithdraw(publicKey: string): Promise<string> {
  const account = await rpcServer.getAccount(publicKey);
  const contract = new Contract(ESCROW_CONTRACT_ID);

  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: Networks.TESTNET })
    .addOperation(contract.call("withdraw",
      new Address(publicKey).toScVal(),
      new Address(POLICY_CONTRACT_ID).toScVal()
    ))
    .setTimeout(30)
    .build();

  const sim = await rpcServer.simulateTransaction(tx);
  
  // L2 Error Handling via Simulation (Catching our 3 custom errors)
  if (rpc.Api.isSimulationError(sim)) {
    if (sim.error.includes("Error(Contract, #1)")) throw new Error("InsufficientFunds: No balance locked in escrow.");
    if (sim.error.includes("Error(Contract, #2)")) throw new Error("TimeLockNotExpired: Your funds are still time-locked.");
    if (sim.error.includes("Error(Contract, #3)")) throw new Error("UnauthorizedPolicy: Inter-contract policy rejected withdrawal.");
    throw new Error(`Simulation Failed: ${sim.error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, sim as any).build();
  
  const signRes = await signWalletKitTx(preparedTx.toXDR(), publicKey);
  
  const signedXdrStr = (signRes as any).signedTxXdr || (signRes as any).signedXDR || signRes;
  
  const signedTx = TransactionBuilder.fromXDR(signedXdrStr, Networks.TESTNET);
  
  const sendRes = await rpcServer.sendTransaction(signedTx);
  if (sendRes.status === "ERROR") {
    throw new Error("Transaction submission failed on network.");
  }
  return sendRes.hash;
}
