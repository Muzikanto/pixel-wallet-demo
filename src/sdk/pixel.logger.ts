const prefix = "Pixel";

export const pixelLogger = {
  error: (err: string) => console.error(`[${prefix}]: ${err}`),
  info: (text: string) => console.info(`[${prefix}]: ${text}`),
};
