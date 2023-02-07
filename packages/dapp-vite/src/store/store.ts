import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import { Contract } from "ethers";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { create as createIpfsClient, IPFSHTTPClient } from "ipfs-http-client";
import Map from "ol/Map";
import { Buffer } from "buffer";
import { writeCeramicDocument, updateCeramicDocument } from "../features/docs";
import {
  NFT,
  NFTId,
  NFTMetadata,
  mintGeoNFT,
  updateGeoNFTGeojson,
} from "../features/nfts";

type EditMode = "CREATE" | "UPDATE_METADATA" | "UPDATE_GEOMETRY" | "IDLE";

export class Store {
  nfts: NFT[];
  nftContract: Contract;
  ipfsClient: IPFSHTTPClient;
  ceramic: CeramicClient;
  editNft: NFT | null = null;
  editMode: EditMode = "IDLE";
  map: Map | null = null;

  constructor(nftContract: Contract, ceramic: CeramicClient, nfts: NFT[]) {
    // This will make the whole class observable to any changes
    makeAutoObservable(this);
    this.nftContract = nftContract;
    this.ceramic = ceramic;
    this.nfts = nfts;
    this.ipfsClient = createIpfsClient(ipfsOptions);
  }

  mint = async (
    metadata: NFTMetadata,
    geojson: string,
    address: string | undefined
  ): Promise<NFTId> => {
    console.log("minting");

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
    geojson: string,
    address: string | undefined
  ): Promise<boolean> => {
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
    const updatedNfts = this.nfts.map((nft) => {
      if (nft.metadataURI === docId) {
        return { ...nft, metadata };
      }
      return nft;
    });

    this.setNfts(updatedNfts);
  };

  setNfts = (nfts: NFT[]): void => {
    this.nfts = nfts;
  };

  setEditMode(mode: EditMode): void {
    this.editMode = mode;
  }

  setEditNft = (nft: NFT | null): void => {
    this.editNft = nft;
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
        import.meta.env.VITE_PROJECT_ID +
          ":" +
          import.meta.env.VITE_PROJECT_SECRET
      ).toString("base64"),
  },
};

export const StoreContext = createContext<Store | null>(null);
export const useStore = (): Store => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("Store must be used within a StoreProvider");
  }
  return store;
};
