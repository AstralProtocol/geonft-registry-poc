import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { DIDSession } from "did-session";
import { EthereumWebAuth, getAccountId } from "@didtools/pkh-ethereum";
import type { AuthMethod } from "@didtools/cacao";

export const createCeramicClient = async (
  provider: any,
  address: string
): Promise<CeramicClient> => {
  const accountId = await getAccountId(provider, address);
  const authMethod = await EthereumWebAuth.getAuthMethod(provider, accountId);
  const session = await loadSession(authMethod);
  const ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com");
  ceramic.did = session.did;
  return ceramic;
};

const loadSession = async (authMethod: AuthMethod): Promise<DIDSession> => {
  const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;
  // TODO: Find a better way to storage the session DID
  const sessionStr = localStorage.getItem("didsession");
  let session;

  if (sessionStr) {
    session = await DIDSession.fromSession(sessionStr);
  }

  if (!session || (session.hasSession && session.isExpired)) {
    session = await DIDSession.authorize(authMethod, {
      resources: ["ceramic://*"],
      expiresInSecs: ONE_WEEK_IN_SECONDS,
    });
    localStorage.setItem("didsession", session.serialize());
  }

  return session;
};

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
