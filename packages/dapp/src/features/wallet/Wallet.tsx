import React from "react";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { selectWallet, connectWallet, WalletStatusEnums } from "./walletSlice";
import { Alert, AlertTitle, Grid } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import NFTS from "../nfts/NFTS";
import CeramicDocs from "../docs/CeramicDocs";
import { selectNFTs } from "../nfts/nftsSlice";

function Wallet() {
  const { provider, status } = useAppSelector(selectWallet);
  const { isBusyFetching } = useAppSelector(selectNFTs);

  const dispatch = useAppDispatch();

  let display;

  if (provider == null) {
    display = (
      <div>
        <LoadingButton
          loading={status == WalletStatusEnums.LOADING || isBusyFetching}
          variant="contained"
          onClick={() => dispatch(connectWallet())}
        >
          Connect
        </LoadingButton>
      </div>
    );
  }

  if (status === WalletStatusEnums.CONNECTED) {
    display = (
      <Grid container>
        <NFTS />
        {/* <CeramicDocs /> */}
      </Grid>
    );
  } else if (status === WalletStatusEnums.WRONG_NETWORK) {
    display = (
      <Grid container>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          Contract not deployed to this network (chainId {provider.chainId})
          <br />
          <br />
          Please switch to either:
          <ol>
            <li>
              localhost with chainId: 31337 (make sure the hardhat node is
              running)
            </li>
            <li>the Alfajores network</li>
          </ol>
        </Alert>
      </Grid>
    );
  }

  return <div>{display}</div>;
}

export default Wallet;
