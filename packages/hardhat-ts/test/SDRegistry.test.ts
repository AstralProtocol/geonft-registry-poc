import { ethers } from "hardhat";
import { BigNumber, ContractReceipt, ContractTransaction } from "ethers";
import chai from "chai";
import { GeoNFT, SDRegistry, AreaCalculation } from "../typechain";
import {
  centroid,
  solidityPoint,
  solidityCoordinate,
  solidityCoordinatesPolygon,
} from "../utils/geomUtils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import {
  GEOJSON1,
  GEOJSON3_POLYGON,
  GEOJSON_INVALID_POLYGON1,
  GEOJSON_INVALID_POLYGON2,
} from "./mockData";

const { expect } = chai;

let sdRegistry: SDRegistry;
let geoNFT: GeoNFT;
let areaCalculation: AreaCalculation;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const CENTROID = solidityPoint([12.147418, -68.890674]);
const mockGeoNFTCoordinates: number[][] =
  GEOJSON3_POLYGON.features[0].geometry.coordinates[0]; // Curazao coordinates
const COORDINATES: [BigNumber, BigNumber][][] = [
  mockGeoNFTCoordinates.map(solidityPoint),
];

describe("registry", () => {
  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();

    // Libraries
    const trigonometryFactory = await ethers.getContractFactory("Trigonometry");
    const trigonometry = await trigonometryFactory.deploy();

    const geohashUtilsFactory = await ethers.getContractFactory("GeohashUtils");
    const geohashUtils = await geohashUtilsFactory.deploy();

    const areaFactory = await ethers.getContractFactory("AreaCalculation", {
      libraries: {
        Trigonometry: trigonometry.address,
      },
    });
    areaCalculation = (await areaFactory.deploy()) as AreaCalculation;

    // Contracts
    const geoNFTFactory = await ethers.getContractFactory("GeoNFT");
    geoNFT = (await geoNFTFactory.deploy()) as GeoNFT;

    const sdRegistryFactory = await ethers.getContractFactory("SDRegistry", {
      libraries: {
        AreaCalculation: areaCalculation.address,
        GeohashUtils: geohashUtils.address,
      },
    });
    sdRegistry = (await sdRegistryFactory.deploy(geoNFT.address)) as SDRegistry;
  });

  describe("deployment", async () => {
    it("deployer is owner", async () => {
      expect(await geoNFT.owner()).to.equal(deployer.address);
      expect(await sdRegistry.owner()).to.equal(deployer.address);
    });
  });

  describe("register geonft", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then updates area", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const newArea = 451167820;

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get calculated area from spatial data registry
      const calculatedArea = await areaCalculation.polygonArea(COORDINATES);
      expect(calculatedArea).to.equal(newArea);

      // set area on minted GeoNFT
      await geoNFT.setEcologicalIndex(tokenId, "area_m2", calculatedArea);

      // verify area on minted GeoNFT
      expect((await geoNFT.getEcologicalIndex(tokenId)).indexValue).to.equal(
        calculatedArea
      );
    });

    it("contract owner mints a GeoNFT with wrong geometry (start/end points not the same)", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const coordinates = solidityCoordinatesPolygon(
        GEOJSON_INVALID_POLYGON1.features[0].geometry.coordinates
      );

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, coordinates.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get calculated area from spatial data registry
      await expect(areaCalculation.polygonArea(coordinates)).to.be.revertedWith(
        "The coordinates are invalid"
      );
    });

    it("contract owner mints a GeoNFT with wrong geometry (less than 3 points)", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const coordinates = solidityCoordinatesPolygon(
        GEOJSON_INVALID_POLYGON2.features[0].geometry.coordinates
      );

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, coordinates.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get calculated area from spatial data registry
      await expect(areaCalculation.polygonArea(coordinates)).to.be.revertedWith(
        "The coordinates are invalid"
      );
    });
  });

  describe("unregister geonft", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then removes from registry", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        CENTROID
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(1);

      // unregister minted GeoNFT with Spatial Data Registry
      const unregisterTX: ContractTransaction =
        await sdRegistry.unregisterGeoNFT(tokenId);
      const unregisterReceipt: ContractReceipt = await unregisterTX.wait();
      expect(unregisterReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokensAfterUnregister = await sdRegistry.getAllGeoNFTs();
      expect(tokensAfterUnregister.length).to.equal(0);
    });

    it("contract owner mints multiple GeoNFT, adds to registry, then removes from registry", async () => {
      const tokenId1 = ethers.BigNumber.from(0);
      const tokenId2 = ethers.BigNumber.from(1);
      const tokenId3 = ethers.BigNumber.from(2);
      const tokenURI = "0";

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId1);

      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId2);

      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId3);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX1: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId1,
        CENTROID
      );
      const registerTX2: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId2,
        CENTROID
      );
      const registerTX3: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId3,
        CENTROID
      );

      const registerReceipt1: ContractReceipt = await registerTX1.wait();
      expect(registerReceipt1.status).to.equal(1);
      const registerReceipt2: ContractReceipt = await registerTX2.wait();
      expect(registerReceipt2.status).to.equal(1);
      const registerReceipt3: ContractReceipt = await registerTX3.wait();
      expect(registerReceipt3.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(3);

      // unregister second minted GeoNFT with Spatial Data Registry
      const unregisterTX1: ContractTransaction =
        await sdRegistry.unregisterGeoNFT(tokenId2);
      const unregisterReceipt1: ContractReceipt = await unregisterTX1.wait();
      expect(unregisterReceipt1.status).to.equal(1);

      // get all tokens in the registry
      const tokensAfterUnregister1 = await sdRegistry.getAllGeoNFTs();
      expect(tokensAfterUnregister1.length).to.equal(2);

      // unregister another token
      const unregisterTX2: ContractTransaction =
        await sdRegistry.unregisterGeoNFT(tokenId3);
      const unregisterReceipt2: ContractReceipt = await unregisterTX2.wait();
      expect(unregisterReceipt2.status).to.equal(1);

      // get all tokens in the registry again
      const tokensAfterUnregister2 = await sdRegistry.getAllGeoNFTs();
      expect(tokensAfterUnregister2.length).to.equal(1);
    });
  });

  describe("update geonft topology", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then updates the topology", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const newFeature = GEOJSON3_POLYGON.features[7];
      const newCentroid = solidityPoint(centroid(newFeature.geometry));
      const newCoordinates = solidityCoordinatesPolygon(
        newFeature.geometry.coordinates
      );
      const newStringifiedGeoJSON = newCoordinates.toString();
      const newArea = 27172;

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(deployer.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, deployer.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      await sdRegistry.registerGeoNFT(tokenId, CENTROID);
      // update geoJson on minted GeoNFT
      await geoNFT.setGeoJson(tokenId, GEOJSON3_POLYGON.toString());

      const updateTopologyTX: ContractTransaction =
        await sdRegistry.updateGeoNFTTopology(
          tokenId,
          newCoordinates,
          newCentroid,
          newStringifiedGeoJSON
        );

      await updateTopologyTX.wait();

      // get calculated area from AreaCalculation
      const calculatedArea = await areaCalculation.polygonArea(newCoordinates);
      // update area on minted GeoNFT
      await geoNFT.setEcologicalIndex(tokenId, "area_m2", calculatedArea);
      expect(calculatedArea).to.equal(newArea);

      // verify area on minted GeoNFT
      expect((await geoNFT.getEcologicalIndex(tokenId)).indexValue).to.equal(
        calculatedArea
      );

      // TODO: verify stringified geojson is updated
    });
  });

  describe("query geonfts by lat/lng", async () => {
    it("contract owner mints a GeoNFT, adds to registry, then queries for it with lat/lng", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const latitude = 12.147418397;
      const longitude = -68.890674412;
      const centroid: [BigNumber, BigNumber] = [
        solidityCoordinate(latitude),
        solidityCoordinate(longitude),
      ];
      const precision = 8;

      // mint GeoNFT
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId,
        centroid
      );
      const registerReceipt: ContractReceipt = await registerTX.wait();
      expect(registerReceipt.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(1);

      // query for minted GeoNFT with lat/lng
      const tokensQuery = await sdRegistry.queryGeoNFTsByLatLng(
        solidityCoordinate(latitude),
        solidityCoordinate(longitude),
        precision
      );
      expect(tokensQuery.length).to.equal(1);
    });
    it("contract owner mints multiple GeoNFTs, adds them to registry, then queries for them with lat/lng at different precision levels", async () => {
      // At level 8, all three GeoNFTs are in different geohash areas
      // At level 7, GeoNFTs 1 and 2 are in the same geohash area, but GeoNFT 3 is not
      // At level 6, all of them are in the same geohash area: d6pj07

      const latitude = 12.147418397;
      const longitude = -68.890674412;

      // GeoNFT 1
      const tokenId1 = ethers.BigNumber.from(0);
      const centroid1: [BigNumber, BigNumber] = [
        solidityCoordinate(latitude),
        solidityCoordinate(longitude),
      ];
      // GeoNFT 2
      const tokenId2 = ethers.BigNumber.from(1);
      const centroid2: [BigNumber, BigNumber] = [
        solidityCoordinate(12.147315),
        solidityCoordinate(-68.890126),
      ];
      // GeoNFT 3
      const tokenId3 = ethers.BigNumber.from(2);
      const centroid3: [BigNumber, BigNumber] = [
        solidityCoordinate(12.147477),
        solidityCoordinate(-68.891608),
      ];

      const tokenURI = "0";
      const precision1 = 8;
      const precision2 = 7;
      const precision3 = 6;

      // mint GeoNFTs
      // GeoNFT 1 minting
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId1);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX1: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId1,
        centroid1
      );
      const registerReceipt1: ContractReceipt = await registerTX1.wait();
      expect(registerReceipt1.status).to.equal(1);

      // GeoNFT 2 minting
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId2);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX2: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId2,
        centroid2
      );
      const registerReceipt2: ContractReceipt = await registerTX2.wait();
      expect(registerReceipt2.status).to.equal(1);

      // GeoNFT 3 minting
      await expect(
        geoNFT.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geoNFT, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId3);

      // register minted GeoNFT with Spatial Data Registry
      const registerTX3: ContractTransaction = await sdRegistry.registerGeoNFT(
        tokenId3,
        centroid3
      );
      const registerReceipt3: ContractReceipt = await registerTX3.wait();
      expect(registerReceipt3.status).to.equal(1);

      // get all tokens in the registry
      const tokens = await sdRegistry.getAllGeoNFTs();
      expect(tokens.length).to.equal(3);

      // query for minted GeoNFT with lat/lng at precision 8
      const tokensQuery1 = await sdRegistry.queryGeoNFTsByLatLng(
        solidityCoordinate(latitude),
        solidityCoordinate(longitude),
        precision1
      );
      expect(tokensQuery1.length).to.equal(1);

      // query for minted GeoNFT with lat/lng at precision 8
      const tokensQuery2 = await sdRegistry.queryGeoNFTsByLatLng(
        solidityCoordinate(latitude),
        solidityCoordinate(longitude),
        precision2
      );
      expect(tokensQuery2.length).to.equal(2);

      // query for minted GeoNFT with lat/lng at precision 8
      const tokensQuery3 = await sdRegistry.queryGeoNFTsByLatLng(
        solidityCoordinate(latitude),
        solidityCoordinate(longitude),
        precision3
      );
      expect(tokensQuery3.length).to.equal(3);
    });
  });

  describe("geohash registry", async () => {
    const geohash1 = "d6nuzk8c";
    const geohash2 = "d6nuzk8d";
    // Simulates GeoNFT ID
    const tokenId1 = ethers.BigNumber.from(42);
    const tokenId2 = ethers.BigNumber.from(676);
    const tokenId3 = ethers.BigNumber.from(128);
    const tokenId4 = ethers.BigNumber.from(6);

    it("add nft to geohash and check subtree is filled", async () => {
      // When adding an nft, data is not only appended to it's geohash array, but also
      // to all subhashes arrays. E.g. for 'd6nuzk8c -> 42, data is added to the subtree:
      // 'd' -> [42]
      // 'd6' -> [42]
      // 'd6n' -> [42]
      // 'd6nu' -> [42]
      // 'd6nuz' -> [42]
      // 'd6nuzk' -> [42]
      // 'd6nuzk8' -> [42]
      // 'd6nuzk8c' -> [42]

      await sdRegistry.addToGeotree(geohash1, tokenId1);

      // Nodes array of all geohash subhashe's tree
      const nodes = await Promise.all(
        Array.from({ length: geohash1.length }).map((_, i) => {
          const subhash = geohash1.slice(0, i + 1);
          return sdRegistry.getFromGeotree(subhash);
        })
      );

      // Get first value of each subhash array and check it's the expected value
      nodes.forEach((node) => {
        expect(node[0]).to.equal(tokenId1);
      });
    });
    it("add two nfts to same geohash", async () => {
      await sdRegistry.addToGeotree(geohash1, tokenId1);

      // add a node to the tree
      await sdRegistry.addToGeotree(geohash1, tokenId2);

      const node = await sdRegistry.getFromGeotree(geohash1);

      expect(node.length).to.equal(2);
      expect(node[0]).to.equal(tokenId1);
      expect(node[1]).to.equal(tokenId2);
    });
    it("add the same nft to same geohash", async () => {
      await sdRegistry.addToGeotree(geohash1, tokenId1);

      // add a node to the tree
      await sdRegistry.addToGeotree(geohash1, tokenId1);

      const node = await sdRegistry.getFromGeotree(geohash1);

      expect(node.length).to.equal(1);
      expect(node[0]).to.equal(tokenId1);
    });
    it("update geohash", async () => {
      await sdRegistry.addToGeotree(geohash1, tokenId1);

      const node = await sdRegistry.getFromGeotree(geohash1);
      expect(node.length).to.equal(1);

      // update geohash from geohash1 (d6nuzk8c) to geohash2 (d6nuzk8d) for tokenId1 (42)
      const formerGeohash = geohash1;
      const newGeohash = geohash2;
      await sdRegistry.updateGeotree(formerGeohash, newGeohash, tokenId1);

      const formerNode = await sdRegistry.getFromGeotree(geohash1);
      expect(formerNode.length).to.equal(0);

      const newNode = await sdRegistry.getFromGeotree(geohash2);
      expect(newNode.length).to.equal(1);
    });
    it("remove data from node with geohash", async () => {
      await sdRegistry.addToGeotree(geohash1, tokenId1);

      const node = await sdRegistry.getFromGeotree(geohash1);
      expect(node.length).to.equal(1);

      // remove tokenId1 (42) from geohash d6nuzk8c
      await sdRegistry.removeFromGeotree(geohash1, tokenId1);

      const formerNode = await sdRegistry.getFromGeotree(geohash1);
      expect(formerNode.length).to.equal(0);
    });
    it("remove data from geohash with two items", async () => {
      await sdRegistry.addToGeotree(geohash1, tokenId1);
      await sdRegistry.addToGeotree(geohash1, tokenId2);

      const node = await sdRegistry.getFromGeotree(geohash1);
      expect(node.length).to.equal(2);

      // remove tokenId1 from geohash d6nuzk8c
      await sdRegistry.removeFromGeotree(geohash1, tokenId1);

      const formerNode = await sdRegistry.getFromGeotree(geohash1);
      expect(formerNode.length).to.equal(1);
    });
    it("remove data from geohash with multiple items", async () => {
      await sdRegistry.addToGeotree(geohash1, tokenId1);
      await sdRegistry.addToGeotree(geohash1, tokenId2);
      await sdRegistry.addToGeotree(geohash1, tokenId3);
      await sdRegistry.addToGeotree(geohash1, tokenId4);

      const node = await sdRegistry.getFromGeotree(geohash1);
      expect(node.length).to.equal(4);

      // remove tokenId1 from geohash d6nuzk8c
      await sdRegistry.removeFromGeotree(geohash1, tokenId1);

      const formerNode = await sdRegistry.getFromGeotree(geohash1);
      expect(formerNode.length).to.equal(3);
    });
    it("try to remove data from geohash that hasn't been added", async () => {
      await sdRegistry.addToGeotree(geohash1, tokenId1);

      const node = await sdRegistry.getFromGeotree(geohash1);
      expect(node.length).to.equal(1);

      // remove tokenId2 (676) from geohash d6nuzk8c
      await sdRegistry.removeFromGeotree(geohash1, tokenId2);

      const formerNode = await sdRegistry.getFromGeotree(geohash1);
      expect(formerNode.length).to.equal(1);
    });
  });

  describe("geohash searching", async () => {
    it("find data of multiple geohashes at different levels", async () => {
      const geohash1 = "gc7j98fg";
      const geohash2 = "gc7j98fj";
      const geohash3 = "gc7j98k3";
      const tokenId1 = ethers.BigNumber.from(22);
      const tokenId2 = ethers.BigNumber.from(33);
      const tokenId3 = ethers.BigNumber.from(44);

      /**
       * Level 6                   gc7j98
       *                          /      \
       * Level 7            gc7j98f       gc7j98k
       *                   /      \             \
       * Level 8    gc7j98fg     gc7j98fj       gc7j98k3
       *             [22]          [33]           [44]
       */
      await Promise.all([
        sdRegistry.addToGeotree(geohash1, tokenId1),
        sdRegistry.addToGeotree(geohash2, tokenId2),
        sdRegistry.addToGeotree(geohash3, tokenId3),
      ]);

      const subhashLevel7 = geohash1.slice(0, 7);
      const subhashLevel6 = geohash1.slice(0, 6);
      const [resultLevel7BigNumber, resultLevel6BigNumber] = await Promise.all([
        sdRegistry.getFromGeotree(subhashLevel7),
        sdRegistry.getFromGeotree(subhashLevel6),
      ]);

      // Transform from Big Number values to integer values
      const resultLevel7 = resultLevel7BigNumber.map((value) =>
        value.toNumber()
      );
      const resultLevel6 = resultLevel6BigNumber.map((value) =>
        value.toNumber()
      );

      // Geohash gc7j98f groups geohash1 and geohash2, so its data is -> [tokenId1, tokenId2]
      expect(resultLevel7).deep.equal([
        tokenId1.toNumber(),
        tokenId2.toNumber(),
      ]);
      // Geohash gc7j98 groups geohash1, geohash2 and geohash3, so its data is -> [tokenId1, tokenId2, tokenId3]
      expect(resultLevel6).deep.equal([
        tokenId1.toNumber(),
        tokenId2.toNumber(),
        tokenId3.toNumber(),
      ]);
    });
  });
});