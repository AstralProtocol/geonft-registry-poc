import { Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { walletStore, WalletStatusEnums } from "./walletStore";

const Wallet = () => {
  const connected = walletStore.status === WalletStatusEnums.CONNECTED;

  const connectWallet = () => walletStore.connectWallet();
  const disconnectWallet = () => walletStore.disconnectWallet();

  return (
    <Box>
      <LoadingButton
        variant="contained"
        loading={walletStore.status === WalletStatusEnums.LOADING}
        onClick={connected ? disconnectWallet : connectWallet}
      >
        {connected ? "Disconnect" : "Connect"} Wallet
      </LoadingButton>
      {connected && (
        <Box>
          <p>Address: {walletStore.address}</p>
          <p>Balance: {walletStore.balance} ETH</p>
        </Box>
      )}
    </Box>
  );
};

export default Wallet;
