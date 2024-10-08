import { ChainNotConfiguredError, createConnector } from "@wagmi/core";
import { SwitchChainError, UserRejectedRequestError, getAddress, numberToHex } from "viem";
import { PixelSdk } from "../sdk/pixel-sdk";

pixelWallet.type = "pixelWallet";

export function pixelWallet(parameters: { url?: string; botUrl?: string; } = {}) {
  let walletProvider: any;
  let accountsChanged: any;
  let chainChanged: any;
  let disconnect: any;

  return createConnector((config) => {
    const connector = {
      id: "pixelWalletSdk",
      name: "Pixel Wallet",
      supportsSimulation: true,
      type: pixelWallet.type,
      async connect({ chainId }: { chainId?: number } = {}) {
        try {
          const provider = await this.getProvider();

          const accounts = (
            await provider.request({
              method: "eth_requestAccounts",
            })
          ).map((x: string) => getAddress(x));

          if (!accountsChanged) {
            accountsChanged = this.onAccountsChanged.bind(this);
            provider.on("accountsChanged", accountsChanged);
          }
          if (!chainChanged) {
            chainChanged = this.onChainChanged.bind(this);
            provider.on("chainChanged", chainChanged);
          }
          if (!disconnect) {
            disconnect = this.onDisconnect.bind(this);
            provider.on("disconnect", disconnect);
          }

          // Switch to chain if provided
          let currentChainId = await this.getChainId();

          if (chainId && currentChainId !== chainId) {
            const chain = await this.switchChain({ chainId }).catch((error) => {
              if (error.code === UserRejectedRequestError.code) throw error;
              return { id: currentChainId };
            });
            currentChainId = chain?.id ?? currentChainId;
          }
          return { accounts, chainId: currentChainId };
        } catch (error) {
          if (
            /(user closed modal|accounts received is empty|user denied account|request rejected)/i.test(
              (error as Error).message,
            )
          )
            throw new UserRejectedRequestError(error as Error);
          throw error;
        }
      },
      async disconnect() {
        const provider = await this.getProvider();
        if (accountsChanged) {
          provider.removeListener("accountsChanged", accountsChanged);
          accountsChanged = undefined;
        }
        if (chainChanged) {
          provider.removeListener("chainChanged", chainChanged);
          chainChanged = undefined;
        }
        if (disconnect) {
          provider.removeListener("disconnect", disconnect);
          disconnect = undefined;
        }
        provider.disconnect();
        provider.close?.();
      },
      async getAccounts() {
        const provider = await this.getProvider();
        return (
          await provider.request({
            method: "eth_accounts",
          })
        ).map((x: string) => getAddress(x));
      },
      async getChainId() {
        const provider = await this.getProvider();
        const chainId = await provider.request({
          method: "eth_chainId",
        });
        return Number(chainId);
      },
      async getProvider() {
        if (!walletProvider) {
          walletProvider = new PixelSdk({ url: parameters.url, botUrl: parameters.botUrl });
          return walletProvider;
        }
        return walletProvider;
      },
      async isAuthorized() {
        try {
          const accounts = await this.getAccounts();
          return !!accounts.length;
        } catch {
          return false;
        }
      },
      async switchChain({ addEthereumChainParameter, chainId }: { addEthereumChainParameter?: any; chainId: number }) {
        const chain = config.chains.find((chain) => chain.id === chainId);
        if (!chain) throw new SwitchChainError(new ChainNotConfiguredError());
        const provider = await this.getProvider();
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: numberToHex(chain.id) }],
          });
          return chain;
        } catch (error) {
          // Indicates chain is not added to provider
          if ((error as any).code === 4902) {
            try {
              let blockExplorerUrls;
              if (addEthereumChainParameter?.blockExplorerUrls)
                blockExplorerUrls = addEthereumChainParameter.blockExplorerUrls;
              else blockExplorerUrls = chain.blockExplorers?.default.url ? [chain.blockExplorers?.default.url] : [];
              let rpcUrls;
              if (addEthereumChainParameter?.rpcUrls?.length) rpcUrls = addEthereumChainParameter.rpcUrls;
              else rpcUrls = [chain.rpcUrls.default?.http[0] ?? ""];
              const addEthereumChain = {
                blockExplorerUrls,
                chainId: numberToHex(chainId),
                chainName: addEthereumChainParameter?.chainName ?? chain.name,
                iconUrls: addEthereumChainParameter?.iconUrls,
                nativeCurrency: addEthereumChainParameter?.nativeCurrency ?? chain.nativeCurrency,
                rpcUrls,
              };
              await provider.request({
                method: "wallet_addEthereumChain",
                params: [addEthereumChain],
              });
              return chain;
            } catch (error) {
              throw new UserRejectedRequestError(error as Error);
            }
          }
          throw new SwitchChainError(error as Error);
        }
      },
      onAccountsChanged(accounts: string[]) {
        if (accounts.length === 0) this.onDisconnect();
        else
          config.emitter.emit("change", {
            accounts: accounts.map((x) => getAddress(x)),
          });
      },
      onChainChanged(chain: string) {
        const chainId = Number(chain);
        config.emitter.emit("change", { chainId });
      },
      async onDisconnect(_error?: Error) {
        config.emitter.emit("disconnect");
        const provider = await this.getProvider();

        if (accountsChanged) {
          provider.removeListener("accountsChanged", accountsChanged);
          accountsChanged = undefined;
        }
        if (chainChanged) {
          provider.removeListener("chainChanged", chainChanged);
          chainChanged = undefined;
        }
        if (disconnect) {
          provider.removeListener("disconnect", disconnect);
          disconnect = undefined;
        }
      },
    };

    return connector;
  });
}
