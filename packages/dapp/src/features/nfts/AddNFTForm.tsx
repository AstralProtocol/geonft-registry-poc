import React, { useState } from 'react';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextareaAutosize,
  TextField,
  Tooltip,
} from '@mui/material';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectWallet } from '../wallet/walletSlice';
import { mint, selectNFTs } from './nftsSlice';
import geoJson2 from './geojson2.json';
import { LoadingButton } from '@mui/lab';

function AddNFTForm() {
  const dispatch = useAppDispatch();

  const { ipfsClient } = useAppSelector(selectWallet);
  const { isBusyMinting } = useAppSelector(selectNFTs);

  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [geojson, setGeojson] = useState(JSON.stringify(geoJson2));
  const [fileUrl, setFileUrl] = useState('');

  const onNameChanged = (e: {
    target: { value: React.SetStateAction<string> };
  }) => setName(e.target.value);
  const onDescriptionChanged = (e: {
    target: { value: React.SetStateAction<string> };
  }) => setDescription(e.target.value);
  const onGeojsonChanged = (e: {
    target: { value: React.SetStateAction<string> };
  }) => setGeojson(e.target.value);

  const onFileLoadChange = async (e: any) => {
    const file = e.target.files[0];
    if (ipfsClient == null) {
      throw new Error('IPFS client is not initialized');
    }
    try {
      const added = await ipfsClient.add(file, {
        progress: (prog: any) => console.log(`received: ${prog}`),
      });
      console.log(added);
      console.log(added.path);
      const url = `ipfs://${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (ipfsClient == null) {
      throw new Error('IPFS client is not initialized');
    }
    try {
      const metadata = {
        name: name,
        description: description,
        image: fileUrl,
        geojson: geojson,
      };
      const metaRecv = await ipfsClient.add(JSON.stringify(metadata));

      await dispatch(
        mint({ metadataURI: metaRecv.path, geojson: geojson })
      ).unwrap();
      setName('');
      setDescription('');
      setGeojson(JSON.stringify(geoJson2));
      setFileUrl('');
      setError('');
      handleClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Button variant="contained" onClick={handleOpen}>
        <Tooltip title="Add NFT" placement="top">
          <i className="material-icons">add</i>
        </Tooltip>
        Add GeoNFT
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          Create NFT {error && <Alert severity="error">{error}</Alert>}
        </DialogTitle>
        <DialogContent>
          <form>
            <label htmlFor="upload-file">
              <input
                style={{ display: 'none' }}
                id="upload-file"
                name="upload-file"
                type="file"
                onChange={onFileLoadChange}
              />
              <Button color="secondary" variant="contained" component="span">
                Upload image
              </Button>
            </label>
            <div>
              {fileUrl && (
                <img
                  className="rounded mt-4"
                  alt="upload"
                  width="350"
                  style={{ marginTop: '10px' }}
                  src={`${fileUrl.replace(
                    'ipfs://',
                    'https://ipfs.infura.io/ipfs/'
                  )}`}
                />
              )}
            </div>
            <TextField
              fullWidth
              id="nftName"
              name="nftName"
              label="Name"
              variant="outlined"
              value={name}
              onChange={onNameChanged}
              margin="normal"
            />
            <TextField
              fullWidth
              id="nftDesc"
              name="nftDesc"
              label="Description"
              variant="outlined"
              value={description}
              onChange={onDescriptionChanged}
              margin="normal"
            />
            <TextareaAutosize
              id="nftGeojson"
              name="nftGeojson"
              aria-label="empty textarea"
              placeholder="Empty"
              style={{ width: '100%' }}
              value={geojson}
              onChange={onGeojsonChanged}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Grid container justifyContent="flex-end" spacing={1}>
            <Grid item>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleClose}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item>
              <LoadingButton
                loading={isBusyMinting}
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
              >
                Create NFT
              </LoadingButton>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AddNFTForm;
