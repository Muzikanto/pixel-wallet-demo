# Pixel Connector

## Install

```sh
yarn add @muzikanto/pixel-sdk
```

## Wagmi

```ts
import { http, createConfig } from "wagmi";
import { songbird } from 'wagmi/chains';
import { pixelWallet } from '@muzikanto/pixel-sdk/lib/wagmi';

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

## Sdk

```ts
import { PixelSdk } from '@muzikanto/pixel-sdk/lib/sdk';

const url = 'api.hellopixel.network';
const botUrl = 'https://t.me/stage_pixel_bot/stage';

const sdk = new PixelSdk({ url, botUrl });

// connect to wallet
sdk.connect();

// request sign message
sdk.request({ method: 'personal_sign', params: [/*...*/] });

// get current chain
sdk.request({ method: 'eth_chainId' }).then(console.log);
```
