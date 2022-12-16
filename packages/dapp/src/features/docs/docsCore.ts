import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import { DID } from "dids";

// DocumentContent is a generic type that can be passed to define the content of a document
// In this context, it would be the NFTMetadata type passed on function execution
export const readCeramicDocument = async <DocumentContent>(
  ceramic: CeramicClient,
  docId: string
): Promise<DocumentContent> => {
  console.log("Reading document", docId);
  const doc = await TileDocument.load(ceramic, docId);
  console.log("DOC: ", doc);
  return doc.content as DocumentContent;
};

export const writeCeramicDocument = async <DocumentContent>(
  ceramic: CeramicClient,
  metadata: DocumentContent
): Promise<string> => {
  if (!ceramic || !ceramic.did) {
    throw new Error("Ceramic or did provider not initialized");
  }

  const createStreamOptions = {
    controllers: [ceramic.did.id],
  };

  const doc = await TileDocument.create(ceramic, metadata, createStreamOptions);
  return doc.id.toString();
};

export const updateCeramicDocument = async <DocumentContent>(
  ceramic: CeramicClient,
  docId: string,
  metadata: DocumentContent
): Promise<void> => {
  const document = await TileDocument.load(ceramic, docId);
  await document.update(metadata);
};

export const createCeramicClient = async (
  provider: any,
  address: string
): Promise<CeramicClient> => {
  if (!provider || !address) {
    throw new Error("Wallet or provider not found");
  }

  console.log("PROVIDER: ", provider);
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

  if (!ceramic.did) {
    throw new Error("Ceramic did not initialized");
  }

  await ceramic.did.setProvider(didProvider);
  await ceramic.did.authenticate();

  return ceramic;
};
