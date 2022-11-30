import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { ethers, Contract } from "ethers";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { walletStore, WalletStore } from "../wallet/walletStore";
import { docsStore } from "../docs/docsStore";
import {
  NFT,
  NFTMetadata,
  getGeoNFTsByOwner,
  mintGeoNFT,
  updateGeoNFTGeojson,
} from "./nftsCore";

export class NFTsStore {
  walletStore: WalletStore;
  nfts: NFT[] = [];
  nftContract: Contract;
  ceramic: CeramicClient;
  editNft: NFT | null = null;
  isBusyMinting = false;
  isBusyFetching = false;

  constructor(
    walletStore: WalletStore,
    nftContract: Contract,
    ceramic: CeramicClient
  ) {
    // This will make the whole class observable to any changes
    makeAutoObservable(this);
    this.walletStore = walletStore;
    this.nftContract = nftContract;
    this.ceramic = ceramic;
  }

  fetchNFTs = async (): Promise<void> => {
    console.log("fetching");
    this.isBusyFetching = true;

    try {
      const { provider, address } = this.walletStore;
      console.log("provider", provider);
      const web3Provider = new ethers.providers.Web3Provider(provider);

      if (!web3Provider || !address) {
        throw new Error("Web3 provider not initialized");
      }

      // Get a list of NFTs owned by the user
      console.log("Getting NFTs");
      const nfts = await getGeoNFTsByOwner(
        this.nftContract,
        address,
        this.ceramic
      );
      this.nfts = nfts;
    } catch (error) {
      console.error(error);
    }

    this.isBusyFetching = false;
  };

  mint = async (metadataURI: string, geojson: string): Promise<void> => {
    console.log("minting");
    this.isBusyMinting = true;

    try {
      const { address } = this.walletStore;

      if (!address) {
        throw new Error("Address not defined");
      }

      if (!this.nftContract) {
        throw new Error("GeoNFT contract not initialized");
      }

      const id = await mintGeoNFT(this.nftContract, address, {
        metadataURI,
        geojson,
      });
      const metadata = await docsStore.readDocument(metadataURI);
      const newNFT = {
        id,
        metadataURI,
        metadata,
        geojson,
      };
      this.nfts.push(newNFT);
    } catch (error) {
      console.error(error);
    }
  };

  updateNftGeojson = async (
    nftId: number,
    geojson: string
  ): Promise<boolean> => {
    const { address } = this.walletStore;

    if (!address) {
      throw new Error("Address not defined");
    }

    if (!this.nftContract) {
      throw new Error("GeoNFT contract not initialized");
    }

    try {
      await updateGeoNFTGeojson(this.nftContract, nftId, geojson);

      console.log("update geojson tx success");
      // get nft id from receipt
      const updatedNft = this.nfts.find((nft) => nft.id === nftId);

      if (updatedNft) {
        // TODO: Get updated geojson from contract and use its geojson
        updatedNft.geojson = geojson;
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  };

  updateNftMetadata = async (
    docId: string,
    metadata: NFTMetadata
  ): Promise<void> => {
    await docsStore.updateDocument(docId, metadata);
    // Update store nft with the new metadata
    this.nfts = this.nfts.map((nft) => {
      if (nft.metadataURI === docId) {
        return { ...nft, metadata };
      }
      return nft;
    });
  };
}

export const NftsStoreContext = createContext<NFTsStore | null>(null);
export const useNftsStore = (): NFTsStore => {
  const store = useContext(NftsStoreContext);
  if (!store) {
    throw new Error("NFTs store must be used within a WalletStoreProvider");
  }
  return store;
};
