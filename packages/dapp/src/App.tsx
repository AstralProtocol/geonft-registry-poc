import { observer } from "mobx-react-lite";
import { ThemeProvider } from "@mui/material/styles";
import { Container, CssBaseline, Box, Grid, Typography } from "@mui/material";
// import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import theme from "./theme";
import Wallet from "./components/Wallet";
import { WalletStatusEnums } from "./store/wallet.store";
import { useStore } from "./store";
import { NFTsList } from "./components/NFTsList";
import Map from "./components/map/Map";

const App = observer(() => {
  const { walletStore } = useStore();
  const connected = walletStore.status === WalletStatusEnums.CONNECTED;

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Container maxWidth="xl">
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
            {connected && (
              <Box display="flex" gap={4}>
                <Box flexGrow={1}>
                  <Map />
                </Box>
                <Box width="400px">
                  <NFTsList />
                </Box>
              </Box>
            )}
            {!connected && (
              <Typography
                variant="body2"
                component="h2"
                color="text.secondary"
                textAlign="center"
                gutterBottom
              >
                Wallet status: {WalletStatusEnums[walletStore.status]}
              </Typography>
            )}
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
});

export default App;
