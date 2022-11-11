import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
  Button,
  Box,
  Tooltip,
  Typography,
  CircularProgress,
} from "@mui/material";
import Map from "ol/Map";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Polygon, MultiPolygon } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import { initMap, draw, select, geoNftsLayer } from "./OpenLayersComponents";
import AddNFTForm, { Metadata } from "../../features/nfts/AddNFTForm";
import { nftsStore } from "../../features/nfts/nftsStore";

enum Status {
  IDLE,
  DRAW,
  MODIFY,
  EDIT_METADATA,
}

const MapWrapper = observer((): JSX.Element => {
  const { nfts } = nftsStore;

  const [map, setMap] = useState<Map>();
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [geojson, setGeojson] = useState("");
  const [metadata, setMetadata] = useState<Metadata | undefined>();

  // const toggleDraw = () => {
  //   draw.setActive(!drawEnabled);
  //   setDrawEnabled(!drawEnabled);
  // };

  // const createGeoNFT = () => {
  //   const editLayer = getEditLayer();
  //   const editFeatures = editLayer.getSource()?.getFeatures();

  //   if (!editFeatures || editFeatures.length === 0) {
  //     throw new Error("Geometry cannot be empty");
  //   }

  //   const multiPolygonFeature =
  //     convertPolygonFeaturesToMultiPolygonFeature(editFeatures);
  //   const geojson = new GeoJSON().writeFeature(multiPolygonFeature);

  //   setMetadata(undefined);
  //   setGeojson(geojson);
  //   setFormIsOpen(true);
  // };

  // const editGeoNFT = () => {
  //   const { editNft } = nftsStore;

  //   if (!editNft) {
  //     return;
  //   }

  //   setMetadata(editNft.metadata);
  //   setGeojson(editNft.geojson);
  //   setFormIsOpen(true);
  // };

  // const setSelectedFeatureAsEditNft = () => {
  //   const selectedFeature = select.getFeatures().getArray()[0];

  //   if (!selectedFeature) {
  //     return;
  //   }

  //   const nftId = selectedFeature.getId() as number;
  //   if (!nftId && nftId !== 0) {
  //     throw new Error("NFT ID is not defined");
  //   }

  //   const editNft = nfts.find((nft) => nft.id === nftId);

  //   if (!editNft) {
  //     throw new Error("NFT not found");
  //   }

  //   nftsStore.editNft = editNft;
  // };

  // const convertPolygonFeaturesToMultiPolygonFeature = (
  //   features: Feature<Polygon>[]
  // ): Feature<MultiPolygon> => {
  //   const multiPolygonCoordinatesArray = features.map((feature) => {
  //     const geometry = (feature.getGeometry() as Polygon) || new Polygon([]);
  //     return geometry.getCoordinates();
  //   });

  //   const multiPolygonFeature = new Feature({
  //     geometry: new MultiPolygon(multiPolygonCoordinatesArray),
  //   });

  //   return multiPolygonFeature;
  // };

  // const getEditLayer = (): VectorLayer<VectorSource<Polygon>> => {
  //   if (!map) {
  //     throw new Error("Map is not initialized");
  //   }

  //   const layer = map
  //     .getLayers()
  //     .getArray()
  //     .find((layer) => {
  //       return layer.getProperties().id === "edit-layer";
  //     }) as unknown as VectorLayer<VectorSource<Polygon>>;

  //   if (!layer) {
  //     throw new Error("Edit layer does not exists");
  //   }

  //   return layer;
  // };

  const draw = () => {
    setStatus(Status.DRAW);
  };

  const modify = () => {
    setStatus(Status.MODIFY);
  };

  const editMetadata = () => {
    setStatus(Status.EDIT_METADATA);
  };

  const accept = () => {
    setStatus(Status.IDLE);
  };

  const cancel = () => {
    setStatus(Status.IDLE);
  };

  useEffect(() => {
    initMap.setTarget("map");
    setMap(initMap);
  }, []);

  useEffect(() => {
    if (!nfts || nfts.length === 0) return;

    nfts.forEach((nft) => {
      const { geojson, metadata } = nft;
      const geojsonFeatures = new GeoJSON().readFeatures(
        JSON.parse(geojson)
      ) as Feature<MultiPolygon>[];

      const feature = geojsonFeatures[0];
      feature.setId(nft.id);
      feature.setProperties(metadata);
      geoNftsLayer.getSource()?.addFeatures([feature]);
    });
  }, [nfts]);

  // useEffect(() => {
  //   editGeoNFT();
  // }, [nftsStore.editNft]);

  return (
    <Box position="relative">
      <Box id="map" width="100%" height="400px" position="relative">
        {nftsStore.isBusyFetching && <NFTsLoaderDisplay />}
      </Box>
      <Box
        position="absolute"
        top={8}
        left={8}
        display="flex"
        flexDirection="column"
        gap={2}
        padding={1}
        borderRadius={1}
        bgcolor="#00000052"
      >
        <Button
          variant="contained"
          onClick={draw}
          disabled={status === Status.DRAW}
        >
          Draw
        </Button>
        <Button
          variant="contained"
          onClick={modify}
          disabled={status === Status.MODIFY}
        >
          Modify
        </Button>
        <Button variant="contained" onClick={editMetadata}>
          Edit metadata
        </Button>
        <Button variant="contained" color="secondary" onClick={accept}>
          Accept
        </Button>
        <Button variant="contained" color="error" onClick={cancel}>
          Cancel
        </Button>
      </Box>
      <AddNFTForm
        open={formIsOpen}
        metadata={metadata}
        geojson={geojson}
        closeForm={() => setFormIsOpen(false)}
      />
    </Box>
  );
});

const NFTsLoaderDisplay = (): JSX.Element => (
  <Box
    width="100%"
    height="100%"
    position="absolute"
    top={0}
    left={0}
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    bgcolor="rgba(0, 0, 0, 0.5)"
    zIndex={9999}
  >
    <Typography variant="h5" color="white">
      Fetching NFTs...
    </Typography>
    <Box mt={2} color="white">
      <CircularProgress color="inherit" />
    </Box>
  </Box>
);

export default MapWrapper;
