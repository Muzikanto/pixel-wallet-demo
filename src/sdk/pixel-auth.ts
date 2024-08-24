const PIXEL_AUTH_KEY = "pixel-auth-secret";

export class PixelAuth {
  public get() {
    const secret = this.read();

    if (!secret) {
      return this.write();
    }

    return secret;
  }

  public clean() {
    localStorage.removeItem(PIXEL_AUTH_KEY);
  }

  protected read() {
    return localStorage.getItem(PIXEL_AUTH_KEY);
  }

  protected write() {
    const secret = this.getSecret();
    localStorage.setItem(PIXEL_AUTH_KEY, secret);

    return secret;
  }

  protected getSecret() {
    const value = new Array(4)
      .fill(0)
      .map(() => Math.floor(Math.random() * 100_000_000).toString(16))
      .join("-");
    return value;
  }
}
