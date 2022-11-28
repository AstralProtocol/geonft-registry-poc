var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { makeAutoObservable } from "mobx";
import { ethers } from "ethers";
import networkMapping from "./../../deployments.json";
import { walletStore } from "../wallet/walletStore";
import { docsStore } from "../docs/docsStore";
import { getGeoNFTContract, getGeoNFTsByOwner, mintGeoNFT, updateGeoNFTGeojson, } from "./nftsCore";
var NFTsStore = /** @class */ (function () {
    function NFTsStore() {
        var _this = this;
        this.nfts = [];
        this.geoNFTContract = null;
        this.editNft = null;
        this.isBusyMinting = false;
        this.isBusyFetching = false;
        this.fetchNFTs = function () { return __awaiter(_this, void 0, void 0, function () {
            var provider, address, ceramic, web3Provider, _a, nfts, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("fetching");
                        this.isBusyFetching = true;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        provider = walletStore.provider, address = walletStore.address;
                        ceramic = docsStore.ceramic;
                        web3Provider = new ethers.providers.Web3Provider(provider);
                        if (!web3Provider || !address) {
                            throw new Error("Web3 provider not initialized");
                        }
                        if (!ceramic) {
                            throw new Error("Ceramic not initialized");
                        }
                        if (!!this.geoNFTContract) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, getGeoNFTContract(web3Provider, networkMapping)];
                    case 2:
                        _a.geoNFTContract = _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, getGeoNFTsByOwner(this.geoNFTContract, address, ceramic)];
                    case 4:
                        nfts = _b.sent();
                        this.nfts = nfts;
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _b.sent();
                        console.error(error_1);
                        return [3 /*break*/, 6];
                    case 6:
                        this.isBusyFetching = false;
                        return [2 /*return*/];
                }
            });
        }); };
        this.mint = function (metadataURI, geojson) { return __awaiter(_this, void 0, void 0, function () {
            var address, id, metadata, newNFT, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("minting");
                        this.isBusyMinting = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        address = walletStore.address;
                        if (!address) {
                            throw new Error("Address not defined");
                        }
                        if (!this.geoNFTContract) {
                            throw new Error("GeoNFT contract not initialized");
                        }
                        return [4 /*yield*/, mintGeoNFT(this.geoNFTContract, address, {
                                metadataURI: metadataURI,
                                geojson: geojson,
                            })];
                    case 2:
                        id = _a.sent();
                        return [4 /*yield*/, docsStore.readDocument(metadataURI)];
                    case 3:
                        metadata = _a.sent();
                        newNFT = {
                            id: id,
                            metadataURI: metadataURI,
                            metadata: metadata,
                            geojson: geojson,
                        };
                        this.nfts.push(newNFT);
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error(error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.updateNftGeojson = function (nftId, geojson) { return __awaiter(_this, void 0, void 0, function () {
            var address, updatedNft, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        address = walletStore.address;
                        if (!address) {
                            throw new Error("Address not defined");
                        }
                        if (!this.geoNFTContract) {
                            throw new Error("GeoNFT contract not initialized");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, updateGeoNFTGeojson(this.geoNFTContract, nftId, geojson)];
                    case 2:
                        _a.sent();
                        console.log("update geojson tx success");
                        updatedNft = this.nfts.find(function (nft) { return nft.id === nftId; });
                        if (updatedNft) {
                            // TODO: Get updated geojson from contract and use its geojson
                            updatedNft.geojson = geojson;
                            return [2 /*return*/, true];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        console.error(error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, false];
                }
            });
        }); };
        this.updateNftMetadata = function (docId, metadata) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, docsStore.updateDocument(docId, metadata)];
                    case 1:
                        _a.sent();
                        // Update store nft with the new metadata
                        this.nfts = this.nfts.map(function (nft) {
                            if (nft.metadataURI === docId) {
                                return __assign(__assign({}, nft), { metadata: metadata });
                            }
                            return nft;
                        });
                        return [2 /*return*/];
                }
            });
        }); };
        // This will make the whole class observable to any changes
        makeAutoObservable(this);
    }
    return NFTsStore;
}());
export var nftsStore = new NFTsStore();
