import { makeAutoObservable } from "mobx";

class AppStore {
  nfts: NFT[] = [];
  doc: Doc = {
    ipfsClient: null,
  };

  constructor() {
    makeAutoObservable(this);
  }
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  geojson: any;
}

interface NFT {
  id: number;
  geojson: string;
  metadata: NFTMetadata;
}

interface Doc {
  ipfsClient: any | null;
}

export const appStore = new AppStore();
