import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { ethers, Contract } from "ethers";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { create as createIpfsClient, IPFSHTTPClient } from "ipfs-http-client";
import Map from "ol/Map";
import { Buffer } from "buffer";
import { WalletStore } from "../wallet/walletStore";
import {
  // readCeramicDocument,
  writeCeramicDocument,
  updateCeramicDocument,
} from "../docs/docsCore";
import {
  NFT,
  NFTId,
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
  ipfsClient: IPFSHTTPClient;
  editNft: NFT | null = null;
  editMode: "CREATE" | "UPDATE_METADATA" | "UPDATE_GEOMETRY" | "IDLE" = "IDLE";
  map: Map | null = null;
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
    this.ipfsClient = createIpfsClient(ipfsOptions);
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

  mint = async (metadata: NFTMetadata, geojson: string): Promise<NFTId> => {
    console.log("minting");
    this.isBusyMinting = true;

    const { address } = this.walletStore;

    if (!address) {
      throw new Error("Address not defined");
    }

    if (!this.nftContract) {
      throw new Error("GeoNFT contract not initialized");
    }

    const metadataURI = await writeCeramicDocument<NFTMetadata>(
      this.ceramic,
      metadata
    );

    const id = await mintGeoNFT(this.nftContract, address, {
      metadataURI,
      geojson,
    });
    // It's redundant, but it may be better to refetch the metadata from Ceramic
    // const newFetchedMetadata = await readCeramicDocument<NFTMetadata>(
    //   this.ceramic,
    //   metadataURI
    // );
    const newNFT = {
      id,
      metadataURI,
      metadata,
      geojson,
    };
    this.nfts.push(newNFT);
    return id;
  };

  storeImageOnIpfs = async (file: File): Promise<string> => {
    const added = await this.ipfsClient.add(file, {
      progress: (prog: any) => console.log(`received: ${prog}`),
    });
    const IpfsImagePath = added.path;
    return IpfsImagePath;
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
    await updateCeramicDocument<NFTMetadata>(this.ceramic, docId, metadata);
    // Update store nft with the new metadata
    this.nfts = this.nfts.map((nft) => {
      if (nft.metadataURI === docId) {
        return { ...nft, metadata };
      }
      return nft;
    });
  };
}

const ipfsOptions = {
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  apiPath: "/api/v0",
  headers: {
    authorization:
      "Basic " +
      Buffer.from(
        process.env.REACT_APP_PROJECT_ID +
          ":" +
          process.env.REACT_APP_PROJECT_SECRET
      ).toString("base64"),
  },
};

export const NftsStoreContext = createContext<NFTsStore | null>(null);
export const useNftsStore = (): NFTsStore => {
  const store = useContext(NftsStoreContext);
  if (!store) {
    throw new Error("NFTs store must be used within a WalletStoreProvider");
  }
  return store;
};
