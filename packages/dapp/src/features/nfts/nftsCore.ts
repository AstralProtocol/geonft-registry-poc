import { ethers, BigNumber, Contract } from "ethers";
import { TransactionReceipt } from "@ethersproject/providers";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { readCeramicDocument } from "../docs/docsCore";
import networkMapping from "../../deployments.json";

export type NFTId = number;
export interface NFT {
  id: NFTId;
  geojson: string;
  metadataURI: string;
  metadata: NFTMetadata;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

// The retrieval of the GeoNFTs from the contract is made in the following steps:
// 1. Get all the tokens owned by the user.
// 2. For each token, get the metadata URI and retrieve the metadata from Ceramic.
// 3. Create the NFT object with id, metadata and geojson, an return the array of NFTs.
export const getGeoNFTsByOwner = async (
  geoNFTContract: Contract,
  address: string,
  ceramic: CeramicClient
): Promise<NFT[]> => {
  const result = await geoNFTContract.getTokensByOwner(address);
  const { 0: nftIds, 1: metadataURIs, 2: geojsons } = result;

  // For each metadata URI, create a read document promise
  const metadataPromises: Promise<NFTMetadata>[] = metadataURIs.map(
    (metadataURI: string) => {
      // We do not await in order to return the Promise
      console.log("READING METADATA", metadataURI);
      return readCeramicDocument<NFTMetadata>(ceramic, metadataURI);
    }
  );
  // Wait for all promises to resolve. This way we can load all metadata in parallel
  const metadataList: NFTMetadata[] = await Promise.all(metadataPromises);

  // For each token, create NFT object by the id, metadata and geojson
  const nfts: NFT[] = nftIds.map((nftId: BigNumber, i: number) => {
    const id = BigNumber.from(nftId).toNumber();
    const metadataURI = metadataURIs[i];
    const metadata = metadataList[i];
    const geojson = geojsons[i];
    return {
      id,
      geojson,
      metadataURI,
      metadata,
    };
  });
  return nfts;
};

export const getGeoNFTContract = async (provider: any): Promise<Contract> => {
  try {
    const web3provider = new ethers.providers.Web3Provider(provider);
    const signer = web3provider.getSigner();
    const chainId: number = await (await web3provider.getNetwork()).chainId;
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
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const mintGeoNFT = async (
  nftContract: Contract,
  address: string,
  nftParams: NFTMintParams
): Promise<number> => {
  const { metadataURI, geojson } = nftParams;
  try {
    const tx = await nftContract.safeMint(address, metadataURI, geojson);
    console.log("mint tx hash:", tx.hash);
    console.log("mint tx:", tx);
    const contractReceipt: TransactionReceipt = await tx.wait();
    console.log("transaction receipt:", contractReceipt);

    if (contractReceipt.status !== 1) {
      throw new Error("Transaction failed");
    }

    console.log("mint tx success");
    // get nft id from receipt
    const id = BigNumber.from(contractReceipt.logs[0].topics[3]).toNumber();

    return id;
  } catch (error) {
    console.log("Error minting:", error);
    throw error;
  }
};

export const updateGeoNFTGeojson = async (
  nftContract: Contract,
  nftId: number,
  geojson: string
): Promise<void> => {
  try {
    const tx = await nftContract.setGeoJson(nftId, geojson);
    console.log("update geojson tx hash:", tx.hash);
    console.log("update geojson tx:", tx);
    const contractReceipt: TransactionReceipt = await tx.wait();
    console.log("transaction receipt:", contractReceipt);

    if (contractReceipt.status !== 1) {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    console.error("Error updating geojson:", error);
  }
};

interface NFTMintParams {
  metadataURI: string;
  geojson: string;
}
