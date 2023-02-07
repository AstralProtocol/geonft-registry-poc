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
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { MultiPolygon } from "ol/geom";
import { NFT, NFTId } from "../features/nfts";
import { useStore } from "../store/store";
import { HEADER_HEIGHT } from "./Header";

export const NFTsList = observer((): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const store = useStore();
  const nfts = store.nfts;

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const renderContent = (): JSX.Element => {
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
  const nftsStore = useStore();

  const editMetadata = (nftId: NFTId) => {
    const editNft = nfts.find((nft) => nft.id === nftId);

    if (editNft) {
      nftsStore.setEditNft(editNft);
      nftsStore.setEditMode("UPDATE_METADATA");
    }
  };

  const locateNft = (nftId: NFTId) => {
    const editNft = nfts.find((nft) => nft.id === nftId);
    const map = nftsStore.map;

    if (editNft && map) {
      const layers = map.getLayers();
      const geoNftsLayer = layers
        .getArray()
        .find((layer) => layer.get("id") === "geoNfts-layer") as VectorLayer<
        VectorSource<MultiPolygon>
      >;

      if (!geoNftsLayer) return;

      const nftFeature = geoNftsLayer.getSource()?.getFeatureById(nftId);
      const TRANSITION_TIME_MILISECONDS = 1000;
      const VIEW_PADDING_PIXELS = 100; // padding around the feature extent
      map.getView().fit(nftFeature?.getGeometry() as MultiPolygon, {
        duration: TRANSITION_TIME_MILISECONDS,
        padding: [
          VIEW_PADDING_PIXELS,
          VIEW_PADDING_PIXELS,
          VIEW_PADDING_PIXELS,
          VIEW_PADDING_PIXELS,
        ],
      });
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
          <Button
            style={{ marginLeft: "4px" }}
            variant="outlined"
            title="Locate NFT"
            onClick={() => locateNft(nft.id)}
          >
            <LocationOnIcon />
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
