import { useState } from "react";
import { observer } from "mobx-react-lite";
import { Box, Chip, Tooltip } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CheckIcon from "@mui/icons-material/Check";
import { ethers } from "ethers";
import {
  useWalletStore,
  WalletStatusEnums,
} from "../features/wallet/walletStore";

const Wallet = observer((): JSX.Element => {
  const walletStore = useWalletStore();
  const connected = walletStore.status === WalletStatusEnums.CONNECTED;
  const address = walletStore.address || "";
  const balance = walletStore.balance || "";

  const connectWallet = async () => await walletStore.connectWallet();
  const disconnectWallet = () => walletStore.disconnectWallet();

  return (
    <Box display="flex" alignItems="center" gap={4}>
      {connected && <AddressChip address={address} />}
      {connected && <BalanceChip balance={balance} />}
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

const chipStyle: React.CSSProperties = {
  padding: "8px",
  height: "40px",
  borderRadius: "9999px",
  display: "flex",
  alignItems: "center",
};

const AddressChip = ({ address }: { address: string }): JSX.Element => {
  const [copied, setCopied] = useState(false);
  const formattedAddress = address.slice(0, 6) + "..." + address.slice(-4);
  const copyTooltip = "Copy address";
  const copiedTooltip = (
    <>
      <CheckIcon fontSize="small" /> Copied!
    </>
  );
  return (
    <>
      <Tooltip
        title={
          <Box display="flex" gap={0.5} alignItems="center" fontSize="14px">
            {copied ? copiedTooltip : copyTooltip}
          </Box>
        }
        arrow
      >
        <Chip
          icon={<ContentCopyIcon />}
          label={formattedAddress}
          style={chipStyle}
          onClick={() => {
            setCopied(true);
            navigator.clipboard.writeText(address);
          }}
        />
      </Tooltip>
    </>
  );
};

const BalanceChip = ({ balance }: { balance: string }): JSX.Element => {
  const formattedBalance = formatBalance(balance) + " ETH";
  return (
    <Chip
      icon={<AccountBalanceWalletIcon />}
      label={formattedBalance}
      style={chipStyle}
    />
  );
};

const formatBalance = (balance: string): string => {
  const balanceFloat = parseFloat(balance);
  // We add more decimal places for balances smaller than 1 ETH
  const decimalPlaces = balanceFloat > 1 ? 4 : 8;
  return ethers.utils.commify(
    balanceFloat.toFixed(decimalPlaces).replace(/\.?0+$/, "")
  );
};

export default Wallet;
