import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM from "ol/source/OSM";
import {
  Select,
  Draw,
  Modify,
  defaults as defaultInteractions,
} from "ol/interaction";
import Overlay from "ol/Overlay";
import { Fill, Stroke, Style, Circle as CircleStyle } from "ol/style";
import { Polygon, MultiPolygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { singleClick } from "ol/events/condition";

// Setup layers
export const cartographicBasemap = new TileLayer({
  source: new OSM(),
});

export const geoNftsLayer = new VectorLayer({
  properties: {
    id: "geoNfts-layer",
  },
  source: new VectorSource<MultiPolygon>(),
  style: new Style({
    fill: new Fill({
      color: [10, 201, 23, 0.3],
    }),
    stroke: new Stroke({
      color: [5, 107, 12],
      width: 2,
    }),
  }),
});

const editLayerSource = new VectorSource<Polygon>();
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
export const select = new Select({
  style: new Style({
    fill: new Fill({
      color: "rgba(230, 242, 5, 0.7)",
    }),
    stroke: new Stroke({
      color: "#34e1eb",
      width: 2,
    }),
  }),
  layers: [geoNftsLayer],
});

export const draw = new Draw({
  source: editLayerSource,
  type: "Polygon",
  trace: true,
  stopClick: true,
});

draw.setActive(false);

const modifyStyleWidth = 3;
export const modify = new Modify({
  source: editLayerSource,
  style: new Style({
    image: new CircleStyle({
      radius: modifyStyleWidth * 2,
      fill: new Fill({
        color: "orange",
      }),
      stroke: new Stroke({
        color: "white",
        width: modifyStyleWidth / 2,
      }),
    }),
  }),
  deleteCondition: (event) => {
    return singleClick(event) && event.originalEvent.ctrlKey;
  },
});

modify.setActive(false);

// Setup map
export const initMap = new Map({
  target: undefined,
  layers: [cartographicBasemap, geoNftsLayer, editLayer],
  view: new View({
    projection: "EPSG:3857",
    center: fromLonLat([-4.13, 39.48]),
    zoom: 6,
  }),
  interactions: defaultInteractions().extend([select, draw, modify]),
  controls: [],
});
