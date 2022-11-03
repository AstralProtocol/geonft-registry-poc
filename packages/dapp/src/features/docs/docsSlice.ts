import {
  AnyAction,
  createAsyncThunk,
  createSlice,
  Dispatch,
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

import { StreamID } from "@ceramicnetwork/streamid";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { DID } from "dids";

type AsyncThunkConfig = {
  state: RootState;
  dispatch?: Dispatch<AnyAction>;
  extra?: unknown;
  rejectValue?: unknown;
};

export const writeDocument = createAsyncThunk<
  { doc: CeramicDoc; ceramic: CeramicClient },
  void,
  AsyncThunkConfig
>("docs/writeDocument", async (action, thunkAPI) => {
  try {
    let ceramic = thunkAPI.getState().docs.ceramic;

    if (!ceramic) {
      const { provider, address } = thunkAPI.getState().wallet;
      const authProvider = new EthereumAuthProvider(provider, address);

      const threeIdConnect = new ThreeIdConnect();
      console.log("connecting to 3id");
      await threeIdConnect.connect(authProvider);

      const DEFAULT_CERAMIC_HOST = "https://ceramic-clay.3boxlabs.com";
      ceramic = new CeramicClient(DEFAULT_CERAMIC_HOST);

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
    }

    if (
      ceramic !== undefined &&
      ceramic !== null &&
      ceramic.did !== undefined &&
      ceramic.did !== null
    ) {
      const writeStream = await TileDocument.create(
        ceramic,
        {
          date: new Date().toISOString(),
          latitude: -87.6298,
          longitude: 41.8781,
          name: "WEATHER STN #1",
          prcp: 1.2,
          tmax: 30,
          tmin: 10,
          snow: 0,
          wind: 1,
        },
        {
          controllers: [ceramic.did.id],
        }
      );

      const readStream = await ceramic.loadStream<TileDocument>(writeStream.id);
      const doc: CeramicDoc = {
        docID: readStream.id,
        docContent: readStream.content,
      };

      return {
        doc: doc,
        ceramic: ceramic,
      };
    } else {
      throw new Error("Ceramic or did provider not initialized");
    }
  } catch (error) {
    console.log("Error writing document", error);
    throw error;
  }
});

export const readDocument = createAsyncThunk<
  { doc: CeramicDoc; ceramic: CeramicClient },
  void,
  AsyncThunkConfig
>("docs/readDocument", async (action, thunkAPI) => {
  try {
    let ceramic = thunkAPI.getState().docs.ceramic;

    if (!ceramic) {
      const { provider, address } = thunkAPI.getState().wallet;
      const authProvider = new EthereumAuthProvider(provider, address);

      const threeIdConnect = new ThreeIdConnect();
      console.log("connecting to 3id");
      await threeIdConnect.connect(authProvider);

      const DEFAULT_CERAMIC_HOST = "https://ceramic-clay.3boxlabs.com";
      ceramic = new CeramicClient(DEFAULT_CERAMIC_HOST);

      const resolver = {
        ...ThreeIdResolver.getResolver(ceramic),
      };

      const did = new DID({ resolver });
      ceramic.setDID(did);

      const didProvider = await threeIdConnect.getDidProvider();
      if (ceramic.did !== undefined && ceramic.did !== null) {
        await ceramic.did.setProvider(didProvider);
        await ceramic.did.authenticate();
      }
    }

    if (
      ceramic !== undefined &&
      ceramic !== null &&
      ceramic.did !== undefined &&
      ceramic.did !== null
    ) {
      console.log("ceramic.did:", ceramic.did.id);
      const fuck = await TileDocument.load(
        ceramic,
        ceramic.did.id.split(":")[2]
      );
      const readStream = await ceramic.loadStream<TileDocument>(fuck.id);
      const doc: CeramicDoc = {
        docID: readStream.id,
        docContent: readStream.content,
      };

      return {
        doc: doc,
        ceramic: ceramic,
      };
    } else {
      throw new Error("Ceramic or did provider not initialized");
    }
  } catch (error) {
    console.log("Error writing document", error);
    throw error;
  }
});

export interface CeramicDoc {
  docID: StreamID;
  docContent: Record<string, string>;
}

export interface docsState {
  ceramic: CeramicClient | null;
  isBusy: boolean;
  docs: CeramicDoc[];
}

const initialState: docsState = {
  ceramic: null,
  isBusy: false,
  docs: [],
};

export const docsSlice = createSlice({
  name: "docs",
  initialState,
  reducers: {
    addDoc: (state, action) => {
      state.docs.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(writeDocument.pending, (state) => {
      state.isBusy = true;
    });
    builder.addCase(writeDocument.rejected, (state) => {
      state.isBusy = false;
    });
    builder.addCase(writeDocument.fulfilled, (state, { payload }) => {
      state.isBusy = false;
      state.docs.push(payload.doc);
      state.ceramic = payload.ceramic;
    });
    builder.addCase(readDocument.fulfilled, (state, { payload }) => {
      state.isBusy = false;
      state.docs.push(payload.doc);
      state.ceramic = payload.ceramic;
    });
  },
});

export const { addDoc } = docsSlice.actions;

export const selectDocs = (state: RootState) => state.docs;

export default docsSlice.reducer;
