import { observer } from "mobx-react-lite";
import { Box } from "@mui/system";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { NFT } from "../features/nfts/nftsCore";
import { nftsStore } from "../features/nfts/nftsStore";

export const NFTsList = observer((): JSX.Element => {
  const nfts = nftsStore.nfts;

  const renderContent = (): JSX.Element => {
    if (nftsStore.isBusyFetching) {
      return <NFTsLoaderDisplay />;
    }

    if (nfts.length === 0) {
      return <NoNFTsFound />;
    }

    return <NFTs nfts={nfts} editMetadata={editMetadata} />;
  };

  const editMetadata = (nftId: number) => {
    const editNft = nfts.find((nft) => nft.id === nftId);

    if (editNft) {
      nftsStore.editNft = editNft;
    }
  };

  return (
    <Box border={1} borderColor="white" borderRadius={2} p={4}>
      <Typography variant="h5" gutterBottom>
        NFTs
      </Typography>
      {renderContent()}
    </Box>
  );
});

const NFTs = ({ nfts, editMetadata }: NFTsProps): JSX.Element => (
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

interface NFTsProps {
  nfts: NFT[];
  editMetadata: (nftId: number) => void;
}

const NFTsLoaderDisplay = (): JSX.Element => (
  <Box
    width="100%"
    height="100%"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
  >
    <Typography variant="h5" color="white">
      Fetching NFTs...
    </Typography>
    <Box mt={2} color="white">
      <CircularProgress color="inherit" />
    </Box>
  </Box>
);

const NoNFTsFound = (): JSX.Element => (
  <Typography textAlign="center">No NFTs found</Typography>
);
