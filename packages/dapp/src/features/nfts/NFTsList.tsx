import { observer } from "mobx-react-lite";
import { Box } from "@mui/system";
import { Typography, List, ListItem } from "@mui/material";
import { nftsStore } from "./nftsStore";

export const NFTsList = observer((): JSX.Element => {
  const nfts = nftsStore.nfts;

  return (
    <Box border={1} borderColor="white" borderRadius={2} p={4}>
      {nfts.length > 0 ? (
        <List>
          {nfts.map((nft) => (
            <ListItem key={nft.id}>
              <Typography variant="body2">{nft.metadata.name}</Typography>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography textAlign="center">No NFTs found</Typography>
      )}
    </Box>
  );
});
