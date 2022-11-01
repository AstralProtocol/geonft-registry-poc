import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import { Draw } from "ol/interaction";
import { Fill, Stroke, Style } from "ol/style";
import { MultiPolygon } from "ol/geom";
import { fromLonLat } from "ol/proj";

// Setup layers
const cartographicBasemap = new TileLayer({
  source: new OSM(),
});

const editLayerSource = new VectorSource<MultiPolygon>();
export const editLayer = new VectorLayer({
  properties: {
    id: "edit-layer",
  },
  source: editLayerSource,
  style: new Style({
    fill: new Fill({
      color: [0, 153, 255, 0.3],
    }),
    stroke: new Stroke({
      color: [4, 65, 106],
      width: 2,
    }),
  }),
});

// Setup interactions
export const draw = new Draw({
  source: editLayerSource,
  type: "MultiPolygon",
  trace: true,
  stopClick: true,
});

draw.setActive(false);

// Setup map
export const initMap = new Map({
  target: undefined,
  layers: [cartographicBasemap, editLayer],
  view: new View({
    projection: "EPSG:3857",
    center: fromLonLat([-4.13, 39.48]),
    zoom: 6,
  }),
  controls: [],
});
