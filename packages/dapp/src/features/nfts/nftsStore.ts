import { makeAutoObservable } from "mobx";
import { ethers, BigNumber, Contract } from "ethers";
import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import { walletStore } from "../wallet/walletStore";
import networkMapping from "./../../deployments.json";
import { docsStore } from "../docs/docsStore";

class NFTsStore {
  nfts: NFT[] = [];
  geoNFTContract: Contract | null = null;
  editNft: NFT | null = null;
  isBusyMinting = false;
  isBusyFetching = false;

  constructor() {
    makeAutoObservable(this);
  }

  fetchNFTs = async (): Promise<void> => {
    console.log("fetching");
    this.isBusyFetching = true;

    try {
      const { provider, address, ipfsClient } = walletStore;
      const web3Provider = new ethers.providers.Web3Provider(provider);
      const nfts: NFT[] = [];

      if (!web3Provider || !address || !ipfsClient) {
        throw new Error("Web3 provider not initialized");
      }

      if (!this.geoNFTContract) {
        this.geoNFTContract = await this.getGeoNFTContract(web3Provider);
      }

      // Get a list of NFTs owned by the user
      try {
        const result = await this.geoNFTContract.getTokensByOwner(address);
        const { 0: tokenIds, 1: metadataURIs, 2: geojsons } = result;
        console.log(tokenIds);
        console.log(metadataURIs);
        console.log(geojsons);

        if (ipfsClient === null) {
          throw new Error("IPFS client not initialized");
        }

        // For each tokenId, push to the list of NFTs
        for (let i = 0; i < tokenIds.length; i++) {
          const metadataURI = metadataURIs[i];
          // TODO: Load ceramic data in parallel
          const metadata = await docsStore.readDocument(metadataURI);
          const nftId = BigNumber.from(tokenIds[i]).toNumber();

          nfts.push({
            id: nftId,
            metadata: metadata,
            geojson: geojsons[i],
          });

          docsStore.nftDocuments[nftId] = metadataURI;
        }

        console.log("NFTS: ", nfts);
        this.nfts = nfts;
      } catch (error) {
        console.log("Error fetching NFT list:", error);
        throw error;
      }
    } catch (error) {
      console.error(error);
    }

    this.isBusyFetching = false;
  };

  mint = async ({
    metadataURI,
    geojson,
  }: {
    metadataURI: string;
    geojson: string;
  }): Promise<void> => {
    console.log("fetching");

    try {
      const { address, ipfsClient } = walletStore;
      const newNFT = {} as NFT;

      if (!ipfsClient) {
        throw new Error("IPFS client not initialized");
      }

      if (!address) {
        throw new Error("Address not defined");
      }

      if (!this.geoNFTContract) {
        throw new Error("GeoNFT contract not initialized");
      }

      try {
        await this.geoNFTContract
          .safeMint(address, metadataURI, geojson)
          .then(async (tx: TransactionResponse) => {
            console.log("mint tx hash:", tx.hash);
            console.log("mint tx:", tx);
            const contractReceipt: TransactionReceipt = await tx.wait();
            console.log("transaction receipt:", contractReceipt);

            if (contractReceipt.status !== 1) {
              throw new Error("Transaction failed");
            }

            console.log("mint tx success");
            // get nft id from receipt
            newNFT.id = BigNumber.from(
              contractReceipt.logs[0].topics[3]
            ).toNumber();
            newNFT.geojson = geojson;

            const metadata = await docsStore.readDocument(metadataURI);
            newNFT.metadata = metadata;

            this.nfts.push(newNFT);
          });
      } catch (error) {
        console.log("Error minting:", error);
        throw error;
      }
    } catch (error) {
      console.error(error);
    }
  };

  updateNftMetadata = async (
    nftId: number,
    metadata: NFTMetadata
  ): Promise<void> => {
    await docsStore.updateDocument(nftId, metadata);
    this.nfts = this.nfts.map((nft) => {
      if (nft.id === nftId) {
        return { ...nft, metadata };
      }
      return nft;
    });
  };

  private getGeoNFTContract = async (
    provider: ethers.providers.Web3Provider
  ): Promise<Contract> => {
    const signer = provider.getSigner();
    const chainId: number = await (await provider.getNetwork()).chainId;
    const chainIdStr: string = chainId.toString();
    console.log(`Connected on chain ${chainId}`);

    const networkMappingForChain =
      networkMapping[chainIdStr as keyof typeof networkMapping];

    if (networkMappingForChain === undefined) {
      throw new Error("No network mapping found");
    }

    const geoNFTMapping = networkMappingForChain[0]["contracts"]["GeoNFT"];
    const geoNFTContract = new Contract(
      geoNFTMapping.address,
      geoNFTMapping.abi,
      signer
    );

    return geoNFTContract;
  };
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

export interface NFT {
  id: number;
  geojson: string;
  metadata: NFTMetadata;
}

export const nftsStore = new NFTsStore();
