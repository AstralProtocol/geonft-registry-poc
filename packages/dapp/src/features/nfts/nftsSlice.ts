import {
  AnyAction,
  createAsyncThunk,
  createSlice,
  Dispatch,
  PayloadAction,
} from '@reduxjs/toolkit';
import { BigNumber, Contract, ethers } from 'ethers';
import { RootState } from '../../app/store';
import networkMapping from './../../deployments.json';
import {
  TransactionReceipt,
  TransactionResponse,
} from '@ethersproject/providers';

type AsyncThunkConfig = {
  state: RootState;
  dispatch?: Dispatch<AnyAction>;
  extra?: unknown;
  rejectValue?: unknown;
};

export const fetchNFTList = createAsyncThunk<
  {
    geoNFTContract: Contract;
    nfts: NFT[];
  },
  void,
  AsyncThunkConfig
>('nfts/fetchList', async (_, thunkAPI) => {
  console.log('fetching');
  const { provider, address, ipfsClient } = thunkAPI.getState().wallet;

  let geoNFTContract = null;
  const nfts: NFT[] = [];

  if (provider) {
    const web3Provider = new ethers.providers.Web3Provider(provider);

    const chainId: number = await (await web3Provider.getNetwork()).chainId;
    const chainIdStr: string = chainId.toString();
    console.log(`Connected on chain ${chainId}`);

    const networkMappingForChain =
      networkMapping[chainIdStr as keyof typeof networkMapping];

    if (networkMappingForChain !== undefined) {
      const geoNFTMapping = networkMappingForChain[0]['contracts']['GEONFT'];

      const signer = web3Provider.getSigner();

      geoNFTContract = new Contract(
        geoNFTMapping.address,
        geoNFTMapping.abi,
        signer
      );

      // Get a list of NFTs owned by the user
      try {
        const result = await geoNFTContract.getAllTokens();
        const { 0: tokenIds, 1: metadataURIs, 2: geojsons } = result;
        console.log(tokenIds);
        console.log(metadataURIs);
        console.log(geojsons);

        if (ipfsClient !== null) {
          // For each tokenId, push to the list of NFTs
          for (let i = 0; i < tokenIds.length; i++) {
            let uri = metadataURIs[i];

            if (uri.startsWith('ipfs://')) {
              uri = uri.replace('ipfs://', '');
            }

            let result = '';

            for await (const chunk of ipfsClient.cat(uri)) {
              result += Buffer.from(chunk).toString('utf-8');
            }

            const metadata = JSON.parse(result) as NFTMetadata;

            nfts.push({
              id: BigNumber.from(tokenIds[i]).toNumber(),
              metadata: metadata,
              geojson: geojsons[i],
            });
          }
        } else {
          throw new Error('IPFS client not initialized');
        }
      } catch (error) {
        console.log('Error fetching NFT list:', error);
        throw error;
      }
    } else {
      throw new Error('No network mapping found');
    }
  } else {
    console.log('No web3 or provider');
    throw new Error('No web3 or provider');
  }

  console.log('nfts', nfts);
  return {
    geoNFTContract,
    nfts,
  };
});

export const mint = createAsyncThunk<
  { newNFT: NFT },
  { metadataURI: string; geojson: string },
  AsyncThunkConfig
>('nfts/mint', async ({ metadataURI, geojson }, thunkAPI) => {
  const { provider, address, ipfsClient } = thunkAPI.getState().wallet;
  const { geoNFTContract } = thunkAPI.getState().nfts;
  const newNFT = {} as NFT;
  if (provider && geoNFTContract) {
    try {
      const result = await geoNFTContract
        .safeMint(address, metadataURI, geojson)
        .then(async (tx: TransactionResponse) => {
          console.log('mint tx hash:', tx.hash);
          console.log('mint tx:', tx);
          const contractReceipt: TransactionReceipt = await tx.wait();
          console.log('transaction receipt:', contractReceipt);
          if (contractReceipt.status === 1) {
            console.log('mint tx success');
            // get nft id from receipt
            newNFT.id = BigNumber.from(
              contractReceipt.logs[0].topics[3]
            ).toNumber();
            newNFT.geojson = geojson;

            if (ipfsClient !== null) {
              let uri = metadataURI;
              if (uri.startsWith('ipfs://')) {
                uri = uri.replace('ipfs://', '');
              }

              let result = '';

              for await (const chunk of ipfsClient.cat(uri)) {
                result += Buffer.from(chunk).toString('utf-8');
              }
              const metadata = JSON.parse(result) as NFTMetadata;

              newNFT.metadata = metadata;
            } else {
              throw new Error('IPFS client not initialized');
            }
          }
        });
    } catch (error) {
      console.log('Error minting:', error);
      throw error;
    }
  }
  return {
    newNFT,
  };
});

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  geojson: any;
}

export interface NFT {
  id: number;
  geojson: string;
  metadata: NFTMetadata;
}

export interface nftsState {
  geoNFTContract: Contract | null;
  isBusyFetching: boolean;
  isBusyMinting: boolean;
  nfts: NFT[];
}

const initialState: nftsState = {
  geoNFTContract: null,
  isBusyFetching: false,
  isBusyMinting: false,
  nfts: [],
};

export const nftsSlice = createSlice({
  name: 'nfts',
  initialState,
  reducers: {
    addNft: (state, action) => {
      state.nfts.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNFTList.pending, (state) => {
      state.isBusyFetching = true;
    });
    builder.addCase(fetchNFTList.rejected, (state, action) => {
      console.warn('Fetch REJECTED', action);
      state.isBusyFetching = false;
    });
    builder.addCase(
      fetchNFTList.fulfilled,
      (state, action: PayloadAction<any>) => {
        console.log('Fetch OK');
        state.geoNFTContract = action.payload.geoNFTContract;
        state.nfts = action.payload.nfts;
        state.isBusyFetching = false;
      }
    );
    builder.addCase(mint.pending, (state) => {
      state.isBusyMinting = true;
    });
    builder.addCase(mint.rejected, (state) => {
      state.isBusyMinting = false;
    });
    builder.addCase(mint.fulfilled, (state, action: PayloadAction<any>) => {
      state.isBusyMinting = false;
      state.nfts.push(action.payload.newNFT);
    });
  },
});

export const { addNft } = nftsSlice.actions;

export const selectNFTs = (state: RootState) => state.nfts;

export default nftsSlice.reducer;
