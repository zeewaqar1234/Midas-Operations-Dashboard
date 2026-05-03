import { createPublicClient, http, fallback } from "viem";
import { mainnet } from "viem/chains";

const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL;

// Primary transport: Alchemy (if configured), fallback to public Cloudflare RPC
const transport = rpcUrl
  ? fallback([http(rpcUrl), http("https://cloudflare-eth.com")])
  : http("https://cloudflare-eth.com");

export const publicClient = createPublicClient({
  chain: mainnet,
  transport,
  batch: {
    // Batch multiple contract reads into a single multicall
    multicall: true,
  },
});

export type PublicClient = typeof publicClient;
