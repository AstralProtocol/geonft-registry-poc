import { observer } from "mobx-react-lite";
import { Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  useWalletStore,
  WalletStatusEnums,
} from "../features/wallet/walletStore";

const Wallet = observer((): JSX.Element => {
  const walletStore = useWalletStore();
  const connected = walletStore.status === WalletStatusEnums.CONNECTED;

  const connectWallet = async () => await walletStore.connectWallet();
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
});

export default Wallet;
