import React, { useState, useEffect } from "react";
import { Button, Box, Tooltip } from "@mui/material";
import Map from "ol/Map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import MultiPolygon from "ol/geom/MultiPolygon";
import GeoJSON from "ol/format/GeoJSON";
import { initMap, draw } from "./OpenLayersComponents";
import AddNFTForm from "../../features/nfts/AddNFTForm";

function MapWrapper() {
  const [map, setMap] = useState<Map>();
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [formIsOpen, setFormIsOpen] = useState(false);
  const [geojson, setGeojson] = useState("");

  const toggleDraw = () => {
    draw.setActive(!drawEnabled);
    setDrawEnabled(!drawEnabled);
  };

  const getEditLayer = ():
    | VectorLayer<VectorSource<MultiPolygon>>
    | undefined => {
    if (!map) {
      throw new Error("Map is not initialized");
    }

    const layer = map
      .getLayers()
      .getArray()
      .find((layer) => {
        return layer.getProperties().id === "edit-layer";
      }) as unknown as VectorLayer<VectorSource<MultiPolygon>>;

    return layer;
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

  useEffect(() => {
    initMap.setTarget("map");
    initMap.addInteraction(draw);

    setDrawEnabled(draw.getActive());
    setMap(initMap);
  }, []);

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
