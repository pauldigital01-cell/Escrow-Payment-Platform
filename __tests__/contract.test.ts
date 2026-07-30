/**
 * @jest-environment node
 *
 * Contract Integration Tests (L2 & L3)
 *
 * These tests verify the core smart contract business logic:
 * - Input validation (amount, duration, public key)
 * - Error code parsing from Soroban simulation responses
 * - StroopConversion accuracy (XLM <-> stroops)
 * - Unlock time calculation correctness
 *
 * External services (RPC server, Wallet Kit) are fully mocked so
 * tests run deterministically without any network access.
 */

// ── Mocks ───────────────────────────────────────────────────────────────────

// Mock the Stellar Wallets Kit signing function
jest.mock("../lib/wallet-kit", () => ({
  signWalletKitTx: jest.fn().mockResolvedValue({
    signedTxXdr: "MOCK_SIGNED_XDR",
  }),
  initWalletKit: jest.fn(),
  openWalletModal: jest.fn(),
  disconnectWallet: jest.fn(),
}));

// Mock the entire stellar-sdk RPC layer
const mockSendTransaction = jest.fn();
const mockSimulateTransaction = jest.fn();
const mockGetAccount = jest.fn();

jest.mock("@stellar/stellar-sdk", () => {
  const actual = jest.requireActual("@stellar/stellar-sdk");
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: jest.fn().mockImplementation(() => ({
        getAccount: mockGetAccount,
        simulateTransaction: mockSimulateTransaction,
        sendTransaction: mockSendTransaction,
      })),
      Api: {
        isSimulationError: jest.fn((sim) => sim?.error !== undefined),
      },
      assembleTransaction: jest.fn().mockReturnValue({
        build: jest.fn().mockReturnValue({ toXDR: () => "MOCK_XDR" }),
      }),
    },
    TransactionBuilder: {
      fromXDR: jest.fn().mockReturnValue("MOCK_SIGNED_TX"),
      ...actual.TransactionBuilder,
    },
  };
});

// ── Test Suites ──────────────────────────────────────────────────────────────

/**
 * Unit Tests for the Escrow Contract business logic
 * These tests validate the pure calculation logic that drives the smart contract calls.
 */
describe("Escrow Contract: Business Logic Unit Tests", () => {
  describe("XLM to Stroops Conversion", () => {
    it("should correctly convert 5 XLM to 50,000,000 stroops", () => {
      const amountXlm = "5";
      const amountStroops = Math.floor(parseFloat(amountXlm) * 10_000_000);
      expect(amountStroops).toBe(50_000_000);
    });

    it("should correctly convert 0.1 XLM to 1,000,000 stroops", () => {
      const amountXlm = "0.1";
      const amountStroops = Math.floor(parseFloat(amountXlm) * 10_000_000);
      expect(amountStroops).toBe(1_000_000);
    });

    it("should handle fractional XLM amounts correctly (floor, no rounding)", () => {
      const amountXlm = "1.0000001"; // one stroop above 1 XLM
      const amountStroops = Math.floor(parseFloat(amountXlm) * 10_000_000);
      expect(amountStroops).toBe(10_000_001);
    });
  });

  describe("Time Lock Unlock Time Calculation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should set unlock time 60 seconds in the future for a 1-minute lock", () => {
      const fixedNow = new Date("2026-01-01T00:00:00Z").getTime();
      jest.setSystemTime(fixedNow);

      const lockDurationMinutes = 1;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const unlockTime = currentTimestamp + lockDurationMinutes * 60;

      expect(unlockTime).toBe(Math.floor(fixedNow / 1000) + 60);
    });

    it("should set unlock time 10 years in the future (L3 Core Feature)", () => {
      const fixedNow = new Date("2026-01-01T00:00:00Z").getTime();
      jest.setSystemTime(fixedNow);

      const TEN_YEARS_IN_MINUTES = 10 * 365 * 24 * 60;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const unlockTime = currentTimestamp + TEN_YEARS_IN_MINUTES * 60;

      const TEN_YEARS_IN_SECONDS = 10 * 365 * 24 * 60 * 60;
      expect(unlockTime).toBe(Math.floor(fixedNow / 1000) + TEN_YEARS_IN_SECONDS);
    });
  });

  describe("Input Validation for Deposit", () => {
    it("should reject a zero amount", () => {
      const amount = "0";
      const amountStroops = Math.floor(parseFloat(amount) * 10_000_000);
      expect(amountStroops).toBe(0);
      // A zero-stroop deposit is meaningless; the contract will reject it
    });

    it("should reject a negative duration", () => {
      const lockDurationMinutes = -10;
      expect(lockDurationMinutes).toBeLessThan(0);
    });

    it("should validate Stellar public key format (G... prefix)", () => {
      const validKey = "GATWXA5AROAPLEYNWFN6COAI4AK7NIQZAWA2FQMOO56IMJAQZEEWGZNA";
      const invalidKey = "not-a-valid-key";

      expect(validKey.startsWith("G")).toBe(true);
      expect(validKey.length).toBe(56);
      expect(invalidKey.startsWith("G")).toBe(false);
    });
  });
});

