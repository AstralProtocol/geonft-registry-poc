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
import "ol/ol.css";
import {
  initMap,
  select,
  draw,
  modify,
  editLayer,
  geoNftsLayer,
} from "./OpenLayersComponents";
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
  const [selectedFeature, setSelectedFeature] = useState<
    Feature<MultiPolygon> | undefined
  >();

  useEffect(() => {
    initMap.setTarget("map");

    // TODO: this event is ignored when draw is active. Drawing and deleting are incompatible.
    // initMap.on("click", (e) => {
    //   // TODO: status is not updated when event trigger; always idle
    //   if (status !== Status.MODIFY) return;
    //   initMap.forEachFeatureAtPixel(e.pixel, (feature) => {
    //     // console.log("Feature: ", feature);
    //     _getEditLayer()
    //       .getSource()
    //       ?.removeFeature(feature as unknown as Feature<Polygon>);
    //   });
    // });

    select.on("select", (e) => {
      const selectedFeature = e.target.getFeatures().getArray()[0];
      setSelectedFeature(selectedFeature);
    });

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

  useEffect(() => {
    _editNftMetadata();
  }, [nftsStore.editNft]);

  // PUBLIC FUNCTIONS
  const startDraw = () => {
    setStatus(Status.DRAW);
    draw.setActive(true);
  };

  const startModify = () => {
    if (!selectedFeature) {
      alert("Please select a feature to modify");
      return;
    }
    const polygonFeatures =
      _convertMultiPolygonFeatureToPolygonFeatures(selectedFeature);

    // Remove feature from geoNftsLayer and add it to editLayer
    geoNftsLayer.getSource()?.removeFeature(selectedFeature);
    editLayer.getSource()?.addFeatures(polygonFeatures);
    select.setActive(false);
    modify.setActive(true);
    // draw.setActive(true);
    setStatus(Status.MODIFY);
  };

  const editMetadata = () => {
    setStatus(Status.EDIT_METADATA);
    _setSelectedFeatureAsEditNft();
  };

  const accept = async () => {
    if (status === Status.DRAW) {
      try {
        _createGeoNFT();
      } catch (error) {
        console.error(error);
        alert("Could not create GeoNFT");
      }
    }

    if (status === Status.MODIFY) {
      try {
        await _updateGeoNFTGeometry();
      } catch (error) {
        console.error(error);
        alert("Could not modify GeoNFT geometry");
      }
    }

    _resetEdition();
    setStatus(Status.IDLE);
  };

  const cancel = () => {
    if (confirm("Are you sure you want to cancel?")) {
      _resetEdition();
      setStatus(Status.IDLE);
    }
  };

  // PRIVATE FUNCTIONS
  const _createGeoNFT = () => {
    const editLayer = _getEditLayer();
    const editFeatures = editLayer.getSource()?.getFeatures();

    if (!editFeatures || editFeatures.length === 0) {
      throw new Error("Geometry cannot be empty");
    }

    const multiPolygonFeature =
      _convertPolygonFeaturesToMultiPolygonFeature(editFeatures);
    const geojson = new GeoJSON().writeFeature(multiPolygonFeature);

    setMetadata(undefined);
    setGeojson(geojson);
    setFormIsOpen(true);
  };

  const _updateGeoNFTGeometry = async () => {
    if (!selectedFeature) {
      throw new Error("No feature selected");
    }

    const modifiedFeaturesPolygon = _getEditLayer().getSource()?.getFeatures();

    if (!modifiedFeaturesPolygon) {
      throw new Error("Geometry cannot be empty");
    }

    const modifiedFeatureMultiPolygon =
      _convertPolygonFeaturesToMultiPolygonFeature(modifiedFeaturesPolygon);
    const nftId = selectedFeature.getId() as number;
    const newGeojson = new GeoJSON().writeFeature(modifiedFeatureMultiPolygon);
    const success = await nftsStore.updateNftGeojson({
      tokenId: nftId,
      geojson: newGeojson,
    });

    if (success) {
      geoNftsLayer.getSource()?.addFeature(modifiedFeatureMultiPolygon);
    }
  };

  const _editNftMetadata = () => {
    const { editNft } = nftsStore;

    if (!editNft) {
      return;
    }

    setMetadata(editNft.metadata);
    setGeojson(editNft.geojson);
    setFormIsOpen(true);
  };

  const _setSelectedFeatureAsEditNft = () => {
    const selectedFeature = select.getFeatures().getArray()[0];

    if (!selectedFeature) {
      return;
    }

    const nftId = selectedFeature.getId() as number;
    if (!nftId && nftId !== 0) {
      throw new Error("NFT ID is not defined");
    }

    const editNft = nfts.find((nft) => nft.id === nftId);

    if (!editNft) {
      throw new Error("NFT not found");
    }

    nftsStore.editNft = editNft;
  };

  const _convertPolygonFeaturesToMultiPolygonFeature = (
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

  const _convertMultiPolygonFeatureToPolygonFeatures = (
    feature: Feature<MultiPolygon>
  ): Feature<Polygon>[] => {
    const multiPolygonGeometry = feature.getGeometry() as MultiPolygon;
    const polygonCoordinatesArray = multiPolygonGeometry.getCoordinates();
    const polygonFeatures = polygonCoordinatesArray.map(
      (polygonCoordinates) => {
        return new Feature({
          geometry: new Polygon(polygonCoordinates),
        });
      }
    );

    return polygonFeatures;
  };

  const _getEditLayer = (): VectorLayer<VectorSource<Polygon>> => {
    return editLayer;
  };

  const _resetEdition = () => {
    const editLayerSource = _getEditLayer().getSource();
    select.getFeatures().clear();
    select.setActive(true);
    draw.setActive(false);
    modify.setActive(false);
    editLayerSource?.clear();
    setSelectedFeature(undefined);
  };

  return (
    <Box position="relative">
      <Box id="map" width="100%" height="400px">
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
          onClick={startDraw}
          disabled={status === Status.DRAW || status === Status.MODIFY}
        >
          Create NFT
        </Button>
        <Button
          variant="contained"
          onClick={startModify}
          disabled={
            status === Status.DRAW ||
            status === Status.MODIFY ||
            !selectedFeature
          }
        >
          Edit geometry
        </Button>
        <Button
          variant="contained"
          onClick={editMetadata}
          disabled={
            status === Status.DRAW ||
            status === Status.MODIFY ||
            !selectedFeature
          }
        >
          Edit metadata
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={accept}
          disabled={!(status === Status.DRAW || status === Status.MODIFY)}
        >
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
