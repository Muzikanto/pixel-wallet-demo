import axios, { type AxiosResponse } from "axios";
import { type Socket, io } from "socket.io-client";
import { PixelAuth } from "./pixel-auth.ts";

const sleep = (time: number) => new Promise(r1 => setTimeout(r1, time));

// const url = "http://127.0.0.01:4018/api/v1";

type IPixelRequest = { method: string; params?: any[] };
type IPixelResult = { data?: any; status?: number };

type IPixelWallet = {
  address: string;
  chainId: number;
};

export class PixelCommunicator {
  protected socket: Socket;
  public auth = new PixelAuth();
  protected readonly httpUrl: string;
  protected readonly wsUrl: string;

  constructor(opts: { url: string }) {
    this.wsUrl = opts.url.includes(":4000") ? "ws://" + opts.url : "wss://" + opts.url;
    this.httpUrl = opts.url.includes(":4000") ? "http://" + opts.url : "https://" + opts.url;

    const socket = io(this.wsUrl, {
      reconnectionDelayMax: 10000,
      auth: {
        signature: this.auth.get(),
      },
      autoConnect: false,
      transports: ["websocket"],
    });

    this.socket = socket;
    // this.connect();
  }

  public connect() {
    if (!this.socket.connected) {
      // this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }

    this.auth.clean();
  }

  public async send(payload: IPixelRequest): Promise<{ data?: any; status?: number }> {
    return new Promise((resolve: (result: IPixelResult) => void, reject: (err: Error) => void) => {
      this.socket.emit(`request_${payload.method}`, "", (res: any) => {
        reject(new Error(res.message || "request failed"));
      });

      const listener = (result: IPixelResult) => {
        this.socket.off(`result_${payload.method}`, listener);
        resolve(result);
      };

      this.socket.on(`result_${payload.method}`, listener);
    });
  }

  public async waitForAddress(): Promise<string | undefined> {
    return new Promise(async (resolve: (result: string | undefined) => void, reject: (err: Error) => void) => {
      // const listener = (result: { data: string[] }) => {
      //   if (!isResolved) {
      //     this.socket.off(`result_eth_requestAccounts`, listener);
      //     resolve(result.data?.[0]);
      //   }
      // };
      //
      // this.socket.on(`result_eth_requestAccounts`, listener);

      for(let i = 0; i < 3;) {
        if (document.hasFocus()) {
          try {
            const res = await this.getWalletAddress();

            if (res) {
              resolve(res);
            }
          } catch {}
          i++;
          await sleep(3000);
        } else {
          await sleep(100);
        }
      }

      reject(new Error('Connection timeout'));
    });
  }

  public async waitForChainId(): Promise<number> {
    return new Promise((resolve: (result: number) => void, reject: (err: Error) => void) => {
      // const listener = (result: { data: number; }) => {
      //   if (!isResolved) {
      //     this.socket.off(`result_eth_chainId`, listener);
      //     resolve(result?.data || 19);
      //   }
      // };
      //
      // this.socket.on(`result_eth_chainId`, listener);

      for(let i = 0; i < 3;) {
        if (document.hasFocus()) {
          try {
            const res = await this.getWalletChainId();

            if (res) {
              resolve(res);
            }
          } catch {}
          i++;
          await sleep(3000);
        } else {
          await sleep(100);
        }
      }

      reject(new Error('Connection timeout'));
    });
  }

  public async getWalletAddress() {
    const { data } = await axios.get<{ data: IPixelWallet }, AxiosResponse<{ data: IPixelWallet }>>(
      "/api/v1/wallet/get",
      { baseURL: this.httpUrl, params: { userSignature: this.auth.get() } },
    );

    return data?.data?.address;
  }

  public async getWalletChainId() {
    const { data } = await axios.get<{ data: IPixelWallet }, AxiosResponse<{ data: IPixelWallet }>>(
      "/api/v1/wallet/get",
      { baseURL: this.httpUrl, params: { userSignature: this.auth.get() } },
    );

    return data?.data?.chainId;
  }
}
