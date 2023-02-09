import { Box, Typography, AppBar } from "@mui/material";
import type { Provider } from "@wagmi/core";
import Wallet from "./Wallet";
import logoImage from "../assets/Medium avatar-3.png";

export const HEADER_HEIGHT = 100;

export const Header = ({ setProvider }: HeaderProps): JSX.Element => {
  return (
    <AppBar position="fixed">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        height={HEADER_HEIGHT}
        px={2}
      >
        <a href="https://astral.global">
          <img src={logoImage} alt="logo" width="50" height="50" />
        </a>
        <Box flexGrow={1} ml={2}>
          <Typography variant="h1" component="h1">
            Kolektivo Curaçao GeoNFT PoC
          </Typography>
        </Box>
        <Wallet setProvider={setProvider} />
      </Box>
    </AppBar>
  );
};

interface HeaderProps {
  setProvider: (provider: Provider) => void;
}
