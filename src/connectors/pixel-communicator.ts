import axios, { type AxiosResponse } from "axios";
import { type Socket, io } from "socket.io-client";
import { PixelAuth } from "./pixel-auth.ts";

const url = "http://127.0.0.01:4018/api/v1";

type IPixelRequest = { method: string; params?: any[] };
type IPixelResult = { data?: any; status?: number };

type IPixelWallet = {
  address: string;
  chainId: number;
};

export class PixelCommunicator {
  protected socket: Socket;
  protected auth = new PixelAuth();
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
    socket.connect();
  }

  public connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }

    this.auth.clean();
  }

  public async send(payload: IPixelRequest): Promise<{ data?: any; status?: number }> {
    this.connect();

    return new Promise((resolve: (result: IPixelResult) => void, reject: (err: Error) => void) => {
      this.socket.emit(`request_${payload.method}`, "", (res: any) => {
        reject(new Error(res.message || "request failed"));
      });

      this.socket.on(`result_${payload.method}`, (result: IPixelResult) => {
        resolve(result);
      });
    });
  }

  public async waitForAddress(): Promise<string> {
    return new Promise((resolve) => {
      this.socket.on(`result_eth_requestAccounts`, (result: string[]) => {
        resolve(result);
      });
    });
  }

  public async waitForChainId(): Promise<number> {
    return new Promise((resolve) => {
      this.socket.on(`result_eth_chainId`, (result: number) => {
        resolve(result);
      });
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
