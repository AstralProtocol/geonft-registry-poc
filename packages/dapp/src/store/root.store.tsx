import { createContext, useContext } from "react";
import { WalletStore } from "./wallet.store";
import { DocsStore } from "./docs.store";
import { NFTsStore } from "./nfts.store";

export class RootStore {
  walletStore: WalletStore;
  docsStore: DocsStore;
  nftsStore: NFTsStore;

  constructor() {
    this.walletStore = new WalletStore();
    this.docsStore = new DocsStore();
    this.nftsStore = new NFTsStore();
  }
}

export const RootStoreContext = createContext(new RootStore());
export const useStore = () => {
  const store = useContext(RootStoreContext);

  if (!store) {
    throw new Error("Store not initialized");
  }

  return store;
};
