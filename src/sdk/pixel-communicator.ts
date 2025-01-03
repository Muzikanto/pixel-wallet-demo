import axios, { type AxiosResponse } from "axios";
import { type Socket, io } from "socket.io-client";
import { PixelAuth } from "./pixel-auth";
import {waitForRequestReady} from "./utils";

// const listener = (result: { data: number; }) => {
//   if (!isResolved) {
//     this.socket.off(`result_eth_chainId`, listener);
//     resolve(result?.data || 19);
//   }
// };
//
// this.socket.on(`result_eth_chainId`, listener);

// const url = "http://127.0.0.01:4018/api/v1";

type IPixelRequest = { method: string; params?: any[] };
type IPixelResult = { data?: any; status?: number };

type IPixelWallet = {
  address: string;
  chainId: number;
  confirmedAt?: number;
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
    // if (!this.socket.connected) {
      // this.socket.connect();
    // }
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
    return waitForRequestReady(() => this.getWalletAddress());
  }

  public async waitForChainId(): Promise<number> {
    return waitForRequestReady(() => this.getWalletChainId());
  }

  public async waitForRequest(requestSignature: string): Promise<string> {
    return waitForRequestReady(() => this.getRequestResult(requestSignature));
  }

  public async getWalletAddress() {
    const { data } = await axios.get<{ data: IPixelWallet }, AxiosResponse<{ data: IPixelWallet }>>(
      "/api/v1/wallet/get",
      { baseURL: this.httpUrl, params: { userSignature: this.auth.get() } },
    );

    if (!data?.data?.confirmedAt) {
      return undefined;
    }

    return data?.data?.address;
  }

  public async getWalletChainId() {
    const { data } = await axios.get<{ data: IPixelWallet }, AxiosResponse<{ data: IPixelWallet }>>(
      "/api/v1/wallet/get",
      { baseURL: this.httpUrl, params: { userSignature: this.auth.get() } },
    );

    if (!data?.data?.confirmedAt) {
      return 19;
    }

    return data?.data?.chainId || 19;
  }

  public async createConnection() {
    this.auth.clean();

    const { data } = await axios.post<{ data: any }, AxiosResponse<{ data: any }>>(
        "/api/v2/wallet/connection/create",
        { userSignature: this.auth.get() },
        { baseURL: this.httpUrl },
    );

    return data?.data;
  }

  public async createRequest(requestSignature: string, event: string, eventContext: object) {
    const { data } = await axios.post<{ data: any }, AxiosResponse<{ data: any }>>(
        "/api/v1/wallet/request/create",
        { userSignature: this.auth.get(), signature: requestSignature, event, eventContext },
        { baseURL: this.httpUrl },
    );

    return data?.data;
  }

  public async getRequestResult(requestSignature: string) {
    const { data } = await axios.get<{ data: string }, AxiosResponse<{ data: string }>>(
        "/api/v1/wallet/request/get",
        { baseURL: this.httpUrl, params: { userSignature: this.auth.get(), signature: requestSignature } },
    );

    return data?.data;
  }

  public getRequestSignature() {
    const value = new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * 100_000_000).toString(16))
        .join("-");
    return value;
  }
}
