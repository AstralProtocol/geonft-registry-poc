import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, Typography } from "@mui/material";
import theme from "./theme";
import {
  WalletStatusEnums,
  WalletStore,
  WalletStoreContext,
  useWalletStore,
} from "./features/wallet/walletStore";
import { NFTsStore, NftsStoreContext } from "./features/nfts/nftsStore";
import { getGeoNFTContract } from "./features/nfts/nftsCore";
import { createCeramicClient } from "./features/docs/docsCore";
import { Header, HEADER_HEIGHT } from "./components/Header";
import { NFTsList } from "./components/NFTsList";
import { Map } from "./components/map/Map";
import { Loading } from "./components/Loading";

const App = () => {
  const walletStore = new WalletStore();

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <WalletStoreContext.Provider value={walletStore}>
        <Main />
      </WalletStoreContext.Provider>
    </ThemeProvider>
  );
};

const Main = observer((): JSX.Element => {
  const { status, address } = useWalletStore();
  const connected = status === WalletStatusEnums.CONNECTED && address;

  const NotConnected = () => {
    if (status === WalletStatusEnums.LOADING) {
      return (
        <Box mt={10}>
          <Loading>Connecting wallet...</Loading>
        </Box>
      );
    }

    return (
      <Box mt={10}>
        <Typography
          variant="body2"
          component="h2"
          color="text.secondary"
          textAlign="center"
          gutterBottom
        >
          Wallet status: {WalletStatusEnums[status]}
        </Typography>
      </Box>
    );
  };

  return (
    <Box bgcolor="#222" display="flex" flexDirection="column" height="100%">
      <Header />
      <Box mt={`${HEADER_HEIGHT}px`}>
        {connected ? <Body /> : <NotConnected />}
      </Box>
    </Box>
  );
});

// Extract to different component to avoid re-rendering on the Main component
const Body = observer((): JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nftsStore, setNftsStore] = useState<NFTsStore | null>(null);

  const walletStore = useWalletStore();
  const address = walletStore.address as string;
  const provider = walletStore.provider;

  const fetchStoreData = async () => {
    setIsLoading(true);
    const [ceramic, nftContract] = await Promise.all([
      createCeramicClient(provider, address),
      getGeoNFTContract(provider),
    ]);

    if (!ceramic || !nftContract) {
      throw new Error("Ceramic client or NFT contract not created");
    }

    const nftsStore = new NFTsStore(walletStore, nftContract, ceramic);
    await nftsStore.fetchNFTs();

    setNftsStore(nftsStore);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  if (isLoading || !nftsStore) {
    return (
      <Box mt={10}>
        <Loading>Loading NFTs...</Loading>
      </Box>
    );
  }

  return (
    <NftsStoreContext.Provider value={nftsStore}>
      <Box display="flex">
        <Box flexGrow={1}>
          <Map />
        </Box>
        <Box width={{ xs: 0, md: "400px" }}>
          <NFTsList />
        </Box>
      </Box>
    </NftsStoreContext.Provider>
  );
});

export default App;
