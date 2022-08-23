import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import chai from "chai";
import { GeohashUtils } from "../typechain";
import { solidityCoordinate, centroid } from "../utils/geomUtils";
import { GEOJSON2 } from "./mockData";

const { expect } = chai;

let geohashUtils: GeohashUtils;

describe("geohashing", () => {
  beforeEach(async () => {
    const geohashUtilsFactory = await ethers.getContractFactory("GeohashUtils");
    geohashUtils = (await geohashUtilsFactory.deploy()) as GeohashUtils;
  });

  describe("geohash encoding", async () => {
    // Reference: https://www.movable-type.co.uk/scripts/geohash.html
    it("Encodes Curazao's coordinates with precision from 1 to 9", async () => {
      const expectedGeohash = "d6nvms58e"; // Precision 9
      const lat = 12.194946;
      const lon = -69.011151;
      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version

      // Array of promises with the geohash returned from the encode() function.
      // Each geohash is calculated using the same coordinates pair but with
      // a different precision, withing a range from 1 to 9
      const geohashEncodingPromises: Array<Promise<string>> = Array.from({
        length: 9,
      }).map((_, i: number) => {
        const precision = i + 1;
        return geohashUtils.encode(latSol, lonSol, precision);
      });
      const geohashes = await Promise.all(geohashEncodingPromises);

      geohashes.forEach((geohash, i) => {
        // Calculate expected geohash for certain precision i by slicing the
        // full expectedGeohash. So, the expected geohash for precision 4
        // would be: "d6nv" (length = 4)
        const expectedGeohashForPrecisionI = expectedGeohash.slice(0, i + 1);
        expect(geohash).to.equal(expectedGeohashForPrecisionI);
      });
    });

    it("Encodes Curazao's inverted coordinates with precision from 1 to 9", async () => {
      const expectedGeohash = "mtc4d7urk"; // Precision 9
      const lat = -12.194946;
      const lon = 69.011151;
      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version

      // Array of promises with the geohash returned from the encode() function.
      // Each geohash is calculated using the same coordinates pair but with
      // a different precision, withing a range from 1 to 9
      const geohashEncodingPromises: Array<Promise<string>> = Array.from({
        length: 9,
      }).map((_, i: number) => {
        const precision = i + 1;
        return geohashUtils.encode(latSol, lonSol, precision);
      });
      const geohashes = await Promise.all(geohashEncodingPromises);

      geohashes.forEach((geohash, i) => {
        // Calculate expected geohash for certain precision i by slicing the
        // full expectedGeohash. So, the expected geohash for precision 4
        // would be: "d6nv" (length = 4)
        const expectedGeohashForPrecisionI = expectedGeohash.slice(0, i + 1);
        expect(geohash).to.equal(expectedGeohashForPrecisionI);
      });
    });

    it("Encodes GeoJSON 2 polygon with precision 8", async () => {
      const geometry = GEOJSON2.features[0].geometry;
      const [lat, lon] = centroid(geometry);
      const precision = 8;
      const latSol = solidityCoordinate(lat); // Solidity latitude version
      const lonSol = solidityCoordinate(lon); // Solidity longitude version

      const geohash = await geohashUtils.encode(latSol, lonSol, precision);

      expect(geohash).to.equal("d6pj0777");
    });
  });

  describe("geohash decoding", async () => {
    it("decodes geohash with precision 8", async () => {
      const geohash = "d6nvms58";
      // Solidity coordinates version with a little error deviation
      const coordinatesExpected = [12194910048, -69011135100];

      const coordinatesBigNumber = await geohashUtils.decode(geohash);
      // Transform from BigNumber hex value to number
      const coordinates = coordinatesBigNumber.map((coord: BigNumber) =>
        coord.toNumber()
      );

      expect(coordinates).deep.equal(coordinatesExpected);
    });
  });
});
