import React from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectDocs, writeDocument } from '../docs/docsSlice';
import { Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';

function CeramicDocs() {
  const { docs, isBusy } = useAppSelector(selectDocs);
  const dispatch = useAppDispatch();

  const display = (
    <Grid container>
      <Grid item xs={12} mb={8}>
        <LoadingButton
          loading={isBusy}
          variant="contained"
          onClick={() => dispatch(writeDocument())}
        >
          Write Document to Ceramic
        </LoadingButton>
      </Grid>

      {docs.map((doc) => (
        <Grid container key={doc.docID.toString()}>
          <Grid item xs={2}>
            Doc ID
          </Grid>
          <Grid item xs={10}>
            {doc.docID.toString()}
          </Grid>
          <Grid item xs={2}>
            date
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.date}
          </Grid>
          <Grid item xs={2}>
            name
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.name}
          </Grid>
          <Grid item xs={2}>
            lat
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.latitude}
          </Grid>
          <Grid item xs={2}>
            long
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.longitude}
          </Grid>
          <Grid item xs={2}>
            tmax
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.tmax}
          </Grid>
          <Grid item xs={2}>
            tmin
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.tmin}
          </Grid>
          <Grid item xs={2}>
            prcp
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.prcp}
          </Grid>
          <Grid item xs={2}>
            snow
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.snow}
          </Grid>
          <Grid item xs={2}>
            wind
          </Grid>
          <Grid item xs={10}>
            {doc.docContent?.wind}
          </Grid>
        </Grid>
      ))}
    </Grid>
  );

  return <div>{display}</div>;
}

export default CeramicDocs;
