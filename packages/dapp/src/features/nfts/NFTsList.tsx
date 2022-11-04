import { observer } from "mobx-react-lite";
import { Box } from "@mui/system";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { nftsStore, NFT } from "./nftsStore";

export const NFTsList = observer((): JSX.Element => {
  const nfts = nftsStore.nfts;

  const renderContent = (): JSX.Element => {
    if (nftsStore.isBusyFetching) {
      return <NFTsLoaderDisplay />;
    }

    return nfts.length === 0 ? <NoNFTsFound /> : <NFTs nfts={nfts} />;
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

const NFTs = ({ nfts }: NFTsProps): JSX.Element => (
  <List>
    {nfts.map((nft) => (
      <ListItem key={nft.id} style={{ paddingLeft: 0 }} divider>
        <Box mr={4}>ID: {nft.id}</Box>
        <ListItemText
          primary={nft.metadata.name || "Not defined"}
          secondary={nft.metadata.description || "Not defined"}
        />
      </ListItem>
    ))}
  </List>
);

interface NFTsProps {
  nfts: NFT[];
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
