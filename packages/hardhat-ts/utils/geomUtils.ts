import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import turfCentroid from "@turf/centroid";
import {
  Feature,
  Geometry,
  Polygon,
  MultiPolygon,
  GeoJsonProperties,
  GeoJsonObject,
  Position,
  FeatureCollection,
} from "geojson";

// Solidity version of GeoJSON types
// Uses BigNumber (integer) as coordinates to avoid decimals
type PositionSol = [BigNumber, BigNumber]; // Coordinates point -> [X, Y]

interface PointSol extends GeoJsonObject {
  type: "Point";
  coordinates: PositionSol;
}

interface MultiPointSol extends GeoJsonObject {
  type: "MultiPoint";
  coordinates: PositionSol[];
}

interface LineStringSol extends GeoJsonObject {
  type: "LineString";
  coordinates: PositionSol[];
}

interface MultiLineStringSol extends GeoJsonObject {
  type: "MultiLineString";
  coordinates: PositionSol[][];
}

interface PolygonSol extends GeoJsonObject {
  type: "Polygon";
  coordinates: PositionSol[][];
}

interface MultiPolygonSol extends GeoJsonObject {
  type: "MultiPolygon";
  coordinates: PositionSol[][][];
}

type GeometrySol =
  | PointSol
  | MultiPointSol
  | LineStringSol
  | MultiLineStringSol
  | PolygonSol
  | MultiPolygonSol;

interface FeatureSol<
  G extends GeometrySol | null = GeometrySol,
  P = GeoJsonProperties
> extends GeoJsonObject {
  type: "Feature";
  geometry: G;
  properties: P;
}

interface FeatureCollectionSol<
  G extends GeometrySol | null = GeometrySol,
  P = GeoJsonProperties
> extends GeoJsonObject {
  type: "FeatureCollection";
  features: Array<FeatureSol<G, P>>;
}

export type GeoJSONSol = FeatureCollectionSol;

/**
 * Checks whether the geometry is of type polygon
 * @param geometry Geometry object, both standard or solidity format
 * @returns true if geometry is Polygon or MultiPolygon type
 */
export const isPolygonType = (geometry: Geometry | GeometrySol): boolean => {
  const geomType = geometry.type;
  return geomType === "Polygon" || geomType === "MultiPolygon";
};

/**
 * Transform a GeoJSON to a Solidity compatible version by transforming its coordinates.
 * Coordinate values are multiplied by a certain factor to remove decimals without loosing
 * too much precision
 * @param geojson GeoJSON Feature Collection in standard format
 * @returns GeoJSON Feature Collection in a Solidity version (with Big Integer coordinates)
 */
export const transformSolidityGeoJSON = (
  geojson: FeatureCollection
): GeoJSONSol => {
  if (geojson.type !== "FeatureCollection") {
    throw new Error(`
      Invalid GeoJSON type '${geojson.type}'. Value must be 'FeatureCollection'.
    `);
  }

  return {
    ...geojson,
    features: transformFeatures(geojson.features),
  };
};

/**
 * Intermediate step to transform features to Solidity version
 * @param features GeoJSON features in standard format
 * @returns GeoJSON features in a Solidity compatible version
 */
const transformFeatures = (features: Feature[]): FeatureSol[] => {
  return features.map((feature) => {
    if (feature.geometry.type === "GeometryCollection") {
      throw new Error(`
        Invalid geometry type: ${feature.geometry.type}. 
        Value must be 'Point', 'MultiPoint', 'LineString', 
        'MultiLineString', 'Polygon' or 'MultiPolygon'.
      `);
    }

    return {
      ...feature,
      geometry: transformGeometry(feature.geometry),
    };
  });
};

// Typescript overload function to handle multiple Geometry types returns
type TransformGeometryOverload = {
  (geometry: Geometry): PointSol;
  (geometry: Geometry): MultiPointSol;
  (geometry: Geometry): LineStringSol;
  (geometry: Geometry): MultiLineStringSol;
  (geometry: Geometry): PolygonSol;
  (geometry: Geometry): MultiPolygonSol;
};

/**
 * Intermediate step to transform a feature geometry to Solidity version
 * @param geometry Feature geometry object in standard version
 * @returns Feature geometry object in a Solidity compatible version
 */
const transformGeometry: TransformGeometryOverload = (
  geometry: Geometry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  if (geometry.type === "GeometryCollection") {
    throw new Error(`
      Invalid geometry type: ${geometry.type}. 
      Value must be 'Point', 'MultiPoint', 'LineString', 
      'MultiLineString', 'Polygon' or 'MultiPolygon'.
    `);
  }

  return {
    ...geometry,
    coordinates: transformCoordinatesRecursively(geometry.coordinates),
  };
};

// loop through all the nested arrays of the coordinates and, when find a coordinate,
// returns the value as BigNumber to remove decimals up to 9 digits.
type RCoordinates = number | BigNumber | RCoordinates[]; // Recursive coordinates type
/**
 * Transforms a geometry coordinates to a Solidity compatible version by changing its value.
 * Recursion is necessary because geometry coordinates can have different levels of nested arrays
 * based on its geometry type
 *    Point                    => 1 level
 *    MultiPoint, LineString   => 2 levels
 *    MultiLineString, Polygon => 3 levels
 *    MultiPolygon             => 4 levels
 * The function iterates recursively over its children until it finds a coordinate value (number)
 * instead of an array.Then, returns the transformed coordinate value.
 * @param value Geometry coordinates with different possible nested arrays according to its type
 * @returns Transformed geomtry coordinates with different posible nested arrays according to its type
 */
const transformCoordinatesRecursively = (value: RCoordinates): RCoordinates => {
  return Array.isArray(value)
    ? value.map(transformCoordinatesRecursively)
    : solidityCoordinate(value as number);
};

/**
 * Transform a coordinate value to a Solidity compatible version by removing decimals.
 * The value is multiplied by a factor of 10^9 to preserve precision. This value should
 * by divided by the same exponential factor to translate it back to a standard degrees format.
 * @param coord Coordinate value in standard degrees format
 * @returns Coordinate value is Solidity version: an integer Big Number
 */
export const solidityCoordinate = (coord: number): BigNumber => {
  const DECIMAL_EXPONENT = 10 ** 9;
  return ethers.BigNumber.from(Math.floor(coord * DECIMAL_EXPONENT));
};

export const solidityPoint = (point: Position): PositionSol => {
  return [solidityCoordinate(point[0]), solidityCoordinate(point[1])];
};

export const solidityCoordinatesPolygon = (
  coordinates: Position[][]
): [BigNumber, BigNumber][][] => {
  return coordinates.map((ring) => ring.map(solidityPoint));
};

/**
 * Calculate the centroid of a geometry, whether it's Polygon or MultiPolygon type
 * @param geometry Geometry object of the polygon
 * @returns Array of coordinates (lat, lon) of the polygon centroid
 */
export const centroid = (geometry: Polygon | MultiPolygon): Position => {
  const feature = turfCentroid(geometry);
  // Turf returns centroid as (X, Y) position (lon, lat), but the
  // function returns them as (lat, lon) to match GeoJSON coordinates order
  const [lon, lat] = feature.geometry.coordinates;
  return [lat, lon];
};
