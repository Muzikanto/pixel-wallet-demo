import { type Socket, io } from "socket.io-client";
import { PixelAuth } from "./pixel-auth.ts";

type IPixelRequest = { method: string; params?: any[]; };
type IPixelResult = { data?: any; status?: number; };

export class PixelCommunicator {
  protected socket: Socket;
  protected auth = new PixelAuth();

  constructor() {
    const socket = io("ws://api.hellopixel.network/sdk", {
      reconnectionDelayMax: 10000,
      auth: {
        signature: this.auth.get(),
      },
      autoConnect: false,
    });

    this.socket = socket;
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
  }

  public async send(payload: IPixelRequest): Promise<{ data: any; abort: () => void; status: number; }> {
    this.connect();

    // switch (payload.method) {
    //     case 'eth_requestAccounts': {
    //         return { data: ['0x50915E1bc60D4E3B7bb9Cda870F5891B97e0e603']};
    //     }
    //     case 'eth_chainId': {
    //         return { data: 19 }
    //     }
    //     default: {
    //         return {};
    //     }
    // }

    this.socket.emit(`request_${payload.method}`, "hello");
    let abort: () => void;

    const { data, status = 200 } = await this.subscribe({ method: payload.method }, (ab) => {
      abort = ab;
    });

    return { data, abort, status };
  }

  protected subscribe(payload: IPixelRequest, getAbort?: (abort: () => void) => void) {
    return new Promise((resolve: (result: IPixelResult) => void, reject: (err: Error) => void) => {
      this.socket.on(`result_${payload.method}`, (result: IPixelResult) => {
        resolve(result);

        getAbort?.(() => reject(new Error("aborted")));
      });
    });
  }
}
