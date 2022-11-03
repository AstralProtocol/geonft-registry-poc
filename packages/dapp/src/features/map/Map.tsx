import React, { useState, useEffect } from "react";
import { Button, Box, Tooltip } from "@mui/material";
import Map from "ol/Map";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import MultiPolygon from "ol/geom/MultiPolygon";
import GeoJSON from "ol/format/GeoJSON";
import { useAppSelector } from "../../app/hooks";
import { initMap, draw, select, geoNftsLayer } from "./OpenLayersComponents";
import { selectNFTs } from "../nfts/nftsSlice";
import AddNFTForm, { Metadata } from "../../features/nfts/AddNFTForm";

function MapWrapper() {
  const { nfts } = useAppSelector(selectNFTs);

  console.log("MAP NFTS: ", nfts);

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

    if (!editLayer) {
      throw new Error("Edit layer does not exists");
    }

    const layerSource = editLayer.getSource() as VectorSource<MultiPolygon>;
    const features = layerSource.getFeatures();
    const geojson = new GeoJSON().writeFeatures(features);

    setMetadata(undefined);
    setGeojson(geojson);
    setFormIsOpen(true);
  };

  const editGeoNFT = () => {
    const selectedFeature = select.getFeatures().getArray()[0];

    if (!selectedFeature) {
      return;
    }

    const metadata = selectedFeature.getProperties() as Metadata;
    const geojson = new GeoJSON().writeFeature(selectedFeature);

    console.log("METADATA CON SELECT: ", metadata);
    setMetadata(metadata);
    setGeojson(geojson);
    setFormIsOpen(true);
  };

  const getEditLayer = ():
    | VectorLayer<VectorSource<MultiPolygon>>
    | undefined => {
    if (!map) {
      // throw new Error("Map is not initialized");
      console.error("Map is not initialized");
      return;
    }

    const layer = map
      .getLayers()
      .getArray()
      .find((layer) => {
        return layer.getProperties().id === "edit-layer";
      }) as unknown as VectorLayer<VectorSource<MultiPolygon>>;

    return layer;
  };

  useEffect(() => {
    initMap.setTarget("map");

    setDrawEnabled(false);
    setMap(initMap);
  }, []);

  useEffect(() => {
    if (!nfts) return;

    nfts.forEach((nft) => {
      const { name, description, image, geojson } = nft.metadata;
      const geojsonFeatures = new GeoJSON().readFeatures(
        JSON.parse(geojson)
      ) as Feature<MultiPolygon>[];

      geojsonFeatures[0].setProperties({
        name,
        description,
        image,
      });
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
}

export default MapWrapper;
