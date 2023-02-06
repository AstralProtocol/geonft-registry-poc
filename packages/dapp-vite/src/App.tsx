import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, Typography } from "@mui/material";
import { WagmiConfig, createClient, configureChains } from "wagmi";
import { localhost } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { useAccount } from "wagmi";
import theme from "./theme";
import { Store, StoreContext } from "./store/store";
import { getGeoNFTContract, getGeoNFTsByOwner } from "./features/nfts";
import { createCeramicClient } from "./features/docs";
import { Header, HEADER_HEIGHT } from "./components/Header";
import { NFTsList } from "./components/NFTsList";
import { Map } from "./components/map/Map";
import { Loading } from "./components/Loading";
import { getProvider } from "./utils";

// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const { chains, provider, webSocketProvider } = configureChains(
  [localhost],
  [publicProvider()]
);

// Set up client
const client = createClient({
  autoConnect: false,
  connectors: [
    new MetaMaskConnector({ chains }),
    // new WalletConnectConnector({
    //   chains,
    //   options: {
    //     qrcode: true,
    //   },
    // }),
  ],
  provider,
  webSocketProvider,
});

const AppWithProviders = () => {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <WagmiConfig client={client}>
        <App />
      </WagmiConfig>
    </ThemeProvider>
  );
};

const App = (): JSX.Element => {
  const { status, isConnected, isConnecting } = useAccount();

  const renderContent = () => {
    // Connecting wallet
    if (isConnecting) {
      return (
        <Box mt={10}>
          <Loading>Connecting wallet...</Loading>
        </Box>
      );
    }

    // Wallet not connected or error
    if (!isConnected && !isConnecting) {
      return (
        <Box mt={10}>
          <Typography
            variant="body2"
            component="h2"
            color="text.secondary"
            textAlign="center"
            width="100%"
            gutterBottom
          >
            Wallet status: {status.toUpperCase()}
          </Typography>
        </Box>
      );
    }

    return <Main />;
  };

  // Wallet connected
  return (
    <Box bgcolor="#222" display="flex" flexDirection="column" height="100%">
      <Header />
      <Box mt={`${HEADER_HEIGHT}px`} width="100%">
        {renderContent()}
      </Box>
    </Box>
  );
};

// Extract to different component to avoid re-rendering on the Main component
type Status = {
  value: "idle" | "loading" | "error";
  msg?: string;
};

const Main = observer((): JSX.Element => {
  const [status, setStatus] = useState<Status>({ value: "idle" });
  const [nftsStore, setNftsStore] = useState<Store | null>(null);
  const { address } = useAccount();

  useEffect(() => {
    if (!address) return;

    const fetchStoreData = async () => {
      setStatus({ value: "loading" });
      const ethProvider = getProvider();
      const result = await Promise.all([
        getGeoNFTContract(ethProvider),
        createCeramicClient(ethProvider, address),
      ]).catch((error) => {
        console.error(error);
        setStatus({
          value: "error",
          msg: "Error connecting to Ceramic or NFT contract",
        });
        return;
      });

      if (!result) {
        setStatus({ value: "error", msg: "Error connecting to Ceramic" });
        return;
      }
      const [contract, ceramic] = result;

      const nfts = await getGeoNFTsByOwner(contract, address, ceramic);
      const nftStore = new Store(contract, ceramic, nfts);
      setNftsStore(nftStore);
      setStatus({ value: "idle" });
    };

    fetchStoreData();
  }, [address]);

  if (status.value === "error") {
    return (
      <Box mt={10}>
        <Typography
          variant="body2"
          component="h2"
          color="text.secondary"
          textAlign="center"
          gutterBottom
        >
          Error connecting to Ceramic or NFT contract
        </Typography>
      </Box>
    );
  }

  if (status.value === "loading" || !nftsStore) {
    return (
      <Box mt={10}>
        <Loading>Loading NFTs...</Loading>
      </Box>
    );
  }

  return (
    <StoreContext.Provider value={nftsStore}>
      <Box display="flex">
        <Box flexGrow={1}>
          <Map />
        </Box>
        <Box width={{ xs: 0, md: "400px" }}>
          <NFTsList />
        </Box>
      </Box>
    </StoreContext.Provider>
  );
});

export default AppWithProviders;
