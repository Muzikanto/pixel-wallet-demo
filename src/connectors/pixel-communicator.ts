import { type Socket, io } from "socket.io-client";
import { PixelAuth } from "./pixel-auth.ts";

type IPixelRequest = { method: string; params?: any[] };
type IPixelResult = { data?: any; status?: number };

// const uri = 'ws://api.hellopixel.network/sdk';
// const uri = "ws://0.0.0.0:4000";

export class PixelCommunicator {
  protected socket: Socket;
  protected auth = new PixelAuth();

  constructor(opts: { url: string }) {
    const socket = io(this.url, {
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
}
