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
import { useConnect, useDisconnect, useAccount, useBalance } from "wagmi";

const Wallet = observer((): JSX.Element => {
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { data } = useBalance({ address });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const connector = connectors[0];
  const connectWallet = () => connect({ connector });
  const balance = data?.formatted || "0";
  const symbol = data?.symbol || "ETH";
  const isOpen = Boolean(anchorEl);

  // Auto connect wallet
  // TODO: Disable on production
  useEffect(() => connectWallet(), []);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const WalletButton = (): JSX.Element => (
    <LoadingButton
      variant="contained"
      loading={isLoading}
      onClick={() => (isConnected ? disconnect() : connect({ connector }))}
    >
      {isConnected ? "Disconnect" : "Connect"} Wallet
    </LoadingButton>
  );

  // Only display these items if connected
  const menuItems =
    isConnected && address
      ? [
          <MenuItem key="address">
            <AddressChip address={address} />
          </MenuItem>,
          <MenuItem key="balance">
            <BalanceChip balance={balance} symbol={symbol} />
          </MenuItem>,
          <Divider key="divider" />,
        ]
      : [];

  return (
    <>
      <Box display={{ xs: "block", md: "none" }}>
        <Button variant="outlined" onClick={handleOpen}>
          WALLET
        </Button>
        <Menu anchorEl={anchorEl} open={isOpen} onClose={handleClose}>
          {[
            ...menuItems,
            <MenuItem key="button">
              <WalletButton />
            </MenuItem>,
          ]}
        </Menu>
      </Box>
      <Box display={{ xs: "none", md: "flex" }} alignItems="center" gap={1}>
        {isConnected && address && <AddressChip address={address} />}
        {isConnected && address && (
          <BalanceChip balance={balance} symbol={symbol} />
        )}
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

const BalanceChip = ({
  balance,
  symbol,
}: {
  balance: string;
  symbol: string;
}): JSX.Element => {
  const formattedBalance = formatBalance(balance);
  const balanceWithSymbol = `${formattedBalance} ${symbol}`;
  return (
    <Chip
      icon={<AccountBalanceWalletIcon />}
      label={balanceWithSymbol}
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
