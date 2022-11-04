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

const MapWrapper = observer((): JSX.Element => {
  const { nfts } = nftsStore;
  console.log("IS BUSY FETCHING: ", nftsStore.isBusyFetching);

  console.log("RENDERING MAP");

  const [map, setMap] = useState<Map>();
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [geojson, setGeojson] = useState("");
  const [metadata, setMetadata] = useState<Metadata | undefined>();

  const toggleDraw = () => {
    draw.setActive(!drawEnabled);
    setDrawEnabled(!drawEnabled);
  };

  const createGeoNFT = () => {
    const editLayer = getEditLayer();
    const editFeatures = editLayer.getSource()?.getFeatures();

    if (!editFeatures || editFeatures.length === 0) {
      throw new Error("Geometry cannot be empty");
    }

    const multiPolygonFeature =
      convertPolygonFeaturesToMultiPolygonFeature(editFeatures);
    const geojson = new GeoJSON().writeFeature(multiPolygonFeature);

    setMetadata(undefined);
    setGeojson(geojson);
    setFormIsOpen(true);
  };

  const convertPolygonFeaturesToMultiPolygonFeature = (
    features: Feature<Polygon>[]
  ): Feature<MultiPolygon> => {
    const multiPolygonCoordinatesArray = features.map((feature) => {
      const geometry = (feature.getGeometry() as Polygon) || new Polygon([]);
      return geometry.getCoordinates();
    });

    const multiPolygonFeature = new Feature({
      geometry: new MultiPolygon(multiPolygonCoordinatesArray),
    });

    return multiPolygonFeature;
  };

  const editGeoNFT = () => {
    const selectedFeature = select.getFeatures().getArray()[0];

    if (!selectedFeature) {
      return;
    }

    const metadata = selectedFeature.getProperties() as Metadata;
    const geojson = new GeoJSON().writeFeature(selectedFeature);

    setMetadata(metadata);
    setGeojson(geojson);
    setFormIsOpen(true);
  };

  const getEditLayer = (): VectorLayer<VectorSource<Polygon>> => {
    if (!map) {
      throw new Error("Map is not initialized");
    }

    const layer = map
      .getLayers()
      .getArray()
      .find((layer) => {
        return layer.getProperties().id === "edit-layer";
      }) as unknown as VectorLayer<VectorSource<Polygon>>;

    if (!layer) {
      throw new Error("Edit layer does not exists");
    }

    return layer;
  };

  useEffect(() => {
    initMap.setTarget("map");

    setDrawEnabled(false);
    setMap(initMap);
  }, []);

  useEffect(() => {
    if (!nfts || nfts.length === 0) return;

    nfts.forEach((nft) => {
      const { geojson, metadata } = nft;
      const geojsonFeatures = new GeoJSON().readFeatures(
        JSON.parse(geojson)
      ) as Feature<MultiPolygon>[];

      geojsonFeatures[0].setProperties(metadata);
      geoNftsLayer.getSource()?.addFeatures(geojsonFeatures);
    });
  }, [nfts]);

  return (
    <div>
      <Box id="map" width="100%" height="400px" position="relative">
        {nftsStore.isBusyFetching && <NFTsLoaderDisplay />}
      </Box>
      <Box mt={2} display="flex" flexDirection="row" gap={2}>
        <Button
          variant="contained"
          color={drawEnabled ? "secondary" : "primary"}
          onClick={toggleDraw}
        >
          {drawEnabled ? "Disable Draw" : "Enable Draw"}
        </Button>
        <Button variant="contained" onClick={createGeoNFT}>
          <Tooltip title="Add NFT" placement="top">
            <i className="material-icons">add</i>
          </Tooltip>
          Add GeoNFT
        </Button>
        <Button variant="contained" onClick={editGeoNFT}>
          Edit GeoNFT
        </Button>
        <AddNFTForm
          open={formIsOpen}
          metadata={metadata}
          geojson={geojson}
          closeForm={() => setFormIsOpen(false)}
        />
      </Box>
    </div>
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
