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
import { walletStore } from "../features/wallet/walletStore";
import { docsStore } from "../features/docs/docsStore";
import { nftsStore } from "../features/nfts/nftsStore";

const NFTForm = observer((props: NFTProps) => {
  const { open, metadata, geojson, closeForm, onAccept } = props;
  console.log("AddNFTForm metadata", metadata);

  const [error, setError] = useState("");
  const [name, setName] = useState(metadata?.name || "");
  const [description, setDescription] = useState(metadata?.description || "");
  const [fileUrl, setFileUrl] = useState(metadata?.image || "");
  const [file, setFile] = useState<File | undefined>(undefined);

  const { ipfsClient } = walletStore;
  const { isBusyMinting } = nftsStore;

  const imgSrc = file
    ? URL.createObjectURL(file)
    : `https://ipfs.io/ipfs/${fileUrl}`;

  useEffect(() => {
    if (metadata) {
      setName(metadata.name);
      setDescription(metadata.description);
      setFileUrl(metadata.image);
    }
  }, [metadata]);

  const onNameChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const onDescriptionChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const onFileLoadChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
    }
  };

  const handleClose = () => {
    closeForm();
    nftsStore.editNft = null;
  };

  const handleSubmit = async () => {
    nftsStore.isBusyMinting = true;
    try {
      metadata ? await updateNft() : await createNft();
    } catch (err) {
      err instanceof Error
        ? setError(err.message)
        : setError("Unknown error occurred");

      console.error(err);
    }

    setName("");
    setDescription("");
    setFileUrl("");
    setError("");
    onAccept();
    handleClose();
    nftsStore.isBusyMinting = false;
  };

  const createNft = async () => {
    if (!geojson) {
      throw new Error("GeoJSON is not defined");
    }

    if (!ipfsClient) {
      throw new Error("IPFS client is not defined");
    }

    const image = file ? await storeImageOnIpfs(file) : "";
    const newMetadata = {
      name,
      description,
      image,
    };

    const metadataURI = await docsStore.writeDocument(newMetadata);
    await nftsStore.mint(metadataURI, geojson);
  };

  const updateNft = async () => {
    if (!ipfsClient) {
      throw new Error("IPFS client is not defined");
    }

    const image = file ? await storeImageOnIpfs(file) : "";
    const newMetadata = {
      name,
      description,
      image,
    };

    const docId = nftsStore.editNft?.metadataURI;

    if (!docId) {
      throw new Error("NFT ID is not defined");
    }

    await nftsStore.updateNftMetadata(docId, newMetadata);
  };

  const storeImageOnIpfs = async (file: File): Promise<string> => {
    if (!ipfsClient) {
      throw new Error("IPFS client is not defined");
    }

    const added = await ipfsClient.add(file, {
      progress: (prog: any) => console.log(`received: ${prog}`),
    });
    const IpfsImagePath = added.path;
    return IpfsImagePath;
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
                onChange={onFileLoadChanged}
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

export default NFTForm;
