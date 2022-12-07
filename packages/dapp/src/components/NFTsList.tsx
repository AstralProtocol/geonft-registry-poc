import { observer } from "mobx-react-lite";
import { Box } from "@mui/system";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { NFT, NFTId } from "../features/nfts/nftsCore";
import { useNftsStore } from "../features/nfts/nftsStore";
import { Loading } from "./Loading";
import { HEADER_HEIGHT } from "./Header";

export const NFTsList = observer((): JSX.Element => {
  const nftsStore = useNftsStore();
  const nfts = nftsStore.nfts;

  const renderContent = (): JSX.Element => {
    if (nftsStore.isBusyFetching) {
      return <Loading>Loading NFTs...</Loading>;
    }

    if (nfts.length === 0) {
      return <NoNFTsFound />;
    }

    return <NFTs nfts={nfts} />;
  };

  return (
    <Box
      p={4}
      height={`calc(100vh - ${HEADER_HEIGHT}px)`}
      overflow="auto"
      boxShadow={8}
      zIndex={9}
      position="relative"
    >
      <Typography variant="h5" gutterBottom>
        NFTs
      </Typography>
      {renderContent()}
    </Box>
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
      {nfts.map((nft) => (
        <ListItem key={nft.id} style={{ paddingLeft: 0 }} divider>
          <ListItemText
            primary={nft.metadata.name || "Not defined"}
            secondary={
              <>
                ID: {nft.id}
                <br />
                {nft.metadata.description || "Not defined"}
              </>
            }
          />
          <Button variant="contained" onClick={() => editMetadata(nft.id)}>
            Edit metadata
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
  <Typography textAlign="center">No NFTs found</Typography>
);
