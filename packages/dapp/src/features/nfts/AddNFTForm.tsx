import React, { useState, useEffect } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { walletStore } from "../wallet/walletStore";
import { nftsStore } from "./nftsStore";

function AddNFTForm({ open, metadata, geojson, closeForm }: NFTProps) {
  const [error, setError] = useState("");
  const [name, setName] = useState(metadata?.name || "");
  const [description, setDescription] = useState(metadata?.description || "");
  const [fileUrl, setFileUrl] = useState(metadata?.image || "");

  const { ipfsClient } = walletStore;

  useEffect(() => {
    if (metadata) {
      setName(metadata.name);
      setDescription(metadata.description);
      setFileUrl(metadata.image);
    }
  }, [metadata]);

  console.log(name);
  const onNameChanged = (e: {
    target: { value: React.SetStateAction<string> };
  }) => setName(e.target.value);
  const onDescriptionChanged = (e: {
    target: { value: React.SetStateAction<string> };
  }) => setDescription(e.target.value);

  const onFileLoadChange = async (e: any) => {
    const file = e.target.files[0];
    if (ipfsClient == null) {
      throw new Error("IPFS client is not initialized");
    }
    try {
      const added = await ipfsClient.add(file, {
        progress: (prog: any) => console.log(`received: ${prog}`),
      });
      console.log(added.path);
      const url = `ipfs://${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  };

  const handleClose = () => {
    closeForm();
  };

  const handleSubmit = async () => {
    if (ipfsClient == null) {
      throw new Error("IPFS client is not initialized");
    }

    if (!geojson) {
      throw new Error("GeoJSON is not defined");
    }

    try {
      const newMetadata = {
        name,
        description,
        image: fileUrl,
      };

      if (metadata) {
        // Update existing NFT
      } else {
        const metaRecv = await ipfsClient.add(JSON.stringify(newMetadata));

        await nftsStore.mint({ metadataURI: metaRecv.path, geojson: geojson });
      }

      setName("");
      setDescription("");
      setFileUrl("");
      setError("");
      handleClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          Create NFT {error && <Alert severity="error">{error}</Alert>}
        </DialogTitle>
        <DialogContent>
          <form>
            <label htmlFor="upload-file">
              <input
                style={{ display: "none" }}
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
                  style={{ marginTop: "10px" }}
                  src={`${fileUrl.replace(
                    "ipfs://",
                    "https://ipfs.infura.io/ipfs/"
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
            <div>
              <pre>
                {geojson && JSON.stringify(JSON.parse(geojson), null, 2)}
              </pre>
            </div>
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
                // loading={isBusyMinting}
                loading={false}
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

export interface Metadata {
  name: string;
  description: string;
  image: string;
}

interface NFTProps {
  open: boolean;
  metadata: Metadata | undefined;
  geojson?: string;
  closeForm: () => void;
}

export default AddNFTForm;
