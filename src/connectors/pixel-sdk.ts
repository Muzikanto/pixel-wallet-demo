import { PixelCommunicator } from "./pixel-communicator.ts";

export class PixelSdk {
  protected listeners: Record<string, Function[]> = {};
  protected communicator = new PixelCommunicator();

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
          // редирект в бота с сигнатурой
          // запуси сигнатуры в локалсторадж
          // ожидание вебсокета от фронта через бек сюда

          const { data: accounts } =  await this.communicator.send({ method: "eth_requestAccounts" });

          return accounts;
        // return this.address ? [this.address] : [];
        case "eth_sendTransaction":
          const { data: hash } =  await this.communicator.send({ method: "eth_sendTransaction", params });

          return hash;
        case "personal_sign":
            const { data: signedHash } =  await this.communicator.send({ method: "eth_sendTransaction", params });

            return signedHash;
        case "wallet_switchEthereumChain":
          // this.chainId = params[0].chainId;
          // this.networkVersion = Number(params[0].chainId);
          // this.eth = this.getEth();
          // this.provider = this.getProvider();
          // this.emit('chainChanged', params[0].chainId);
          return true;
        case "eth_chainId": {
          const { data: chainId } =  await this.communicator.send({ method: "eth_chainId" });

          return chainId;
        }
        case "wallet_addEthereumChain":
        default:
          return null;
      }
    } catch (error) {
      throw error;
    }
  };

  emit = (eventName, params) => {
    this.listeners[eventName]?.map((listener) => {
      listener(params);
    });
  };

  on = (eventType, callback) => {
    let listeners = this.listeners[eventType];

    if (!listeners) {
      this.listeners[eventType] = [];
      listeners = this.listeners[eventType];
    }

    if (!listeners.find((l) => l === callback)) {
      listeners.push(callback);
    }
  };

  removeListener = (eventType, callback) => {
    this.listeners[eventType] = this.listeners[eventType].filter((l) => l !== callback);
  };
}
