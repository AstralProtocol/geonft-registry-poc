import React, { useState, useEffect } from "react";
import { Button, Box, Tooltip } from "@mui/material";
import Map from "ol/Map";
import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import MultiPolygon from "ol/geom/MultiPolygon";
import GeoJSON from "ol/format/GeoJSON";
import { useAppSelector } from "../../app/hooks";
import { initMap, draw } from "./OpenLayersComponents";
import { selectNFTs } from "../nfts/nftsSlice";
import AddNFTForm from "../../features/nfts/AddNFTForm";

function MapWrapper() {
  const { nfts } = useAppSelector(selectNFTs);

  const [map, setMap] = useState<Map>();
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [geojson, setGeojson] = useState("");

  const toggleDraw = () => {
    draw.setActive(!drawEnabled);
    setDrawEnabled(!drawEnabled);
  };

  const openGeoNFTForm = () => {
    const editLayer = getEditLayer();

    if (!editLayer) {
      throw new Error("Edit layer does not exists");
    }

    const layerSource = editLayer.getSource() as VectorSource<MultiPolygon>;
    const features = layerSource.getFeatures();
    const geojson = new GeoJSON().writeFeatures(features);

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
    initMap.addInteraction(draw);

    setDrawEnabled(draw.getActive());
    setMap(initMap);
  }, []);

  useEffect(() => {
    console.log("NFTS USE EFFECT: ", nfts);
    if (!nfts) return;

    const editLayer = getEditLayer();

    if (!editLayer) {
      return;
    }

    nfts.forEach((nft) => {
      console.log("EACH NFT: ", nft);
      const geojson = JSON.parse(nft.geojson);
      const geojsonFeatures = new GeoJSON().readFeatures(
        geojson
      ) as Feature<MultiPolygon>[];
      console.log("geojson: ", geojson);
      editLayer.getSource()?.addFeatures(geojsonFeatures);
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
        <Button variant="contained" onClick={openGeoNFTForm}>
          <Tooltip title="Add NFT" placement="top">
            <i className="material-icons">add</i>
          </Tooltip>
          Add GeoNFT
        </Button>
        <AddNFTForm
          open={formIsOpen}
          geojson={geojson}
          closeForm={() => setFormIsOpen(false)}
        />
      </Box>
    </div>
  );
}

export default MapWrapper;
