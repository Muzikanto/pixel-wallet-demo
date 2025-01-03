import { http, createConfig } from "wagmi";
import { songbird } from "wagmi/chains";
// import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { pixelWallet } from "../src/wagmi";

const url = 'api.hellopixel.network';
// const url = "127.0.0.1:4000";
const botUrl = 'https://t.me/stage_pixel_bot/stage';
// const botUrl = 'tg://telegram.me/stage_pixel_bot/stage';
// const botUrl = 'http://localhost:8080/connect';

export const config = createConfig({
  chains: [songbird],
  connectors: [
    // injected(),
    // coinbaseWallet(),
    pixelWallet({ url, botUrl }),
    // walletConnect({ projectId: "b2634aede1fbadbea881afa7c2e7333d" || import.meta.env.VITE_WC_PROJECT_ID }),
  ],
  transports: {
    [songbird.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
