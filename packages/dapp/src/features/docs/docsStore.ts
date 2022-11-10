import { makeAutoObservable } from "mobx";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { DID } from "dids";
import { walletStore } from "../wallet/walletStore";
import { NFTMetadata } from "../nfts/nftsStore";

class DocsStore {
  ceramic: CeramicClient | null = null;
  nftDocuments: Record<number, string> = {};

  constructor() {
    makeAutoObservable(this);
  }

  readDocument = async (docId: string): Promise<NFTMetadata> => {
    if (!this.ceramic) {
      this.ceramic = await this.createCeramicClient();
    }

    const doc = await TileDocument.load(this.ceramic, docId);
    return doc.content as NFTMetadata;
  };

  writeDocument = async (metadata: NFTMetadata): Promise<string> => {
    try {
      if (!this.ceramic) {
        this.ceramic = await this.createCeramicClient();
      }

      if (
        this.ceramic === undefined ||
        this.ceramic === null ||
        this.ceramic.did === undefined ||
        this.ceramic.did === null
      ) {
        throw new Error("Ceramic or did provider not initialized");
      }

      const createStreamOptions = {
        controllers: [this.ceramic.did.id],
      };
      const doc = await TileDocument.create(
        this.ceramic,
        metadata,
        createStreamOptions
      );

      return doc.id.toString();
    } catch (error) {
      console.log("Error writing document", error);
      throw error;
    }
  };

  updateDocument = async (
    nftId: number,
    metadata: NFTMetadata
  ): Promise<void> => {
    try {
      const documentId = this.nftDocuments[nftId];

      if (!documentId) {
        throw new Error("Document not found");
      }

      if (!this.ceramic) {
        this.ceramic = await this.createCeramicClient();
      }

      const document = await TileDocument.load(this.ceramic, documentId);
      await document.update(metadata);
    } catch (error) {
      console.log("Error updating document", error);
      throw error;
    }
  };

  private createCeramicClient = async (): Promise<CeramicClient> => {
    const { provider, address } = walletStore;

    if (!provider || !address) {
      throw new Error("Wallet not connected");
    }

    const authProvider = new EthereumAuthProvider(provider, address);
    const threeIdConnect = new ThreeIdConnect();
    console.log("connecting to 3id");
    await threeIdConnect.connect(authProvider);

    const DEFAULT_CERAMIC_HOST = "https://ceramic-clay.3boxlabs.com";
    const ceramic = new CeramicClient(DEFAULT_CERAMIC_HOST);

    const resolver = {
      ...ThreeIdResolver.getResolver(ceramic),
    };

    const did = new DID({ resolver });
    ceramic.setDID(did);

    const didProvider = await threeIdConnect.getDidProvider();
    console.log("ceramic.did:", ceramic.did);
    if (ceramic.did !== undefined && ceramic.did !== null) {
      await ceramic.did.setProvider(didProvider);
      await ceramic.did.authenticate();
    }

    return ceramic;
  };
}

export const docsStore = new DocsStore();
