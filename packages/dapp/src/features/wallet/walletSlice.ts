import {
  AnyAction,
  createAsyncThunk,
  createSlice,
  Dispatch,
  PayloadAction,
} from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { BigNumber, ethers } from 'ethers';
import Web3Modal from 'web3modal';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';
import { AbstractProvider } from 'web3-core/types';
import { fetchNFTList } from '../nfts/nftsSlice';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { CeloProvider, CeloWallet } from '@celo-tools/celo-ethers-wrapper';

const options = {
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  apiPath: '/api/v0',
  headers: {
    authorization: 'Basic ' + Buffer.from(process.env.REACT_APP_PROJECT_ID + ':' + process.env.REACT_APP_PROJECT_SECRET).toString('base64')
  }
};

export declare class WalletConnectWeb3Provider
  extends WalletConnectProvider
  implements AbstractProvider
{
  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse) => void
  ): void;
}

type AsyncThunkConfig = {
  state: RootState;
  dispatch?: Dispatch<AnyAction>;
  extra?: unknown;
  rejectValue?: unknown;
};

export const connectWallet = createAsyncThunk<void, void, AsyncThunkConfig>(
  'ConnectWallet',
  async (action, { dispatch }) => {
    await dispatch(initWeb3());
    await dispatch(fetchAcctAndThenLoadNFTs())
      .unwrap()
      .catch((error) => {
        throw error;
      });
  }
);

export const initWeb3 = createAsyncThunk<
  {
    web3Modal: Web3Modal;
    provider: any;
    status: WalletStatusEnums;
  },
  void,
  AsyncThunkConfig
>('InitWeb3', async (action, { dispatch }) => {
  // const celoTestnet = {
  //   chainId: "0xaef3",
  //   chainName: "Alfajores Testnet",
  //   rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
  //   nativeCurrency: {
  //     name: "Alfajores Celo",
  //     symbol: "A-CELO",
  //     decimals: 18,
  //   },
  //   blockExplorerUrls: ["https://alfajores-blockscout.celo-testnet.org/"],
  // };
  // const celoMainnet = {
  //   chainId: "0xa4ec",
  //   chainName: "Celo",
  //   rpcUrls: ["https://forno.celo.org"],
  //   nativeCurrency: {
  //     name: "Celo",
  //     symbol: "CELO",
  //     decimals: 18,
  //   },
  //   blockExplorerUrls: ["https://explorer.celo.org/"],
  // };

  try {
    const web3Modal = new Web3Modal({
      cacheProvider: false,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            rpc: {
              44787: 'https://alfajores-forno.celo-testnet.org',
              42220: 'https://forno.celo.org',
            },
          },
        },
      },
      disableInjectedProvider: false,
    });

    const provider = await web3Modal.connect();

    console.log(provider);

    // Subscribe to accounts change
    provider.on('accountsChanged', (accounts: string[]) => {
      console.log(accounts);
    });

    // Subscribe to chainId change
    provider.on('chainChanged', (chainId: number) => {
      console.log('Web3 chainChanged:');
      console.log(chainId);
      dispatch(fetchAcctAndThenLoadNFTs());
    });

    provider.on('block', (blockNumber: number) => {
      console.log(blockNumber);
      dispatch(fetchLastBlock());
    });

    // Subscribe to session disconnection
    provider.on('disconnect', (code: number, reason: string) => {
      console.log('Web3 disconnect:');
      console.log(code, reason);
    });

    console.log('Connected to wallet');

    return {
      web3Modal,
      provider,
      status: WalletStatusEnums.LOADING,
    };
  } catch (error) {
    console.log('Error initializing web3', error);
    throw error;
  }
});

export const fetchAcctAndThenLoadNFTs = createAsyncThunk<
  void,
  void,
  AsyncThunkConfig
>('ConnectWallet', async (action, { dispatch }) => {
  await dispatch(fetchAccount());
  await dispatch(fetchNFTList())
    .unwrap()
    .catch((error) => {
      throw error;
    });
});

export const fetchLastBlock = createAsyncThunk<
  { lastBlockNumber: number},
  void,
  AsyncThunkConfig
