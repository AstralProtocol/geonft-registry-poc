import React from 'react';
import { useAppSelector, useAppDispatch } from './app/hooks';
import {
  disconnect,
  selectWallet,
  WalletStatusEnums,
} from './features/wallet/walletSlice';
import Wallet from './features/wallet/Wallet';
import { ThemeProvider } from '@mui/material/styles';
import {
  Button,
  Container,
  CssBaseline,
  Grid,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import theme from './theme';
import { selectDocs } from './features/docs/docsSlice';
import { ethers } from 'ethers';

function Footer() {
  const { address, balance, status } = useAppSelector(selectWallet);
  let formattedBalance = '';
  if (balance) {
    formattedBalance = ethers.utils.formatEther(balance);
  }
  const { ceramic } = useAppSelector(selectDocs);
  const dispatch = useAppDispatch();

  const connected = status === WalletStatusEnums.CONNECTED;
  return (
    <Typography
      component={'div'}
      variant="body2"
      color="text.secondary"
      align="center"
      gutterBottom
    >
      <Grid container rowSpacing={1} columnSpacing={3}>
        {!connected && (
          <Grid item xs={12}>
            Status: {WalletStatusEnums[status]}
          </Grid>
        )}
        {ceramic && (
          <Grid item xs={12} mb={1}>
            {ceramic.did?.id}
          </Grid>
        )}
        {connected && (
          <Grid
            container
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Grid item xs={1}>
              <AccountBalanceWalletIcon />
            </Grid>
            <Grid item xs={5}>
              {formattedBalance} CELO
            </Grid>
            <Grid item xs={5}>
              <Button
                variant="contained"
                onClick={() => dispatch(disconnect())}
              >
                Disconnect
              </Button>
            </Grid>
          </Grid>
        )}
        {connected && (
          <Grid item xs={12}>
            {address}
          </Grid>
        )}
      </Grid>
    </Typography>
  );
}

class App extends React.Component {
  render() {
    return (
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <Container maxWidth="sm">
          <Grid container rowSpacing={5}>
            <Grid item xs={12}>
              <Typography variant="h4" component="h1" gutterBottom>
                Kolektivo Curaçao GeoNFT PoC
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Wallet />
            </Grid>
            <Grid item xs={12}>
              <Footer />
            </Grid>
          </Grid>
        </Container>
      </ThemeProvider>
    );
  }
}

export default App;
