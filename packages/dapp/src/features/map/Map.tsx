import { useState, useEffect } from "react";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Button, Box, Tooltip } from "@mui/material";
import Map from "ol/Map";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Polygon, MultiPolygon } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import { initMap, draw, select, geoNftsLayer } from "./OpenLayersComponents";
import AddNFTForm, { Metadata } from "../../features/nfts/AddNFTForm";
import { nftsStore } from "../../features/nfts/nftsStore";

const MapWrapper = observer(() => {
  const { nfts } = nftsStore;

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

  // const onSubmit = () => {
  //   const editLayer = getEditLayer();
  //   const editLayerFeatures = editLayer.getSource()?.getFeatures();

  //   if (!editLayerFeatures) {
  //     return;
  //   }

  //   const layerSource = editLayer.getSource() as VectorSource<MultiPolygon>;
  //   const features = layerSource.getFeatures();
  //   const geojson = new GeoJSON().writeFeatures(features);

  //   console.log("METADATA: ", metadata);
  //   console.log("GEOJSON: ", geojson);

  //   setFormIsOpen(false);
  // };

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
      <Box id="map" width="100%" height="400px"></Box>
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

export default MapWrapper;
