import { ETHERSCAN_BASE, CONTRACTS } from "./constants";

const API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EtherscanTokenTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  confirmations: string;
}

export interface EtherscanNormalTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
}

export interface EtherscanTokenHolder {
  TokenHolderAddress: string;
  TokenHolderQuantity: string;
}

export interface EtherscanLogEntry {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
  logIndex: string;
  transactionHash: string;
  transactionIndex: string;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function etherscanFetch<T>(
  params: Record<string, string>
): Promise<T[]> {
  const url = new URL(ETHERSCAN_BASE);
  url.searchParams.set("apikey", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`Etherscan API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (json.status === "0" && json.message !== "No transactions found") {
    throw new Error(`Etherscan: ${json.message} — ${json.result}`);
  }

  return Array.isArray(json.result) ? (json.result as T[]) : [];
}

// ─── Token Transfers (ERC-20 events) ─────────────────────────────────────────

export async function getTokenTransfers(
  contractAddress: string,
  options: {
    address?: string;
    startBlock?: number;
    endBlock?: number;
    page?: number;
    offset?: number;
    sort?: "asc" | "desc";
  } = {}
): Promise<EtherscanTokenTx[]> {
  return etherscanFetch<EtherscanTokenTx>({
    module: "account",
    action: "tokentx",
    contractaddress: contractAddress,
    ...(options.address ? { address: options.address } : {}),
    startblock: String(options.startBlock ?? 0),
    endblock: String(options.endBlock ?? 99999999),
    page: String(options.page ?? 1),
    offset: String(options.offset ?? 100),
    sort: options.sort ?? "desc",
  });
}

// ─── Mint events (from == zero address) ──────────────────────────────────────

export async function getMintEvents(
  contractAddress: string,
  options: { page?: number; offset?: number } = {}
): Promise<EtherscanTokenTx[]> {
  const txs = await getTokenTransfers(contractAddress, {
    ...options,
    sort: "desc",
  });
  return txs.filter(
    (tx) => tx.from === "0x0000000000000000000000000000000000000000"
  );
}

// ─── Burn events (to == zero address) ────────────────────────────────────────

export async function getBurnEvents(
  contractAddress: string,
  options: { page?: number; offset?: number } = {}
): Promise<EtherscanTokenTx[]> {
  const txs = await getTokenTransfers(contractAddress, {
    ...options,
    sort: "desc",
  });
  return txs.filter(
    (tx) => tx.to === "0x0000000000000000000000000000000000000000"
  );
}

// ─── All mint + burn events, merged and sorted ────────────────────────────────

export async function getMintBurnEvents(options: {
  token?: "mTBILL" | "mBASIS" | "all";
  page?: number;
  offset?: number;
}): Promise<(EtherscanTokenTx & { eventType: "mint" | "burn" })[]> {
  const tokens =
    options.token === "mTBILL"
      ? [CONTRACTS.mTBILL.token]
      : options.token === "mBASIS"
        ? [CONTRACTS.mBASIS.token]
        : [CONTRACTS.mTBILL.token, CONTRACTS.mBASIS.token];

  const results = await Promise.all(
    tokens.map((addr) =>
      getTokenTransfers(addr, {
        page: options.page,
        offset: options.offset ?? 50,
        sort: "desc",
      })
    )
  );

  type MintBurnTx = EtherscanTokenTx & { eventType: "mint" | "burn" };

  const classified: MintBurnTx[] = results.flat().reduce<MintBurnTx[]>(
    (acc, tx) => {
      const from = tx.from.toLowerCase();
      const to = tx.to.toLowerCase();
      const zero = "0x0000000000000000000000000000000000000000";
      if (from === zero) acc.push({ ...tx, eventType: "mint" });
      else if (to === zero) acc.push({ ...tx, eventType: "burn" });
      return acc;
    },
    []
  );

  return classified.sort(
    (a, b) => Number(b.timeStamp) - Number(a.timeStamp)
  );
}

// ─── Normal transactions for a wallet ────────────────────────────────────────

export async function getWalletTxHistory(
  address: string,
  options: { page?: number; offset?: number } = {}
): Promise<EtherscanNormalTx[]> {
  return etherscanFetch<EtherscanNormalTx>({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: String(options.page ?? 1),
    offset: String(options.offset ?? 50),
    sort: "desc",
  });
}

// ─── Token transfers for a specific wallet ────────────────────────────────────

export async function getWalletTokenTxs(
  address: string,
  contractAddress?: string,
  options: { page?: number; offset?: number } = {}
): Promise<EtherscanTokenTx[]> {
  return etherscanFetch<EtherscanTokenTx>({
    module: "account",
    action: "tokentx",
    address,
    ...(contractAddress ? { contractaddress: contractAddress } : {}),
    startblock: "0",
    endblock: "99999999",
    page: String(options.page ?? 1),
    offset: String(options.offset ?? 100),
    sort: "desc",
  });
}

// ─── Approximate top holders from mint Transfer events (free tier) ─────────────
// The Etherscan tokenholderlist and tokeninfo APIs require a Pro key.
// Instead we reconstruct active investors from recent mint events and verify
// their current balance via RPC, which works on the free tier.

export async function getTokenHolders(
  contractAddress: string,
  options: { page?: number; offset?: number } = {}
): Promise<EtherscanTokenHolder[]> {
  // Pull recent mint transfers (from == zero address) to find investor wallets
  const txs = await getTokenTransfers(contractAddress, {
    page: options.page ?? 1,
    offset: Math.min(options.offset ?? 25, 100),
    sort: "desc",
  });

  const zero = "0x0000000000000000000000000000000000000000";
  const seen = new Map<string, string>(); // address -> largest tx value

  for (const tx of txs) {
    if (tx.from.toLowerCase() === zero) {
      const existing = seen.get(tx.to.toLowerCase());
      if (!existing || BigInt(tx.value) > BigInt(existing)) {
        seen.set(tx.to.toLowerCase(), tx.value);
      }
    }
  }

  // Return as EtherscanTokenHolder shape (balance = latest mint value, not true balance)
  // Caller will refresh balances via RPC
  return Array.from(seen.entries()).map(([addr, qty]) => ({
    TokenHolderAddress: addr,
    TokenHolderQuantity: qty,
  }));
}

// ─── Token holder count (free-tier approximation) ─────────────────────────────
// Counts unique recipient addresses from recent mint events.

export async function getTokenHolderCount(
  contractAddress: string
): Promise<number> {
  try {
    const txs = await getTokenTransfers(contractAddress, {
      offset: 100,
      sort: "desc",
    });
    const zero = "0x0000000000000000000000000000000000000000";
    const unique = new Set(
      txs
        .filter((tx) => tx.from.toLowerCase() === zero)
        .map((tx) => tx.to.toLowerCase())
    );
    return unique.size;
  } catch {
    return 0;
  }
}

// ─── Event logs (RoleGranted, RoleRevoked) ────────────────────────────────────

export async function getEventLogs(
  address: string,
  topic0: string,
  options: { fromBlock?: number; toBlock?: number; page?: number; offset?: number } = {}
): Promise<EtherscanLogEntry[]> {
  return etherscanFetch<EtherscanLogEntry>({
    module: "logs",
    action: "getLogs",
    address,
    topic0,
    fromBlock: String(options.fromBlock ?? 0),
    toBlock: options.toBlock ? String(options.toBlock) : "latest",
    page: String(options.page ?? 1),
    offset: String(options.offset ?? 50),
  });
}

// ─── Raw transaction input data ───────────────────────────────────────────────

export async function getTxInputData(
  txHash: string
): Promise<{ input: string; from: string; to: string; gasUsed: string; blockNumber: string; isError: string }> {
  const url = new URL(ETHERSCAN_BASE);
  url.searchParams.set("apikey", API_KEY);
  url.searchParams.set("module", "proxy");
  url.searchParams.set("action", "eth_getTransactionByHash");
  url.searchParams.set("txhash", txHash);

  const res = await fetch(url.toString());
  const json = await res.json();
  const tx = json.result;

  if (!tx) throw new Error("Transaction not found");

  // Also fetch receipt for gasUsed / status
  const receiptUrl = new URL(ETHERSCAN_BASE);
  receiptUrl.searchParams.set("apikey", API_KEY);
  receiptUrl.searchParams.set("module", "proxy");
  receiptUrl.searchParams.set("action", "eth_getTransactionReceipt");
  receiptUrl.searchParams.set("txhash", txHash);

  const receiptRes = await fetch(receiptUrl.toString());
  const receiptJson = await receiptRes.json();
  const receipt = receiptJson.result;

  return {
    input: tx.input ?? "0x",
    from: tx.from ?? "",
    to: tx.to ?? "",
    gasUsed: receipt ? parseInt(receipt.gasUsed, 16).toString() : "0",
    blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16).toString() : "0",
    isError: receipt?.status === "0x0" ? "1" : "0",
  };
}
