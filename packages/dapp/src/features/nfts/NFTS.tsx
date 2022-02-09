import React from 'react';
import { useAppSelector } from '../../app/hooks';
import { selectNFTs } from './nftsSlice';
import {
  Grid,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';

import AddNFTForm from './AddNFTForm';

function NFTS() {
  const { nfts } = useAppSelector(selectNFTs);

  const display = (
    <Grid container>
      <Grid item xs={12} mb={8}>
        <AddNFTForm />
      </Grid>

      <ImageList variant="masonry" cols={3} gap={8}>
        {nfts.map((nft) => (
          <ImageListItem key={nft.id}>
            <img
              src={`${nft.metadata.image.replace(
                'ipfs://',
                'https://ipfs.infura.io/ipfs/'
              )}`}
              srcSet={`${nft.metadata.image.replace(
                'ipfs://',
                'https://ipfs.infura.io/ipfs/'
              )}`}
              alt={nft.metadata.name}
              loading="lazy"
            />
            <ImageListItemBar
              position="below"
              title={nft.metadata.name}
              subtitle={<span>{nft.metadata.description}</span>}
            />
          </ImageListItem>
        ))}
      </ImageList>
    </Grid>
  );

  return <div>{display}</div>;
}

export default NFTS;
