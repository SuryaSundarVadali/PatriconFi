import { createConfig, http } from "wagmi";
import { coinbaseWallet, injected, metaMask, walletConnect } from "wagmi/connectors";

const arcChainId = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? "11155111");
const arcRpcUrl = process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.ankr.com/eth_sepolia";
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const arcChain = {
  id: arcChainId,
  name: process.env.NEXT_PUBLIC_ARC_CHAIN_NAME ?? "Arc",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [arcRpcUrl],
    },
    public: {
      http: [arcRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: process.env.NEXT_PUBLIC_ARC_EXPLORER_NAME ?? "Arc Explorer",
      url: process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://sepolia.etherscan.io",
    },
  },
  testnet: true,
};

const connectors = walletConnectProjectId
  ? [
      metaMask(),
      injected(),
      coinbaseWallet({ appName: "PatriconFi" }),
      walletConnect({ projectId: walletConnectProjectId, showQrModal: true }),
    ]
  : [metaMask(), injected(), coinbaseWallet({ appName: "PatriconFi" })];

export const walletConfig = createConfig({
  chains: [arcChain],
  connectors,
  transports: {
    [arcChain.id]: http(arcRpcUrl),
  },
  multiInjectedProviderDiscovery: true,
});
