import { PixelCommunicator } from "./pixel-communicator";
import { pixelLogger } from "./pixel.logger";

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
        case 'eth_accounts': {
          let address: string | undefined = await this.communicator.getWalletAddress();

          return address ? [address] : [];
        }
        case "eth_requestAccounts":
          let address: string | undefined = await this.communicator.getWalletAddress();

          if (!address) {
            const url = `${this.botUrl}?startapp=auth_${this.communicator.auth.get()}`;

            setTimeout(() => {
              window.open(url, '_blank');
            }, 0);
            address = await this.communicator.waitForAddress();
          }

          return address ? [address] : [];
        case "eth_sendTransaction":
        case "personal_sign":
          const requestSignature = this.communicator.getRequestSignature();

          await this.communicator.createRequest(requestSignature, method, { params });

          const url = `${this.botUrl}?startapp=sig_${requestSignature}`;

          setTimeout(() => {
            window.open(url, '_blank');
          }, 0);

          const signedHash = await this.communicator.waitForRequest(requestSignature);

          return signedHash;
        case "wallet_switchEthereumChain":
          // this.chainId = params[0].chainId;
          // this.networkVersion = Number(params[0].chainId);
          // this.eth = this.getEth();
          // this.provider = this.getProvider();
          // this.emit('chainChanged', params[0].chainId);
          return true;
        case "eth_chainId": {
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
