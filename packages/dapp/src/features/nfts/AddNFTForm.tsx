import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { walletStore } from "../wallet/walletStore";
import { docsStore } from "../docs/docsStore";
import { nftsStore } from "./nftsStore";

const MOCK_IPFS_URL = "ipfs://QmfMPuqGuJ1XHpqd8pXY8BLzwSVLjV987bGNJpqhkCdFRN";

const AddNFTForm = observer((props: NFTProps) => {
  const { open, metadata, geojson, closeForm, onAccept } = props;

  const [error, setError] = useState("");
  const [name, setName] = useState(metadata?.name || "");
  const [description, setDescription] = useState(metadata?.description || "");
  const [fileUrl, setFileUrl] = useState(metadata?.image || "");
  const [file, setFile] = useState<File | undefined>(undefined);

  const { ipfsClient } = walletStore;
  const { isBusyMinting } = nftsStore;

  const imgSrc = file
    ? URL.createObjectURL(file)
    : fileUrl.replace("ipfs://", "https://ipfs.io/ipfs/");

  useEffect(() => {
    if (metadata) {
      setName(metadata.name);
      setDescription(metadata.description);
      setFileUrl(metadata.image);
    }
  }, [metadata]);

  const onNameChanged = (e: {
    target: { value: React.SetStateAction<string> };
  }) => setName(e.target.value);
  const onDescriptionChanged = (e: {
    target: { value: React.SetStateAction<string> };
  }) => setDescription(e.target.value);

  const onFileLoadChange = async (e: any) => {
    const file = e.target.files[0];
    setFile(file);
    // if (ipfsClient == null) {
    //   throw new Error("IPFS client is not initialized");
    // }
    // try {
    //   const added = await ipfsClient.add(file, {
    //     progress: (prog: any) => console.log(`received: ${prog}`),
    //   });
    //   console.log(added.path);
    //   const url = `ipfs://${added.path}`;
    //   setFileUrl(url);
    // } catch (error) {
    //   console.log("Error uploading file: ", error);
    // }
  };

  const handleClose = () => {
    closeForm();
    nftsStore.editNft = null;
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

      nftsStore.isBusyMinting = true;

      if (metadata) {
        const nftId = nftsStore.editNft?.id;

        if (!nftId && nftId !== 0) {
          handleClose();
          throw new Error("NFT ID is not defined");
        }

        await nftsStore.updateNftMetadata(nftId, newMetadata);
      } else {
        const metadataURI = await docsStore.writeDocument(newMetadata);
        await nftsStore.mint({ metadataURI, geojson });
      }

      nftsStore.isBusyMinting = false;

      setName("");
      setDescription("");
      setFileUrl("");
      setError("");
      onAccept();
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
                accept="image/*"
                onChange={onFileLoadChange}
              />
              <Button color="secondary" variant="contained" component="span">
                Upload image
              </Button>
              <Typography
                component="span"
                variant="body2"
                color="textSecondary"
                ml={2}
              >
                {file?.name || "No file selected"}
              </Typography>
            </label>
            <div>
              {(fileUrl || file) && (
                <img
                  id="image-preview"
                  className="rounded mt-4"
                  alt="upload"
                  style={{
                    marginTop: "10px",
                    width: "auto",
                    height: "auto",
                    maxWidth: "100%",
                    maxHeight: "350px",
                  }}
                  src={imgSrc}
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
});

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
  onAccept: () => void;
}

export default AddNFTForm;
