import { makeAutoObservable } from "mobx";
import { ethers, Contract } from "ethers";
import networkMapping from "./../../deployments.json";
import { walletStore } from "../wallet/walletStore";
import { docsStore } from "../docs/docsStore";
import {
  NFT,
  NFTMetadata,
  getGeoNFTContract,
  getGeoNFTsByOwner,
  mintGeoNFT,
  updateGeoNFTGeojson,
} from "./nftsCore";

class NFTsStore {
  nfts: NFT[] = [];
  geoNFTContract: Contract | null = null;
  editNft: NFT | null = null;
  isBusyMinting = false;
  isBusyFetching = false;

  constructor() {
    // This will make the whole class observable to any changes
    makeAutoObservable(this);
  }

  fetchNFTs = async (): Promise<void> => {
    console.log("fetching");
    this.isBusyFetching = true;

    try {
      const { provider, address } = walletStore;
      let { ceramic } = docsStore;
      const web3Provider = new ethers.providers.Web3Provider(provider);

      if (!web3Provider || !address) {
        throw new Error("Web3 provider not initialized");
      }

      if (!ceramic) {
        // throw new Error("Ceramic not initialized");
        ceramic = await docsStore.createCeramicClient();
        docsStore.ceramic = ceramic;
      }

      if (!this.geoNFTContract) {
        this.geoNFTContract = await getGeoNFTContract(
          web3Provider,
          networkMapping
        );
      }

      // Get a list of NFTs owned by the user
      const nfts = await getGeoNFTsByOwner(
        this.geoNFTContract,
        address,
        ceramic
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
      const { address } = walletStore;

      if (!address) {
        throw new Error("Address not defined");
      }

      if (!this.geoNFTContract) {
        throw new Error("GeoNFT contract not initialized");
      }

      const id = await mintGeoNFT(this.geoNFTContract, address, {
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
    const { address } = walletStore;

    if (!address) {
      throw new Error("Address not defined");
    }

    if (!this.geoNFTContract) {
      throw new Error("GeoNFT contract not initialized");
    }

    try {
      await updateGeoNFTGeojson(this.geoNFTContract, nftId, geojson);

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

export const nftsStore = new NFTsStore();
