import { useState, useEffect } from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Button, Box, Typography, CircularProgress } from "@mui/material";
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
import NFTForm, { Metadata } from "../NFTForm";
import { nftsStore } from "../../features/nfts/nftsStore";
import { MapBrowserEvent } from "ol";

enum Status {
  IDLE,
  CREATE,
  EDIT_GEOMETRY,
  EDIT_METADATA,
}

enum EditionStatus {
  DRAW,
  MODIFY,
  DELETE,
}

let isDeleteFeatureActive = false;

const MapWrapper = observer((): JSX.Element => {
  const { nfts } = nftsStore;
  console.log("MAP NFTS: ", toJS(nfts));

  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [editionStatus, setEditionStatus] = useState<EditionStatus>(
    EditionStatus.MODIFY
  );
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [geojson, setGeojson] = useState("");
  const [metadata, setMetadata] = useState<Metadata | undefined>();
  const [selectedFeature, setSelectedFeature] = useState<
    Feature<MultiPolygon> | undefined
  >();

  useEffect(() => {
    initMap.setTarget("map");
    initMap.on("click", (e) => _deleteClickedFeature(initMap, e));
    select.on("select", (e) => {
      const selectedFeature = e.target.getFeatures().getArray()[0];
      setSelectedFeature(selectedFeature);
    });
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

  useEffect(() => {
    const isDeleteStatus = editionStatus === EditionStatus.DELETE;
    isDeleteFeatureActive = isDeleteStatus;
  }, [editionStatus]);

  // PUBLIC FUNCTIONS
  const createNft = () => {
    setStatus(Status.CREATE);
    draw.setActive(true);
  };

  const editGeometry = () => {
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
    setStatus(Status.EDIT_GEOMETRY);
    setEditionDrawMode();
  };

  const editMetadata = () => {
    setStatus(Status.EDIT_METADATA);
    _setSelectedFeatureAsEditNft();
  };

  const accept = async () => {
    if (status === Status.CREATE) {
      try {
        _createNft();
      } catch (error) {
        console.error(error);
        alert("Could not create GeoNFT");
      }
    }

    if (status === Status.EDIT_GEOMETRY) {
      try {
        await _updateNftGeometry();
      } catch (error) {
        console.error(error);
        alert("Could not modify GeoNFT geometry");
      }
    }
    setStatus(Status.IDLE);
  };

  const cancel = () => {
    if (confirm("Are you sure you want to cancel?")) {
      _resetEdition();
      setStatus(Status.IDLE);
    }
  };

  const setEditionDrawMode = () => {
    setEditionStatus(EditionStatus.DRAW);
    modify.setActive(false);
    draw.setActive(true);
  };

  const setEditionModifyMode = () => {
    setEditionStatus(EditionStatus.MODIFY);
    modify.setActive(true);
    draw.setActive(false);
  };

  const setEditionDeleteMode = () => {
    setEditionStatus(EditionStatus.DELETE);
    modify.setActive(false);
    draw.setActive(false);
  };

  // PRIVATE FUNCTIONS
  const _createNft = () => {
    const createdFeaturesPolygon = _getEditLayer().getSource()?.getFeatures();

    if (!createdFeaturesPolygon || createdFeaturesPolygon.length === 0) {
      throw new Error("Geometry cannot be empty");
    }

    const createdFeatureMultiPolygon =
      _convertPolygonFeaturesToMultiPolygonFeature(createdFeaturesPolygon);
    const geojson = new GeoJSON().writeFeature(createdFeatureMultiPolygon);

    setMetadata(undefined);
    setGeojson(geojson);
    setFormIsOpen(true);
  };

  const _onFormSubmit = () => {
    const createdFeaturesPolygon = _getEditLayer().getSource()?.getFeatures();

    if (!createdFeaturesPolygon || createdFeaturesPolygon.length === 0) {
      console.log("INSIDE ERROR");
      throw new Error("Geometry cannot be empty");
    }

    const createdFeatureMultiPolygon =
      _convertPolygonFeaturesToMultiPolygonFeature(createdFeaturesPolygon);

    geoNftsLayer.getSource()?.addFeature(createdFeatureMultiPolygon);
    _resetEdition();
  };

  const _updateNftGeometry = async () => {
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

  const _deleteClickedFeature = (map: Map, e: MapBrowserEvent<any>) => {
    if (!map || !isDeleteFeatureActive) return;

    const editLayerSource = editLayer.getSource();

    if (!editLayerSource) return;

    map.forEachFeatureAtPixel(e.pixel, (feature) => {
      const numberOfFeatures = editLayerSource.getFeatures().length;

      if (numberOfFeatures < 2) {
        alert("Cannot delete last feature");
        return;
      }

      editLayerSource.removeFeature(feature as unknown as Feature<Polygon>);
    });
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
          onClick={createNft}
          disabled={status === Status.CREATE || status === Status.EDIT_GEOMETRY}
        >
          Create NFT
        </Button>
        <Button
          variant="contained"
          onClick={editGeometry}
          disabled={
            status === Status.CREATE ||
            status === Status.EDIT_GEOMETRY ||
            !selectedFeature
          }
        >
          Edit geometry
        </Button>
        <Button
          variant="contained"
          onClick={editMetadata}
          disabled={
            status === Status.CREATE ||
            status === Status.EDIT_GEOMETRY ||
            !selectedFeature
          }
        >
          Edit metadata
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={accept}
          disabled={
            !(status === Status.CREATE || status === Status.EDIT_GEOMETRY)
          }
        >
          Accept
        </Button>
        <Button variant="contained" color="error" onClick={cancel}>
          Cancel
        </Button>
      </Box>
      <Box
        position="absolute"
        bottom={8}
        left={8}
        display={status === Status.EDIT_GEOMETRY ? "flex" : "none"}
        padding={1}
        borderRadius={1}
        bgcolor="#000000d4"
      >
        <Button
          color="info"
          onClick={setEditionDrawMode}
          disabled={editionStatus === EditionStatus.DRAW}
        >
          Draw
        </Button>
        <Button
          color="warning"
          onClick={setEditionModifyMode}
          disabled={editionStatus === EditionStatus.MODIFY}
        >
          Modify
        </Button>
        <Button
          color="error"
          onClick={setEditionDeleteMode}
          disabled={editionStatus === EditionStatus.DELETE}
        >
          Delete
        </Button>
      </Box>
      <NFTForm
        open={formIsOpen}
        metadata={metadata}
        geojson={geojson}
        onAccept={_onFormSubmit}
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
