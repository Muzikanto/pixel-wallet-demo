import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { pixelWallet } from "./connectors/pixel-connector.ts";

const url = 'wss://api.hellopixel.network';
// const url = "ws://127.0.0.1:4000";

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    coinbaseWallet(),
    pixelWallet({ url }),
    walletConnect({ projectId: 'b2634aede1fbadbea881afa7c2e7333d' || import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
