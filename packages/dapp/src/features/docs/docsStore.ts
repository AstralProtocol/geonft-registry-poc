import { makeAutoObservable } from "mobx";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { walletStore } from "../wallet/walletStore";
import { NFTMetadata } from "../nfts/nftsStore";
import {
  createCeramicClient,
  readCeramicDocument,
  writeCeramicDocument,
  updateCeramicDocument,
} from "./docsCore";

class DocsStore {
  ceramic: CeramicClient | null = null;
  nftDocuments: Record<number, string> = {};

  constructor() {
    // This will make the whole class observable to any changes
    makeAutoObservable(this);
  }

  readDocument = async (docId: string): Promise<NFTMetadata> => {
    try {
      if (!this.ceramic) {
        this.ceramic = await this.createCeramicClient();
      }

      const documentContent = await readCeramicDocument<NFTMetadata>(
        this.ceramic,
        docId
      );
      return documentContent;
    } catch (error) {
      console.error("Error reading document", error);
      throw error;
    }
  };

  writeDocument = async (metadata: NFTMetadata): Promise<string> => {
    try {
      if (!metadata) {
        throw new Error("Metadata not found");
      }

      if (!this.ceramic) {
        this.ceramic = await this.createCeramicClient();
      }

      const docId = await writeCeramicDocument<NFTMetadata>(
        this.ceramic,
        metadata
      );
      return docId;
    } catch (error) {
      console.error("Error writing document", error);
      throw error;
    }
  };

  updateDocument = async (
    nftId: number,
    metadata: NFTMetadata
  ): Promise<void> => {
    try {
      const docId = this.nftDocuments[nftId];

      if (!docId) {
        throw new Error("Document not found");
      }

      if (!metadata) {
        throw new Error("Metadata not found");
      }

      if (!this.ceramic) {
        this.ceramic = await this.createCeramicClient();
      }

      await updateCeramicDocument<NFTMetadata>(this.ceramic, docId, metadata);
    } catch (error) {
      console.error("Error updating document", error);
      throw error;
    }
  };

  private createCeramicClient = async (): Promise<CeramicClient> => {
    try {
      const { provider, address } = walletStore;

      if (!provider || !address) {
        throw new Error("Wallet not connected");
      }

      const ceramic = await createCeramicClient(address, provider);
      return ceramic;
    } catch (error) {
      console.error("Error creating ceramic client", error);
      throw error;
    }
  };
}

export const docsStore = new DocsStore();
