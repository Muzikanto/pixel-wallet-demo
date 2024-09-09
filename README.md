# Pixel Connector

## Install

```sh
yarn add pixel-sdk
```

## Wagmi

```tsx
import { http, createConfig } from "wagmi";
import { songbird } from 'wagmi/chains';
import { pixelWallet } from 'pixel-sdk';

const url = 'api.hellopixel.network';
const botUrl = 'https://t.me/stage_pixel_bot/stage';

export const config = createConfig({
    chains: [songbird],
    connectors: [
        pixelWallet({ url, botUrl }),
    ],
    transports: {
        [songbird.id]: http(),
    },
});
```
