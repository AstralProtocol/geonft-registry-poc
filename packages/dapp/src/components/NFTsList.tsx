import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  Box,
  Typography,
  Button,
  Fab,
  List,
  ListItem,
  ListItemText,
  Drawer,
} from "@mui/material";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { NFT, NFTId } from "../features/nfts/nftsCore";
import { useNftsStore } from "../features/nfts/nftsStore";
import { Loading } from "./Loading";
import { HEADER_HEIGHT } from "./Header";

export const NFTsList = observer((): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const nftsStore = useNftsStore();
  const nfts = nftsStore.nfts;

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const renderContent = (): JSX.Element => {
    if (nftsStore.isBusyFetching) {
      return <Loading>Loading NFTs...</Loading>;
    }

    if (nfts.length === 0) {
      return <NoNFTsFound />;
    }

    return <NFTs nfts={nfts} />;
  };

  const Main = (): JSX.Element => (
    <Box
      p={4}
      height="100%"
      overflow="auto"
      boxShadow={8}
      zIndex={9}
      position="relative"
    >
      <Typography variant="h5" gutterBottom>
        Minted GeoNFTs
      </Typography>
      {renderContent()}
    </Box>
  );

  return (
    <>
      <Box display={{ xs: "block", md: "none" }}>
        <Fab
          variant="circular"
          color="primary"
          onClick={toggleDrawer}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1300,
          }}
        >
          <FormatListBulletedIcon />
        </Fab>
        <Drawer anchor="right" open={isOpen} onClose={toggleDrawer}>
          <Main />
        </Drawer>
      </Box>
      <Box
        height={`calc(100vh - ${HEADER_HEIGHT}px)`}
        display={{ xs: "none", md: "block" }}
      >
        <Main />
      </Box>
    </>
  );
});

const NFTs = ({ nfts }: NFTsProps): JSX.Element => {
  const nftsStore = useNftsStore();

  const editMetadata = (nftId: NFTId) => {
    const editNft = nfts.find((nft) => nft.id === nftId);

    if (editNft) {
      nftsStore.editNft = editNft;
      nftsStore.editMode = "UPDATE_METADATA";
    }
  };

  return (
    <List>
      {nfts.map((nft, idx) => (
        <ListItem
          key={idx}
          style={{ padding: "16px 16px 16px 0", alignItems: "start" }}
          divider
        >
          <ListItemText
            primary={nft.metadata.name || "Not defined"}
            secondary={
              <>
                ID: {nft.id}
                <br />
                {nft.metadata.description || "Not defined"}
              </>
            }
            style={{ margin: 0 }}
          />
          <Button
            variant="contained"
            onClick={() => editMetadata(nft.id)}
            style={{
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: 16,
            }}
          >
            Edit
          </Button>
        </ListItem>
      ))}
    </List>
  );
};

interface NFTsProps {
  nfts: NFT[];
}

const NoNFTsFound = (): JSX.Element => (
  <Typography textAlign="center" mt={2} color="rgba(255, 255, 255, 0.5)">
    No NFTs found
  </Typography>
);
