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
import { NFTId, NFTMetadata } from "../features/nfts";
import { useStore } from "../store/store";
import { useAccount } from "wagmi";

const NFTForm = observer((props: NFTProps) => {
  const { open, geojson, closeForm, onAccept } = props;
  const nftsStore = useStore();
  const { address } = useAccount();
  const metadata = nftsStore.editNft?.metadata;

  const [error, setError] = useState("");
  const [name, setName] = useState(metadata?.name || "");
  const [description, setDescription] = useState(metadata?.description || "");
  const [fileUrl, setFileUrl] = useState(metadata?.image || "");
  const [file, setFile] = useState<File | undefined>(undefined);

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
    let nftId: NFTId | undefined = undefined;

    try {
      const imageUri = file ? await nftsStore.storeImageOnIpfs(file) : "";
      const newMetadata: NFTMetadata = {
        name,
        description,
        image: imageUri,
      };

      if (nftsStore.editMode === "UPDATE_METADATA") {
        await updateNft(newMetadata);
      }

      if (nftsStore.editMode === "CREATE") {
        nftId = await createNft(newMetadata);
      }
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
    onAccept(nftId);
    handleClose();
    nftsStore.isBusyMinting = false;
  };

  const createNft = async (
    metadata: NFTMetadata
  ): Promise<NFTId | undefined> => {
    if (!geojson) {
      throw new Error("GeoJSON is not defined");
    }

    try {
      const nftId = await nftsStore.mint(metadata, geojson, address);

      if (!nftId) {
        throw new Error("Created NFT ID is not defined");
      }
      return nftId;
    } catch (err) {
      setError("Failed to mint NFT");
      console.error(error);
    }
  };

  const updateNft = async (metadata: NFTMetadata) => {
    const docId = nftsStore.editNft?.metadataURI;

    if (!docId) {
      throw new Error("NFT ID is not defined");
    }

    await nftsStore.updateNftMetadata(docId, metadata);
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
                {nftsStore.editMode === "CREATE" ? "Create NFT" : "Update NFT"}
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
  geojson?: string;
  closeForm: () => void;
  onAccept: (nftId: NFTId | undefined) => void;
}

export default NFTForm;