>('fetchLastBlock', async (action, thunkAPI) => {
  let lastBlock = null;
  try {
    const provider = thunkAPI.getState().wallet.provider;
    const celoProvider = new CeloProvider(provider.http.url);
    lastBlock = await celoProvider.getBlockNumber();

    const celoWallet = new CeloWallet(thunkAPI.getState().wallet.provider);
    const balance = await celoWallet.getBalance();
    console.log(balance);

  } catch (error) {
    console.log('Error fetching last block', error);
    throw error;
  }
  return {
    lastBlockNumber: lastBlock,
  };
});

export const fetchAccount = createAsyncThunk<
  {
    address: string;
    balance: BigNumber;
    status: WalletStatusEnums;
    ipfsClient: IPFSHTTPClient;
  },
  void,
  AsyncThunkConfig
>('FetchAccount', async (_, thunkAPI) => {
  try {
    const provider = thunkAPI.getState().wallet.provider;

    if (!provider) {
      throw new Error('provider not initialized');
    }
    const web3Provider = new ethers.providers.Web3Provider(provider);
    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();
    console.log('Fetched account:', address);
    // if (!address) throw 'Account disconnected';
    const balance = await web3Provider.getBalance(address);
    console.log('balance:', balance);

    const ipfsClient = create(options);
    return {
      address,
      balance: balance,
      status: WalletStatusEnums.CONNECTED,
      ipfsClient,
    };
  } catch (error) {
    console.log('Error fetching account address', error);
    throw error;
  }
});

export const disconnect = createAsyncThunk<
  { provider: null; status: WalletStatusEnums },
  void,
  AsyncThunkConfig
>('Disconnect', async (_, thunkAPI) => {
  console.log('disconnecting');
  await thunkAPI.getState().wallet.web3Modal?.clearCachedProvider();
  window.location.reload();

  return {
    provider: null,
    address: '',
    status: WalletStatusEnums.DISCONNECTED,
  };
});

export enum WalletStatusEnums {
  DISCONNECTED,
  LOADING,
  CONNECTED,
  WRONG_NETWORK,
}

export interface WalletState {
  web3Modal: Web3Modal | null;
  provider: any;
  address: string;
  balance: BigNumber | null;
  status: WalletStatusEnums;
  ipfsClient: IPFSHTTPClient | null;
  blockNumber: number | null;
}

export const initialState: WalletState = {
  web3Modal: null,
  provider: null,
  address: '',
  balance: null,
  status: WalletStatusEnums.DISCONNECTED,
  ipfsClient: null,
  blockNumber: null
};

export const walletSlice = createSlice({
  name: 'WalletReducer',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    updateStatus: (state, action: PayloadAction<WalletStatusEnums>) => {
      state.status = action.payload;
    },
    disconnectWallet: (state) => {
      state.status = WalletStatusEnums.DISCONNECTED;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initWeb3.fulfilled, (state, { payload }) => {
      state.web3Modal = payload.web3Modal;
      state.provider = payload.provider;
      state.status = payload.status;
    }),
      builder.addCase(initWeb3.rejected, (state) => {
        state.status = WalletStatusEnums.DISCONNECTED;
      }),
      builder.addCase(connectWallet.pending, (state) => {
        state.status = WalletStatusEnums.LOADING;
      }),
      builder.addCase(fetchAcctAndThenLoadNFTs.rejected, (state) => {
        state.status = WalletStatusEnums.WRONG_NETWORK;
      }),
      builder.addCase(fetchAccount.fulfilled, (state, { payload }) => {
        state.address = payload.address;
        state.balance = payload.balance;
        state.status = payload.status;
        state.ipfsClient = payload.ipfsClient;
      }),
      builder.addCase(fetchLastBlock.fulfilled, (state, { payload }) => {
        state.blockNumber = payload.lastBlockNumber;
      }),
      builder.addCase(disconnect.rejected, (state) => {
        console.log('disconnect failed');
      }),
      builder.addCase(disconnect.fulfilled, (state, { payload }) => {
        state.provider = payload.provider;
        state.status = payload.status;
      });
  },
});

export const { updateStatus, disconnectWallet } = walletSlice.actions;

export const selectWallet = (state: RootState) => state.wallet;
export const selectWalletStatus = (state: RootState) => state.wallet.status;

export default walletSlice.reducer;
