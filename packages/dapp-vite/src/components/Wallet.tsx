import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Box,
  Button,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const walletStore = useWalletStore();
  const connected = walletStore.status === WalletStatusEnums.CONNECTED;
  const address = walletStore.address || "";
  const balance = walletStore.balance || "";
  const isOpen = Boolean(anchorEl);

  // TODO: Disable on production
  useEffect(() => {
    const autoConnectWallet = async () => await walletStore.connectWallet();

    autoConnectWallet();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const connectWallet = async () => await walletStore.connectWallet();
  const disconnectWallet = () => walletStore.disconnectWallet();

  const WalletButton = (): JSX.Element => (
    <LoadingButton
      variant="contained"
      loading={walletStore.status === WalletStatusEnums.LOADING}
      onClick={connected ? disconnectWallet : connectWallet}
    >
      {connected ? "Disconnect" : "Connect"} Wallet
    </LoadingButton>
  );

  return (
    <>
      <Box display={{ xs: "block", md: "none" }}>
        <Button variant="outlined" onClick={handleClick}>
          WALLET
        </Button>
        <Menu anchorEl={anchorEl} open={isOpen} onClose={handleClose}>
          {[
            [
              // Only display these items if connected
              <MenuItem key="address">
                <AddressChip address={address} />
              </MenuItem>,
              <MenuItem key="balance">
                <BalanceChip balance={balance} />
              </MenuItem>,
              <Divider key="divider" />,
            ].map((item) => connected && item),
            <MenuItem key="button">
              <WalletButton />
            </MenuItem>,
          ]}
        </Menu>
      </Box>
      <Box display={{ xs: "none", md: "flex" }} alignItems="center" gap={1}>
        {connected && <AddressChip address={address} />}
        {connected && <BalanceChip balance={balance} />}
        <Box style={{ marginLeft: "16px" }}>
          <WalletButton />
        </Box>
      </Box>
    </>
  );
});

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
          sx={(theme) => ({
            padding: "8px",
            height: "40px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            [theme.breakpoints.down("md")]: {
              flexGrow: 1,
            },
          })}
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
  const walletStore = useWalletStore();

  const formattedBalance = formatBalance(balance) + " " + walletStore.currency;
  return (
    <Chip
      icon={<AccountBalanceWalletIcon />}
      label={formattedBalance}
      sx={(theme) => ({
        padding: "8px",
        height: "40px",
        borderRadius: "9999px",
        display: "flex",
        alignItems: "center",
        [theme.breakpoints.down("md")]: {
          flexGrow: 1,
        },
      })}
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
