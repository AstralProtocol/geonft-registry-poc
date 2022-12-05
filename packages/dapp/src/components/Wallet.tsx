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
    <Box display="flex" gap={4}>
      {connected && <span>Address: </span>}
      {connected && <span>Balance: </span>}
      <LoadingButton
        variant="contained"
        loading={walletStore.status === WalletStatusEnums.LOADING}
        onClick={connected ? disconnectWallet : connectWallet}
      >
        {connected ? "Disconnect" : "Connect"} Wallet
      </LoadingButton>
    </Box>
  );
});

export default Wallet;