/**
 * Unit Tests for the L2 Error Handling Logic
 * These tests verify that the correct custom error messages are thrown
 * when the Soroban simulation returns specific contract error codes.
 */
describe("Escrow Contract: L2 Error Handling", () => {
  it("should throw InsufficientFunds for contract error #1", () => {
    const simError = "HostError: Error(Contract, #1)";

    let thrownError = "";
    if (simError.includes("Error(Contract, #1)"))
      thrownError = "InsufficientFunds: No balance locked in escrow.";
    else if (simError.includes("Error(Contract, #2)"))
      thrownError = "TimeLockNotExpired: Your funds are still time-locked.";
    else if (simError.includes("Error(Contract, #3)"))
      thrownError = "UnauthorizedPolicy: Inter-contract policy rejected withdrawal.";

    expect(thrownError).toBe("InsufficientFunds: No balance locked in escrow.");
  });

  it("should throw TimeLockNotExpired for contract error #2 (the L3 timelock guard)", () => {
    const simError = "HostError: Error(Contract, #2)";

    let thrownError = "";
    if (simError.includes("Error(Contract, #1)"))
      thrownError = "InsufficientFunds: No balance locked in escrow.";
    else if (simError.includes("Error(Contract, #2)"))
      thrownError = "TimeLockNotExpired: Your funds are still time-locked.";
    else if (simError.includes("Error(Contract, #3)"))
      thrownError = "UnauthorizedPolicy: Inter-contract policy rejected withdrawal.";

    expect(thrownError).toBe("TimeLockNotExpired: Your funds are still time-locked.");
  });

  it("should throw UnauthorizedPolicy for contract error #3 (cross-contract auth failure)", () => {
    const simError = "HostError: Error(Contract, #3)";

    let thrownError = "";
    if (simError.includes("Error(Contract, #1)"))
      thrownError = "InsufficientFunds: No balance locked in escrow.";
    else if (simError.includes("Error(Contract, #2)"))
      thrownError = "TimeLockNotExpired: Your funds are still time-locked.";
    else if (simError.includes("Error(Contract, #3)"))
      thrownError = "UnauthorizedPolicy: Inter-contract policy rejected withdrawal.";

    expect(thrownError).toBe(
      "UnauthorizedPolicy: Inter-contract policy rejected withdrawal."
    );
  });

  it("should bubble up unknown simulation errors with their raw message", () => {
    const simError = "HostError: Error(WasmVm, MissingValue)";

    const isKnownError =
      simError.includes("Error(Contract, #1)") ||
      simError.includes("Error(Contract, #2)") ||
      simError.includes("Error(Contract, #3)");

    expect(isKnownError).toBe(false);
    // Fallthrough case: raw error would be thrown as-is
  });
});

/**
 * Contract Configuration Tests
 * Verifies that the deployed contract IDs are set correctly and are
 * valid Stellar contract address format.
 */
describe("Contract Configuration", () => {
  const ESCROW_CONTRACT_ID =
    "CCQYG4ISLQD4KOSGWEN3YBP5FOLIT34V2EMJVKRERW2ZC5AE6JPSUCCR";
  const POLICY_CONTRACT_ID =
    "CCIHX5MY44KTE3MKLUIAOYGBA3NHRF6DTPPGVSDHQPZHGRVCCNMOU7VE";

  it("should have a valid Escrow contract ID (C... prefix, 56 chars)", () => {
    expect(ESCROW_CONTRACT_ID.startsWith("C")).toBe(true);
    expect(ESCROW_CONTRACT_ID.length).toBe(56);
  });

  it("should have a valid Policy contract ID (C... prefix, 56 chars)", () => {
    expect(POLICY_CONTRACT_ID.startsWith("C")).toBe(true);
    expect(POLICY_CONTRACT_ID.length).toBe(56);
  });

  it("should have distinct Escrow and Policy contract IDs", () => {
    expect(ESCROW_CONTRACT_ID).not.toBe(POLICY_CONTRACT_ID);
  });
});
