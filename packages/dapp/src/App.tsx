import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box, Typography } from "@mui/material";
import {
  WagmiConfig,
  createClient,
  configureChains,
  useConnect,
  useAccount,
} from "wagmi";
import { localhost, celoAlfajores } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import type { Provider } from "@wagmi/core";
import theme from "./theme";
import { Store, StoreContext } from "./store/store";
import { getGeoNFTContract, getGeoNFTsByOwner } from "./features/nfts";
import { createCeramicClient } from "./features/docs";
import { Header, HEADER_HEIGHT } from "./components/Header";
import { NFTsList } from "./components/NFTsList";
import { Map } from "./components/map/Map";
import { Loading } from "./components/Loading";
import { getProvider } from "./utils";

const IS_DEVELOPMENT = import.meta.env.MODE === "development";
// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const mainChain = IS_DEVELOPMENT ? localhost : celoAlfajores;
const { chains, provider, webSocketProvider } = configureChains(
  [mainChain],
  [publicProvider()]
);

// Set up client
// Use MetaMask connector ir development, WalletConnect in production
const client = createClient({
  autoConnect: false,
  connectors: [
    IS_DEVELOPMENT
      ? new MetaMaskConnector({ chains })
      : new WalletConnectConnector({
          chains,
          options: {
            qrcode: true,
          },
        }),
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
  const [provider, setProvider] = useState<Provider | null>(null);

  const renderContent = () => {
    // Connecting wallet
    if (isConnecting || !provider) {
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

    return <Main provider={provider} />;
  };

  // Wallet connected
  return (
    <Box bgcolor="#222" display="flex" flexDirection="column" height="100%">
      <Header setProvider={setProvider} />
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

const Main = ({ provider }: MainProps): JSX.Element => {
  const [status, setStatus] = useState<Status>({ value: "idle" });
  const [store, setStore] = useState<Store | null>(null);
  const { address } = useAccount();

  useEffect(() => {
    if (!address) return;

    const fetchStoreData = async () => {
      setStatus({ value: "loading" });
      const result = await Promise.all([
        getGeoNFTContract(provider),
        createCeramicClient(provider, address),
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
      const store = new Store(contract, ceramic, nfts);
      setStore(store);
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

  if (status.value === "loading" || !store) {
    return (
      <Box mt={10}>
        <Loading>Loading NFTs...</Loading>
      </Box>
    );
  }

  return (
    <StoreContext.Provider value={store}>
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
};

interface MainProps {
  provider: Provider;
}

export default AppWithProviders;
