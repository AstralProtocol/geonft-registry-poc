import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Button, Box, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import MapOL from "ol/Map";
import View from "ol/View";
import Feature, { FeatureLike } from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Polygon, MultiPolygon } from "ol/geom";
import Overlay from "ol/Overlay";
import { defaults as defaultInteractions } from "ol/interaction";
import { fromLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import { getCenter } from "ol/extent";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { NFTId } from "../../features/nfts";
import { useStore } from "../../store/store";
import NFTForm from "../NFTForm";
import { Alert } from "../Alert";
import { HEADER_HEIGHT } from "../Header";
import notFoundImage from "../../assets/no-image-found.png";
import {
  select,
  draw,
  modify,
  editLayer,
  geoNftsLayer,
  cartographicBasemap,
} from "./OpenLayersVariables";
import "ol/ol.css";
import { useAccount } from "wagmi";

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
let popup: Overlay | null = null;

const useStyles = makeStyles({
  container: {
    position: "relative",
    maxWidth: 200,
    backgroundColor: "white",
    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
    borderRadius: 2,
    "&:before": {
      content: '""',
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      position: "absolute",
      border: "solid transparent",
      borderTopColor: "white",
      borderWidth: 11,
      pointerEvents: "none",
      marginTop: "-1px",
    },
    "&:after": {
      content: '""',
      top: "100%",
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      position: "absolute",
      border: "solid transparent",
      borderTopColor: "white",
      borderWidth: 10,
      pointerEvents: "none",
      marginTop: "-1px",
    },
  },
  body: {
    color: "black",
    padding: 1,
  },
});

export const Map = observer((): JSX.Element => {
  const store = useStore();
  const popupStyles = useStyles();
  const { address } = useAccount();
  const { nfts } = store;

  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [editionStatus, setEditionStatus] = useState<EditionStatus>(
    EditionStatus.MODIFY
  );
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [geojson, setGeojson] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<
    Feature<MultiPolygon> | undefined
  >();
  const [confirmTransactionAlert, setConfirmTransactionAlert] = useState(false);

  useEffect(() => {
    const initMap = new MapOL({
      target: "map",
      layers: [cartographicBasemap, geoNftsLayer, editLayer],
      view: new View({
        projection: "EPSG:3857",
        center: fromLonLat([-4.13, 39.48]),
        zoom: 6,
      }),
      interactions: defaultInteractions().extend([select, draw, modify]),
      controls: [],
    });
    initMap.on("click", (e) => _deleteClickedFeature(initMap, e));
    initMap.on("pointermove", (e) => _showFeatureInfo(initMap, e));
    select.on("select", (e) => {
      const selectedFeature = e.target.getFeatures().getArray()[0];
      setSelectedFeature(selectedFeature);
    });
    popup = new Overlay({
      element: document.getElementById("overlay") || undefined,
      offset: [0, 0],
      positioning: "bottom-center",
    });
    initMap.addOverlay(popup);
    store.setMap(initMap);

    return () => {
      initMap.un("click", (e) => _deleteClickedFeature(initMap, e));
      initMap.un("pointermove", (e) => _showFeatureInfo(initMap, e));
      initMap.setTarget(undefined);
      select.un("select", (e) => {
        const selectedFeature = e.target.getFeatures().getArray()[0];
        setSelectedFeature(selectedFeature);
      });
      if (popup) initMap.removeOverlay(popup);
    };
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
  }, [store.editNft]);

  useEffect(() => {
    const isDeleteStatus = editionStatus === EditionStatus.DELETE;
    isDeleteFeatureActive = isDeleteStatus;
  }, [editionStatus]);

  // PUBLIC FUNCTIONS
  const createNft = () => {
    store.setEditMode("CREATE");
    setStatus(Status.CREATE);
    draw.setActive(true);
  };

  const editGeometry = () => {
    if (!selectedFeature) {
      alert("Please select a feature to modify");
      return;
    }
    store.setEditMode("UPDATE_GEOMETRY");
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
    store.setEditMode("UPDATE_METADATA");
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

    setGeojson(geojson);
    setFormIsOpen(true);
  };

  const _onFormSubmit = (nftId: NFTId | undefined) => {
    const mode = store.editMode;

    if (mode === "UPDATE_METADATA") {
      _resetEdition();
      return;
    }

    if (mode === "CREATE" || mode === "UPDATE_GEOMETRY") {
      const createdFeaturesPolygon = _getEditLayer().getSource()?.getFeatures();

      if (!createdFeaturesPolygon || createdFeaturesPolygon.length === 0) {
        throw new Error("Geometry cannot be empty");
      }

      const createdFeatureMultiPolygon =
        _convertPolygonFeaturesToMultiPolygonFeature(createdFeaturesPolygon);

      if (nftId) {
        createdFeatureMultiPolygon.setId(nftId);
      }

      geoNftsLayer.getSource()?.addFeature(createdFeatureMultiPolygon);
      _resetEdition();
    }
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
    setConfirmTransactionAlert(true);
    const success = await store.updateNftGeojson(nftId, newGeojson, address);
    setConfirmTransactionAlert(false);

    if (success) {
      geoNftsLayer.getSource()?.addFeature(modifiedFeatureMultiPolygon);
    }

    _resetEdition();
  };

  const _editNftMetadata = () => {
    const { editNft } = store;

    if (!editNft) return;

    setGeojson(editNft.geojson);
    setFormIsOpen(true);
  };

  const _setSelectedFeatureAsEditNft = () => {
    const selectedFeature = select.getFeatures().getArray()[0];

    if (!selectedFeature) {
      return;
    }

    // TODO: Fix this. The created feature lacks the id and properties until full refresh
    const nftId = selectedFeature.getId() as number;
    if (!nftId && nftId !== 0) {
      throw new Error("NFT ID is not defined");
    }

    const editNft = nfts.find((nft) => nft.id === nftId);

    if (!editNft) {
      throw new Error("NFT not found");
    }

    store.setEditNft(editNft);
  };

  const _deleteClickedFeature = (map: MapOL, e: MapBrowserEvent<any>) => {
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

  const _showFeatureInfo = (map: MapOL, e: MapBrowserEvent<any>) => {
    if (!map) return;

    const foundFeatures: FeatureLike[] = [];

    map.forEachFeatureAtPixel(e.pixel, (feature) => {
      foundFeatures.push(feature);
    });

    // Hide popup
    if (foundFeatures.length === 0) {
      popup?.setPosition(undefined);
      return;
    }

    foundFeatures.forEach((feature) => {
      const nftId = feature.getId() as number;
      const nft = nfts.find((nft) => nft.id === nftId);

      if (!nft || !popup) {
        return;
      }

      const { name, description, image } = nft.metadata;
      const featureExtent = feature.getGeometry()?.getExtent();

      if (!featureExtent) return;

      const featureCentroid = getCenter(featureExtent);
      popup.setPosition(featureCentroid);
      const element = popup.getElement();
      if (!element) return;

      const popupName = element.querySelector("#popup-name");
      const popupDescription = element.querySelector("#popup-description");
      const popupImage = element.querySelector("#popup-image");

      const imgSrc = image ? `https://ipfs.io/ipfs/${image}` : notFoundImage;

      if (!popupName || !popupDescription) return;
      popupName.innerHTML = name;
      popupDescription.innerHTML = description;
      popupImage?.setAttribute("src", imgSrc);
    });
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
    store.setEditMode("IDLE");
    setSelectedFeature(undefined);
  };

  return (
    <Box position="relative">
      <Alert
        open={confirmTransactionAlert}
        onClose={() => setConfirmTransactionAlert(false)}
        severity="info"
      >
        Confirm transaction in your wallet
      </Alert>
      <Box id="map" width="100%" height={`calc(100vh - ${HEADER_HEIGHT}px)`}>
        <Box id="overlay" className={popupStyles.container}>
          <img
            id="popup-image"
            src=""
            alt=""
            style={{
              maxWidth: "200px",
              objectFit: "cover",
              borderRadius: "8px 8px 0 0",
            }}
          />
          <Box className={popupStyles.body}>
            <Typography id="popup-name" fontSize={16} paddingX={1}></Typography>
            <Typography id="popup-description" fontSize={13}></Typography>
          </Box>
        </Box>
      </Box>
      <Box
        id="panel"
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
        geojson={geojson}
        onAccept={_onFormSubmit}
        closeForm={() => setFormIsOpen(false)}
      />
    </Box>
  );
});

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
  const polygonFeatures = polygonCoordinatesArray.map((polygonCoordinates) => {
    return new Feature({
      geometry: new Polygon(polygonCoordinates),
    });
  });

  return polygonFeatures;
};
