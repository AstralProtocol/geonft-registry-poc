import { ethers } from "hardhat";
import chai from "chai";
import { GEONFT__factory, GEONFT } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber } from "ethers";

const { expect } = chai;

let geonft: GEONFT;
let geonftFactory: GEONFT__factory;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const GEOJSON = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -428.8906744122505,
                12.147418397582491
              ],
              [
                -428.8907468318939,
                12.147347599447487
              ],
              [
                -428.8907213509083,
                12.14723615790054
              ],
              [
                -428.8905939459801,
                12.147198136656193
              ],
              [
                -428.89051884412766,
                12.147280734524921
              ],
              [
                -428.89055103063583,
                12.147379065287602
              ],
              [
                -428.8906744122505,
                12.147418397582491
              ]
            ]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -428.8905443251133,
                12.147381687440772
              ],
              [
                -428.89051616191864,
                12.147279423447841
              ],
              [
                -428.89041021466255,
                12.147224358204612
              ],
              [
                -428.8903096318245,
                12.147300400680368
              ],
              [
                -428.8903257250786,
                12.147409220047532
              ],
              [
                -428.8904584944248,
                12.147449863414236
              ],
              [
                -428.8905443251133,
                12.147381687440772
              ]
            ]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -428.8901272416115,
                12.147367265597998
              ],
              [
                -428.89017820358276,
                12.147195514501217
              ],
              [
                -428.8900186121464,
                12.147116849839737
              ],
              [
                -428.8899327814579,
                12.147217802817746
              ],
              [
                -428.8899743556976,
                12.147334488679682
              ],
              [
                -428.8901272416115,
                12.147367265597998
              ]
            ]
          ]
        }
      }
    ]
  };


describe("geonft", () => {

    beforeEach(async () => {
        [deployer, other] = await ethers.getSigners();
        geonftFactory = (await ethers.getContractFactory(
            'GEONFT',
            deployer
        )) as GEONFT__factory;

        geonft = (await geonftFactory.deploy()) as GEONFT;
        expect(geonft.address).to.properAddress;
    });

    describe("deployment", async () => {
        it('deployer is owner', async () => {
            expect(await geonft.owner()).to.equal(deployer.address);
        });

        it("has expected name and symbol", async function () {
            expect(await geonft.name()).to.equal("GEONFT Minter");
            expect(await geonft.symbol()).to.equal("GEONFT");
        });
    });

    describe("minting", async () => {
        it('contract owner can mint tokens to other', async () => {
            const tokenId = ethers.BigNumber.from(0);
            const tokenURI = "0";

            await expect(geonft.connect(deployer).safeMint(other.address, tokenId.toString(), GEOJSON.toString()))
                .to.emit(geonft, 'Transfer')
                .withArgs(ZERO_ADDRESS, other.address, tokenId);

            expect(await geonft.balanceOf(other.address)).to.equal(1);
            expect(await geonft.ownerOf(tokenId)).to.equal(other.address);
            expect(await geonft.tokenURI(tokenId)).to.equal(tokenURI);

            const tokens = await geonft.getTokensByOwner(other.address);
            const {0: tokenIds, 1: uris} = tokens;

            expect(tokenIds[0]).to.equal(0);
        });

        it('other accounts can mint tokens to themselves', async () => {
            const tokenId = ethers.BigNumber.from(0);
            const tokenURI = "0";
            await expect(geonft.connect(other).safeMint(other.address, tokenId.toString(), GEOJSON.toString()))
                .to.emit(geonft, 'Transfer')
                .withArgs(ZERO_ADDRESS, other.address, tokenId);

            expect(await geonft.balanceOf(other.address)).to.equal(1);
            expect(await geonft.ownerOf(tokenId)).to.equal(other.address);
            expect(await geonft.tokenURI(tokenId)).to.equal(tokenURI);
        });
    });

    describe("get tokens for address", async () => {
      it('contract owner mints three tokens, burns the second one', async () => {
          const tokenId = ethers.BigNumber.from(0);

          await expect(geonft.connect(deployer).safeMint(deployer.address, tokenId.toString(), GEOJSON.toString()))
              .to.emit(geonft, 'Transfer')
              .withArgs(ZERO_ADDRESS, deployer.address, tokenId);

          await expect(geonft.connect(deployer).safeMint(deployer.address, tokenId.add(1).toString(), GEOJSON.toString()))
              .to.emit(geonft, 'Transfer')
              .withArgs(ZERO_ADDRESS, deployer.address, tokenId.add(1));

          await expect(geonft.connect(deployer).safeMint(deployer.address, tokenId.add(2).toString(), GEOJSON.toString()))
              .to.emit(geonft, 'Transfer')
              .withArgs(ZERO_ADDRESS, deployer.address, tokenId.add(2));

          expect(await geonft.balanceOf(deployer.address)).to.equal(3);

          await expect(geonft.connect(deployer).burn(1))
                .to.emit(geonft, 'Transfer')
                .withArgs(deployer.address, ZERO_ADDRESS, 1);

          const tokens = await geonft.getTokensByOwner(deployer.address);
          const {0: tokenIds, 1: uris, 2: geojsons} = tokens;
          expect(tokenIds.length).to.equal(2);
          expect(tokenIds[0]).to.equal(0);
          expect(tokenIds[1]).to.equal(2);

          expect(uris[0]).to.equal("0");
          expect(uris[1]).to.equal("2");

          await expect(geonft.connect(other).safeMint(other.address, tokenId.add(3).toString(), GEOJSON.toString()))
            .to.emit(geonft, 'Transfer')
            .withArgs(ZERO_ADDRESS, other.address, tokenId.add(3));

          const alltokens = await geonft.getAllTokens();
          expect(alltokens.length).to.equal(3);
      });

  });

    describe("burning", async () => {
        it('holders can burn their tokens', async () => {
            const tokenId = ethers.BigNumber.from(0);

            await expect(geonft.connect(deployer).safeMint(other.address, tokenId.toString(), GEOJSON.toString()))
                .to.emit(geonft, 'Transfer')
                .withArgs(ZERO_ADDRESS, other.address, tokenId);

            await expect(geonft.connect(other).burn(tokenId))
                .to.emit(geonft, 'Transfer')
                .withArgs(other.address, ZERO_ADDRESS, tokenId);
            expect(await geonft.balanceOf(other.address)).to.equal(0);
            await expect(geonft.ownerOf(tokenId))
                .to.be.revertedWith('ERC721: owner query for nonexistent token');
            expect(await geonft.totalSupply()).to.equal(0);

            const tokens = await geonft.getTokensByOwner(deployer.address);
            const {0: tokenIds, 1: uris} = tokens;
            expect(tokenIds.length).to.equal(0);
        });

        it('cannot burn if not token owner', async () => {
            const tokenId = ethers.BigNumber.from(0);
            
            await expect(geonft.connect(deployer).safeMint(other.address, tokenId.toString(), GEOJSON.toString()))
                .to.emit(geonft, 'Transfer')
                .withArgs(ZERO_ADDRESS, other.address, tokenId);

            await expect(geonft.connect(deployer).burn(tokenId))
                .to.be.revertedWith('ERC721Burnable: caller is not owner nor approved');

            expect(await geonft.balanceOf(other.address)).to.equal(1);
            expect(await geonft.totalSupply()).to.equal(1);
        });
    });

    describe("supports interfaces", async () => {
        it('supports ERC721', async function () {
            expect(await geonft.supportsInterface('0x80ac58cd')).to.equal(true);
        });
    });
});


