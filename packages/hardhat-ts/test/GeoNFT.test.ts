import { ethers } from "hardhat";
import chai from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { GeoNFT } from "../typechain";
import { GEOJSON1, GEOJSON2 } from "./mockData";

const { expect } = chai;

let geonft: GeoNFT;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("geonft", () => {
  beforeEach(async () => {
    [deployer, other] = await ethers.getSigners();

    const geonftFactory = await ethers.getContractFactory("GeoNFT");
    geonft = (await geonftFactory.deploy()) as GeoNFT;
  });

  describe("deployment", async () => {
    it("deployer is owner", async () => {
      expect(await geonft.owner()).to.equal(deployer.address);
    });

    it("has expected name and symbol", async function () {
      expect(await geonft.name()).to.equal("GEONFT Minter");
      expect(await geonft.symbol()).to.equal("GEONFT");
    });
  });

  describe("minting", async () => {
    it("contract owner can mint tokens to other", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";

      await expect(
        geonft.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      expect(await geonft.balanceOf(other.address)).to.equal(1);
      expect(await geonft.ownerOf(tokenId)).to.equal(other.address);
      expect(await geonft.tokenURI(tokenId)).to.equal(tokenURI);

      const tokens = await geonft.getTokensByOwner(other.address);
      const { 0: tokenIds } = tokens;

      expect(tokenIds[0]).to.equal(0);
    });

    it("other accounts can mint tokens to themselves", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      await expect(
        geonft
          .connect(other)
          .safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      expect(await geonft.balanceOf(other.address)).to.equal(1);
      expect(await geonft.ownerOf(tokenId)).to.equal(other.address);
      expect(await geonft.tokenURI(tokenId)).to.equal(tokenURI);
    });
  });

  describe("update on-chain data", async () => {
    it("update Token URI", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const tokenURIUpdate = "0 update";

      await expect(
        geonft.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await geonft.setTokenURI(tokenId, tokenURIUpdate);
      expect(await geonft.tokenURI(tokenId)).to.be.equal(tokenURIUpdate);
    });

    it("update GeoJSON", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";

      await expect(
        geonft.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await geonft.setGeoJson(tokenId, GEOJSON2.toString());
      expect(await geonft.geoJson(tokenId)).to.be.equal(GEOJSON2.toString());
    });

    it("update ecological index type", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const indexTypeDefault = "area_m2";
      const indexTypeUpdate = "ecologicalindex_percent";
      const indexValueDefault = 0;

      await expect(
        geonft.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);
      expect((await geonft.getEcologicalIndex(tokenId)).indexType).to.be.equal(
        indexTypeDefault
      );

      await geonft.setEcologicalIndex(
        tokenId,
        indexTypeUpdate,
        indexValueDefault
      );
      expect((await geonft.getEcologicalIndex(tokenId)).indexType).to.be.equal(
        indexTypeUpdate
      );
    });

    it("update ecological index value", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const indexTypeDefault = "area_m2";
      const indexValueDefault = 0;
      const indexValueUpdate = 10;

      await expect(
        geonft.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);
      expect((await geonft.getEcologicalIndex(tokenId)).indexValue).to.be.equal(
        indexValueDefault
      );

      await geonft.setEcologicalIndex(
        tokenId,
        indexTypeDefault,
        indexValueUpdate
      );
      expect((await geonft.getEcologicalIndex(tokenId)).indexValue).to.be.equal(
        indexValueUpdate
      );
    });

    it("update ecological index", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const tokenURI = "0";
      const indexTypeDefault = "area_m2";
      const indexTypeUpdate = "ecologicalindex_percent";
      const indexValueDefault = 0;
      const indexValueUpdate = 10;

      await expect(
        geonft.safeMint(other.address, tokenURI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      const defaultEcologicalIndex = await geonft.getEcologicalIndex(tokenId);
      expect(defaultEcologicalIndex.indexType).to.be.equal(indexTypeDefault);
      expect(defaultEcologicalIndex.indexValue).to.be.equal(indexValueDefault);

      await geonft.setEcologicalIndex(
        tokenId,
        indexTypeUpdate,
        indexValueUpdate
      );

      const updateEcologicalIndex = await geonft.getEcologicalIndex(tokenId);
      expect(updateEcologicalIndex.indexType).to.be.equal(indexTypeUpdate);
      expect(updateEcologicalIndex.indexValue).to.be.equal(indexValueUpdate);
    });
  });

  describe("get tokens for address", async () => {
    it("contract owner mints three tokens, burns the second one", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const token0URI = "0";
      const token1URI = "1";
      const token2URI = "2";
      const token3URI = "3";

      await expect(
        geonft.safeMint(deployer.address, token0URI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, deployer.address, tokenId);

      await expect(
        geonft.safeMint(deployer.address, token1URI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, deployer.address, tokenId.add(1));

      await expect(
        geonft.safeMint(deployer.address, token2URI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, deployer.address, tokenId.add(2));

      expect(await geonft.balanceOf(deployer.address)).to.equal(3);

      // burn token 1
      await expect(geonft.burn(1))
        .to.emit(geonft, "Transfer")
        .withArgs(deployer.address, ZERO_ADDRESS, 1);

      const tokens = await geonft.getTokensByOwner(deployer.address);
      const { 0: tokenIds, 1: uris } = tokens;
      expect(tokenIds.length).to.equal(2);
      expect(tokenIds[0]).to.equal(0);
      expect(tokenIds[1]).to.equal(2);

      expect(uris[0]).to.equal(token0URI);
      expect(uris[1]).to.equal(token2URI);

      await expect(
        geonft
          .connect(other)
          .safeMint(other.address, token3URI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId.add(3));
    });
  });

  describe("burning", async () => {
    it("holders can burn their tokens", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const token0URI = "0";

      await expect(
        geonft.safeMint(other.address, token0URI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await expect(geonft.connect(other).burn(tokenId))
        .to.emit(geonft, "Transfer")
        .withArgs(other.address, ZERO_ADDRESS, tokenId);
      expect(await geonft.balanceOf(other.address)).to.equal(0);
      await expect(geonft.ownerOf(tokenId)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
      expect(await geonft.totalSupply()).to.equal(0);

      const tokens = await geonft.getTokensByOwner(deployer.address);
      const { 0: tokenIds } = tokens;
      expect(tokenIds.length).to.equal(0);
    });

    it("cannot burn if not token owner", async () => {
      const tokenId = ethers.BigNumber.from(0);
      const token0URI = "0";

      await expect(
        geonft.safeMint(other.address, token0URI, GEOJSON1.toString())
      )
        .to.emit(geonft, "Transfer")
        .withArgs(ZERO_ADDRESS, other.address, tokenId);

      await expect(geonft.burn(tokenId)).to.be.revertedWith(
        "ERC721: caller is not token owner or approved'"
      );

      expect(await geonft.balanceOf(other.address)).to.equal(1);
      expect(await geonft.totalSupply()).to.equal(1);
    });
  });

  describe("supports interfaces", async () => {
    it("supports ERC721", async function () {
      expect(await geonft.supportsInterface("0x80ac58cd")).to.equal(true);
    });
  });
});
