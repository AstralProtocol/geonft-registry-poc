import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ThemeProvider } from "@mui/material/styles";
import { Container, CssBaseline, Box, Grid, Typography } from "@mui/material";
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
import Map from "./components/map/Map";
import { Loading } from "./components/Loading";

const App = () => {
  const walletStore = new WalletStore();

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Container maxWidth="xl">
        <WalletStoreContext.Provider value={walletStore}>
          <Main />
        </WalletStoreContext.Provider>
      </Container>
    </ThemeProvider>
  );
};

const Main = (): JSX.Element => {
  return (
    <Grid container rowSpacing={5}>
      <Grid item xs={12} mt={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Kolektivo Curaçao GeoNFT PoC
        </Typography>
        <Box mt={6}>
          <Wallet />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Body />
      </Grid>
    </Grid>
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
    return <Loading>{msg}</Loading>;
  }

  if (!address || !ceramic || !nftContract) {
    return (
      <Typography
        variant="body2"
        component="h2"
        color="text.secondary"
        textAlign="center"
        gutterBottom
      >
        Wallet status: {WalletStatusEnums[status]}
      </Typography>
    );
  }

  const nftsStore = new NFTsStore(walletStore, nftContract, ceramic);

  nftsStore.fetchNFTs();

  return (
    <NftsStoreContext.Provider value={nftsStore}>
      <Box display="flex" gap={4}>
        <Box flexGrow={1}>
          <Map />
        </Box>
        <Box width="400px">
          <NFTsList />
        </Box>
      </Box>
    </NftsStoreContext.Provider>
  );
});

export default App;
