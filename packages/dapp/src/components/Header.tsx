import { Box, Typography, AppBar } from "@mui/material";
import Wallet from "./Wallet";

export const HEADER_HEIGHT = 100;

export const Header = (): JSX.Element => {
  return (
    <AppBar position="fixed">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        height={HEADER_HEIGHT}
        px={2}
      >
        <Typography variant="h4" component="h1">
          Kolektivo Curaçao GeoNFT PoC
        </Typography>
        <Wallet />
      </Box>
    </AppBar>
  );
};
