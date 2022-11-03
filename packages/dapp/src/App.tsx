import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ethers } from "ethers";
import { ThemeProvider } from "@mui/material/styles";
import {
  Button,
  Container,
  CssBaseline,
  Box,
  Grid,
  Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import theme from "./theme";
import Wallet from "./features/wallet/Wallet";
import { walletStore, WalletStatusEnums } from "./features/wallet/walletStore";
import Map from "./features/map/Map";

// function Footer() {
//   const { status } = appStore.wallet;

//   useEffect(() => {
//     if (status === WalletStatusEnums.CONNECTED) {
//       console.log("Wallet connected");
//     }
//   }, [status]);

//   const connected = status === WalletStatusEnums.CONNECTED;
//   return (
//     <Typography
//       component={"div"}
//       variant="body2"
//       color="text.secondary"
//       align="center"
//       gutterBottom
//     >
//       <Grid container rowSpacing={1} columnSpacing={3}>
//         {!connected && (
//           <Grid item xs={12}>
//             Status: {WalletStatusEnums[status]}
//           </Grid>
//         )}
//         {/* {ceramic && (
//           <Grid item xs={12} mb={1}>
//             {ceramic.did?.id}
//           </Grid>
//         )} */}
//         {connected && (
//           <Grid
//             container
//             direction="row"
//             justifyContent="center"
//             alignItems="center"
//           >
//             <Grid item xs={1}>
//               <AccountBalanceWalletIcon />
//             </Grid>
//             {/* <Grid item xs={5}>
//               {formattedBalance} CELO
//             </Grid> */}
//             {/* <Grid item xs={5}>
//               <Button
//                 variant="contained"
//                 onClick={() => dispatch(disconnect())}
//               >
//                 Disconnect
//               </Button>
//             </Grid> */}
//           </Grid>
//         )}
//         {connected && (
//           <Grid>
//             <Grid item xs={12}>
//               {/* {address} */}
//             </Grid>
//             <Grid item xs={12}>
//               {/* Block Number: {blockNumber} */}
//             </Grid>
//           </Grid>
//         )}
//       </Grid>
//     </Typography>
//   );
// }

const App = observer(() => {
  const connected = walletStore.status === WalletStatusEnums.CONNECTED;

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Container maxWidth="lg">
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
              <Grid container>
                <Grid item xs={9}>
                  <Map />
                </Grid>
                <Grid item xs={3}>
                  <Box bgcolor="pink" p={2}>
                    HOLA
                  </Box>
                </Grid>
              </Grid>
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
