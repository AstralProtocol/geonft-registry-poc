import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ThemeProvider } from "@mui/material/styles";
import {
  Container,
  CssBaseline,
  Box,
  Grid,
  Typography,
  AppBar,
  Toolbar,
} from "@mui/material";
import CeramicClient from "@ceramicnetwork/http-client";
import { Contract } from "ethers";
// import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import theme from "./theme";
import Wallet from "./components/Wallet";
import {
  WalletStatusEnums,
  WalletStore,
  WalletStoreContext,
  useWalletStore,
} from "./features/wallet/walletStore";
import { NFTsStore, NftsStoreContext } from "./features/nfts/nftsStore";
import { getGeoNFTContract } from "./features/nfts/nftsCore";
import { createCeramicClient } from "./features/docs/docsCore";
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

const Main = (): JSX.Element => {
  const headerHeight = 100;

  return (
    <Box bgcolor="#222" display="flex" flexDirection="column" height="100%">
      <AppBar position="fixed">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          height={headerHeight}
          px={2}
        >
          <Typography variant="h4" component="h1">
            Kolektivo Curaçao GeoNFT PoC
          </Typography>
          <Wallet />
        </Box>
      </AppBar>
      <Box mt={`${headerHeight}px`}>
        <Body />
      </Box>
      {/* <Container maxWidth="xl">
        <Grid container rowSpacing={5}>
          <Grid item xs={12}>
            <Body />
          </Grid>
        </Grid>
      </Container> */}
    </Box>
  );
};

type LoadingStatus = "wallet" | "content" | "idle";

const Body = observer((): JSX.Element => {
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>("idle");
  const [ceramic, setCeramic] = useState<CeramicClient | null>(null);
  const [nftContract, setNftContract] = useState<Contract | null>(null);

  const walletStore = useWalletStore();
  const { status, address, provider } = walletStore;
  const connected = status === WalletStatusEnums.CONNECTED;

  const fetchStoreData = async () => {
    if (!connected || !address) return;

    setLoadingStatus("content");
    const [ceramic, nftContract] = await Promise.all([
      createCeramicClient(provider, address),
      getGeoNFTContract(provider),
    ]);

    if (!ceramic || !nftContract) {
      throw new Error("Ceramic client or NFT contract not created");
    }

    setCeramic(ceramic);
    setNftContract(nftContract);
    setLoadingStatus("idle");
  };

  useEffect(() => {
    fetchStoreData();
  }, [connected, address]);

  useEffect(() => {
    if (status === WalletStatusEnums.LOADING) {
      setLoadingStatus("wallet");
    }

    if (status === WalletStatusEnums.DISCONNECTED) {
      setLoadingStatus("idle");
    }
  }, [status]);

  if (loadingStatus === "wallet" || loadingStatus === "content") {
    const msg =
      loadingStatus === "wallet" ? "Connecting wallet..." : "Loading NFTs...";
    return (
      <Box mt={10}>
        <Loading>{msg}</Loading>
      </Box>
    );
  }

  if (!address || !ceramic || !nftContract) {
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
  }

  const nftsStore = new NFTsStore(walletStore, nftContract, ceramic);

  nftsStore.fetchNFTs();

  return (
    <NftsStoreContext.Provider value={nftsStore}>
      <Box display="flex">
        <Box flexGrow={1}>
          <Map />
          {/* MAPA */}
        </Box>
        <Box width="400px">
          <NFTsList />
        </Box>
      </Box>
    </NftsStoreContext.Provider>
  );
});

export default App;
