import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import chai from "chai";
import { AreaCalculation } from "../typechain";
import {
  transformSolidityGeoJSON,
  solidityCoordinate,
  isPolygonType,
} from "../utils/geomUtils";
import {
  GEOJSON2,
  GEOJSON2_CLOCKWISE,
  GEOJSON3_MULTIPOLYGON,
  GEOJSON3_POLYGON,
} from "./mockData";

const { expect } = chai;

let areaCalculation: AreaCalculation;

describe("registry", () => {
  beforeEach(async () => {
    const trigonometryFactory = await ethers.getContractFactory("Trigonometry");
    const trigonometry = await trigonometryFactory.deploy();

    const areaFactory = await ethers.getContractFactory("AreaCalculation", {
      libraries: {
        Trigonometry: trigonometry.address,
      },
    });
    areaCalculation = (await areaFactory.deploy()) as AreaCalculation;
  });

  describe("calculate area", async () => {
    it("test isPolygon true", async () => {
      const polygon = [
        [-68.890674, 12.147418],
        [-68.890746, 12.147347],
        [-68.890721, 12.147236],
        [-68.890593, 12.147198],
        [-68.890518, 12.14728],
        [-68.890551, 12.147379],
        [-68.890674, 12.147418],
      ];

      const polygonInt: [BigNumber, BigNumber][] = polygon.map((x) => [
        solidityCoordinate(x[0]),
        solidityCoordinate(x[1]),
      ]);
      const isPolygon = await areaCalculation.isPolygon(polygonInt);
      expect(isPolygon).to.equal(true);
    });

    it("test isPolygon false", async () => {
      const polygon = [
        [-68.890674, 12.147418],
        [-68.890746, 12.147347],
        [-68.890721, 12.147236],
        [-68.890593, 12.147198],
        [-68.890518, 12.14728],
        [-68.890551, 12.147379],
        [-68.890674, 12.147417], // should match first point
      ];

      const polygonInt: [BigNumber, BigNumber][] = polygon.map((x) => [
        solidityCoordinate(x[0]),
        solidityCoordinate(x[1]),
      ]);
      const isPolygon = await areaCalculation.isPolygon(polygonInt);
      expect(isPolygon).to.equal(false);
    });

    it("elliptical area of polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      const feature = geojsonSol.features[0]; // Curazao

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const area =
        feature.geometry.type === "Polygon"
          ? await areaCalculation.polygonArea(
              coordinates as [BigNumber, BigNumber][][]
            )
          : await areaCalculation.multiPolygonArea(
              coordinates as [BigNumber, BigNumber][][][]
            );

      expect(area).to.equal(451167820); // In square meters (m2)
    });

    it("elliptical area of small polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      const feature = geojsonSol.features[7];

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const area =
        feature.geometry.type === "Polygon"
          ? await areaCalculation.polygonArea(
              coordinates as [BigNumber, BigNumber][][]
            )
          : await areaCalculation.multiPolygonArea(
              coordinates as [BigNumber, BigNumber][][][]
            );

      expect(area).to.equal(27172); // In square meters (m2)
    });

    it("elliptical area of small food forest", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON2);

      const feature = geojsonSol.features[0];

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const area =
        feature.geometry.type === "Polygon"
          ? await areaCalculation.polygonArea(
              coordinates as [BigNumber, BigNumber][][]
            )
          : await areaCalculation.multiPolygonArea(
              coordinates as [BigNumber, BigNumber][][][]
            );

      expect(area).to.equal(417); // In square meters (m2)
    });

    it("elliptical area of multipart polygon", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      const feature = geojsonSol.features[5]; // Splitted geometry

      if (!isPolygonType(feature.geometry)) {
        throw new Error(`
          Geometry type '${feature.geometry.type}' invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinates = feature.geometry.coordinates;
      const area =
        feature.geometry.type === "Polygon"
          ? await areaCalculation.polygonArea(
              coordinates as [BigNumber, BigNumber][][]
            )
          : await areaCalculation.multiPolygonArea(
              coordinates as [BigNumber, BigNumber][][][]
            );

      expect(area).to.equal(5376806769293); // In square meters (m2)
    });

    it("area is equal on polygon and multipolygon format", async () => {
      const geojsonSolSinglePolygon =
        transformSolidityGeoJSON(GEOJSON3_POLYGON);
      const geojsonSolMultipolygon = transformSolidityGeoJSON(
        GEOJSON3_MULTIPOLYGON
      );

      const featureIndex = 0;
      const featureSingle = geojsonSolSinglePolygon.features[featureIndex];
      const featureMulti = geojsonSolMultipolygon.features[featureIndex];

      if (
        !isPolygonType(featureSingle.geometry) ||
        !isPolygonType(featureMulti.geometry)
      ) {
        throw new Error(`
          Geometry type invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinatesSingle = featureSingle.geometry.coordinates;
      const coordinatesMulti = featureMulti.geometry.coordinates;

      const areas = await Promise.all([
        areaCalculation.polygonArea(
          coordinatesSingle as [BigNumber, BigNumber][][]
        ),
        areaCalculation.multiPolygonArea(
          coordinatesMulti as [BigNumber, BigNumber][][][]
        ),
      ]);

      const [areaSingle, areaMulti] = areas;
      expect(areaSingle).to.equal(areaMulti).to.equal(451167820); // In square meters (m2)
    });

    it("area is equal on clockwise and counter-clockwise direction", async () => {
      // CCW -> Counter clockwise (default)
      // CW  -> Clockwise
      const geojsonSolCCW = transformSolidityGeoJSON(GEOJSON2);
      const geojsonSolCW = transformSolidityGeoJSON(GEOJSON2_CLOCKWISE);

      const featureIndex = 0;
      const featureCCW = geojsonSolCCW.features[featureIndex];
      const featureCW = geojsonSolCW.features[featureIndex];

      if (
        !isPolygonType(featureCCW.geometry) ||
        !isPolygonType(featureCW.geometry)
      ) {
        throw new Error(`
          Geometry type invalid.
          Value must be 'Polygon' or 'MultiPolygon'.
        `);
      }

      const coordinatesCCW = featureCCW.geometry.coordinates;
      const coordinatesCW = featureCW.geometry.coordinates;

      const areaCCWPromise =
        featureCCW.geometry.type === "Polygon"
          ? areaCalculation.polygonArea(
              coordinatesCCW as [BigNumber, BigNumber][][]
            )
          : areaCalculation.multiPolygonArea(
              coordinatesCCW as [BigNumber, BigNumber][][][]
            );

      const areaCWPromise =
        featureCW.geometry.type === "Polygon"
          ? areaCalculation.polygonArea(
              coordinatesCW as [BigNumber, BigNumber][][]
            )
          : areaCalculation.multiPolygonArea(
              coordinatesCW as [BigNumber, BigNumber][][][]
            );

      const areas = await Promise.all([areaCCWPromise, areaCWPromise]);
      const [areaCCW, areaCW] = areas;

      expect(areaCCW).to.equal(areaCW).to.equal(417); // In square meters (m2)
    });

    it("elliptical area sum of GeoJSON", async () => {
      // Solidity version of GeoJSON with integer coordinates
      const geojsonSol = transformSolidityGeoJSON(GEOJSON3_MULTIPOLYGON);

      // Array with the area of every feature
      const featureAreas = await Promise.all(
        geojsonSol.features.map((feature) => {
          if (!isPolygonType(feature.geometry)) {
            throw new Error(`
            Geometry type '${feature.geometry.type}' invalid.
            Value must be 'Polygon' or 'MultiPolygon'.
          `);
          }

          const coordinates = feature.geometry.coordinates;
          return feature.geometry.type === "Polygon"
            ? areaCalculation.polygonArea(
                coordinates as [BigNumber, BigNumber][][]
              )
            : areaCalculation.multiPolygonArea(
                coordinates as [BigNumber, BigNumber][][][]
              );
        })
      );

      // Sum the area of all the features
      const totalArea = featureAreas.reduce((a, b) => a + b.toNumber(), 0);
      expect(totalArea).to.equal(10276251371240); // In square meters (m2)
    });
  });
});
