var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { BigNumber, Contract } from "ethers";
import { readCeramicDocument } from "../docs/docsCore";
// The retrieval of the GeoNFTs from the contract is made in the following steps:
// 1. Get all the tokens owned by the user.
// 2. For each token, get the metadata URI and retrieve the metadata from Ceramic.
// 3. Create the NFT object with id, metadata and geojson, an return the array of NFTs.
export var getGeoNFTsByOwner = function (geoNFTContract, address, ceramic) { return __awaiter(void 0, void 0, void 0, function () {
    var result, nftIds, metadataURIs, geojsons, metadataPromises, metadataList, nfts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, geoNFTContract.getTokensByOwner(address)];
            case 1:
                result = _a.sent();
                nftIds = result[0], metadataURIs = result[1], geojsons = result[2];
                metadataPromises = metadataURIs.map(function (metadataURI) {
                    // We do not await in order to return the Promise
                    return readCeramicDocument(ceramic, metadataURI);
                });
                return [4 /*yield*/, Promise.all(metadataPromises)];
            case 2:
                metadataList = _a.sent();
                nfts = nftIds.map(function (nftId, i) {
                    var id = BigNumber.from(nftId).toNumber();
                    var metadataURI = metadataURIs[i];
                    var metadata = metadataList[i];
                    var geojson = geojsons[i];
                    return {
                        id: id,
                        geojson: geojson,
                        metadataURI: metadataURI,
                        metadata: metadata,
                    };
                });
                return [2 /*return*/, nfts];
        }
    });
}); };
export var getGeoNFTContract = function (provider, networkMapping) { return __awaiter(void 0, void 0, void 0, function () {
    var signer, chainId, chainIdStr, networkMappingForChain, geoNFTMapping, geoNFTContract, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                signer = provider.getSigner();
                return [4 /*yield*/, provider.getNetwork()];
            case 1: return [4 /*yield*/, (_a.sent()).chainId];
            case 2:
                chainId = _a.sent();
                chainIdStr = chainId.toString();
                console.log("Connected on chain ".concat(chainId));
                networkMappingForChain = networkMapping[chainIdStr];
                if (networkMappingForChain === undefined) {
                    throw new Error("No network mapping found");
                }
                geoNFTMapping = networkMappingForChain[0]["contracts"]["GeoNFT"];
                geoNFTContract = new Contract(geoNFTMapping.address, geoNFTMapping.abi, signer);
                return [2 /*return*/, geoNFTContract];
            case 3:
                error_1 = _a.sent();
                console.error(error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
export var mintGeoNFT = function (nftContract, address, nftParams) { return __awaiter(void 0, void 0, void 0, function () {
    var metadataURI, geojson, tx, contractReceipt, id, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                metadataURI = nftParams.metadataURI, geojson = nftParams.geojson;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, nftContract.safeMint(address, metadataURI, geojson)];
            case 2:
                tx = _a.sent();
                console.log("mint tx hash:", tx.hash);
                console.log("mint tx:", tx);
                return [4 /*yield*/, tx.wait()];
            case 3:
                contractReceipt = _a.sent();
                console.log("transaction receipt:", contractReceipt);
                if (contractReceipt.status !== 1) {
                    throw new Error("Transaction failed");
                }
                console.log("mint tx success");
                id = BigNumber.from(contractReceipt.logs[0].topics[3]).toNumber();
                return [2 /*return*/, id];
            case 4:
                error_2 = _a.sent();
                console.log("Error minting:", error_2);
                throw error_2;
            case 5: return [2 /*return*/];
        }
    });
}); };
export var updateGeoNFTGeojson = function (nftContract, nftId, geojson) { return __awaiter(void 0, void 0, void 0, function () {
    var tx, contractReceipt, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, nftContract.setGeoJson(nftId, geojson)];
            case 1:
                tx = _a.sent();
                console.log("update geojson tx hash:", tx.hash);
                console.log("update geojson tx:", tx);
                return [4 /*yield*/, tx.wait()];
            case 2:
                contractReceipt = _a.sent();
                console.log("transaction receipt:", contractReceipt);
                if (contractReceipt.status !== 1) {
                    throw new Error("Transaction failed");
                }
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error("Error updating geojson:", error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
