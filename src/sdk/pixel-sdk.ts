import { PixelCommunicator } from "./pixel-communicator.ts";
import { pixelLogger } from "./pixel.logger.ts";

export class PixelSdk {
  protected listeners: Record<string, Function[]> = {};
  protected communicator: PixelCommunicator;
  protected botUrl: string;

  constructor(opts: { url?: string; botUrl?: string; }) {
    this.communicator = new PixelCommunicator({ url: opts.url || "api.hellopixel.network" });
    this.botUrl = opts.botUrl || 'https://t.me/stage_pixel_bot/stage';
  }

  public connect() {
    this.communicator.connect();
  }

  public disconnect() {
    this.communicator.disconnect();
  }

  request = async ({ method, params = [] }: { method: string; params: any[] }) => {
    try {
      switch (method) {
        case "eth_requestAccounts":
          let address: string | undefined = await this.communicator.getWalletAddress();

          if (!address) {
            window.open(`${this.botUrl}?startapp=auth_${this.communicator.auth.get()}`, '_blank');
            address = await this.communicator.waitForAddress();
          }

          return address ? [address] : [];
        // const { data: accounts } = await this.communicator.send({ method: "eth_requestAccounts" });
        // return accounts;
        case "eth_sendTransaction":
          const { data: hash } = await this.communicator.send({ method: "eth_sendTransaction", params });

          return hash;
        case "personal_sign":
          const { data: signedHash } = await this.communicator.send({ method: "eth_sendTransaction", params });
          return signedHash;
        case "wallet_switchEthereumChain":
          // this.chainId = params[0].chainId;
          // this.networkVersion = Number(params[0].chainId);
          // this.eth = this.getEth();
          // this.provider = this.getProvider();
          // this.emit('chainChanged', params[0].chainId);
          return true;
        case "eth_chainId": {
          // const { data: chainId } = await this.communicator.send({ method: "eth_chainId" });
          // return chainId;
          let chainId = await this.communicator.getWalletChainId();

          if (!chainId) {
            chainId = await this.communicator.waitForChainId();
          }

          return chainId;
        }
        case "wallet_addEthereumChain":
        default:
          return null;
      }
    } catch (error) {
      pixelLogger.error((error as Error).message);
      throw error;
    }
  };

  emit = (eventName: string, params: any) => {
    this.listeners[eventName]?.map((listener) => {
      listener(params);
    });
  };

  on = (eventType: string, callback: Function) => {
    let listeners = this.listeners[eventType];

    if (!listeners) {
      this.listeners[eventType] = [];
      listeners = this.listeners[eventType];
    }

    if (!listeners.find((l) => l === callback)) {
      listeners.push(callback);
    }
  };

  removeListener = (eventType: string, callback: Function) => {
    this.listeners[eventType] = this.listeners[eventType].filter((l) => l !== callback);
  };
}
