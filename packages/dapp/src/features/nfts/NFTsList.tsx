import { observer } from "mobx-react-lite";
import { Box } from "@mui/system";
import { Typography, List, ListItem, ListItemText } from "@mui/material";
import { nftsStore } from "./nftsStore";

export const NFTsList = observer((): JSX.Element => {
  const nfts = nftsStore.nfts;

  return (
    <Box border={1} borderColor="white" borderRadius={2} p={4}>
      <Typography variant="h5" gutterBottom>
        NFTs
      </Typography>
      {nfts.length > 0 ? (
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
      ) : (
        <Typography textAlign="center">No NFTs found</Typography>
      )}
    </Box>
  );
});
