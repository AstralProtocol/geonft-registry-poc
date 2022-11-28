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
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { create } from "ipfs-http-client";
var WalletStore = /** @class */ (function () {
    function WalletStore() {
        var _this = this;
        this.address = null;
        this.balance = null;
        this.status = WalletStatusEnums.DISCONNECTED;
        this.ipfsClient = null;
        this.provider = null;
        this.web3Modal = null;
        this.connectWallet = function () { return __awaiter(_this, void 0, void 0, function () {
            var web3Modal, provider, web3Provider, signer, address, balance, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Connecting wallet");
                        this.status = WalletStatusEnums.LOADING;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        web3Modal = new Web3Modal({
                            cacheProvider: false,
                            providerOptions: {
                                walletconnect: {
                                    package: WalletConnectProvider,
                                    options: {
                                        rpc: {
                                            44787: "https://alfajores-forno.celo-testnet.org",
                                            42220: "https://forno.celo.org",
                                        },
                                    },
                                },
                            },
                            disableInjectedProvider: false,
                        });
                        return [4 /*yield*/, web3Modal.connect()];
                    case 2:
                        provider = _a.sent();
                        web3Provider = new ethers.providers.Web3Provider(provider);
                        signer = web3Provider.getSigner();
                        return [4 /*yield*/, signer.getAddress()];
                    case 3:
                        address = _a.sent();
                        return [4 /*yield*/, web3Provider.getBalance(address)];
                    case 4:
                        balance = _a.sent();
                        // Subscribe to accounts change
                        provider.on("accountsChanged", function (accounts) {
                            console.log(accounts);
                        });
                        // Subscribe to chainId change
                        provider.on("chainChanged", function (chainId) {
                            console.log("Web3 chainChanged:");
                            console.log(chainId);
                            // dispatch(fetchAcctAndThenLoadNFTs());
                        });
                        provider.on("block", function (blockNumber) {
                            console.log(blockNumber);
                            // dispatch(fetchLastBlock());
                        });
                        // Subscribe to session disconnection
                        provider.on("disconnect", function (code, reason) {
                            console.log("Web3 disconnect:");
                            console.log(code, reason);
                        });
                        this.address = address;
                        this.balance = ethers.utils.formatEther(balance);
                        this.provider = provider;
                        this.web3Modal = web3Modal;
                        this.ipfsClient = create(ipfsOptions);
                        this.status = WalletStatusEnums.CONNECTED;
                        console.log("Connected to wallet");
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.log("Error initializing web3", error_1);
                        this.status = WalletStatusEnums.DISCONNECTED;
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.disconnectWallet = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Disconnecting wallet");
                        this.status = WalletStatusEnums.LOADING;
                        if (!this.web3Modal) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.web3Modal.clearCachedProvider()];
                    case 1:
                        _a.sent();
                        this.address = null;
                        this.balance = null;
                        this.provider = null;
                        this.web3Modal = null;
                        this.status = WalletStatusEnums.DISCONNECTED;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); };
        makeAutoObservable(this);
    }
    return WalletStore;
}());
var ipfsOptions = {
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    apiPath: "/api/v0",
    headers: {
        authorization: "Basic " +
            Buffer.from(process.env.REACT_APP_PROJECT_ID +
                ":" +
                process.env.REACT_APP_PROJECT_SECRET).toString("base64"),
    },
};
export var WalletStatusEnums;
(function (WalletStatusEnums) {
    WalletStatusEnums[WalletStatusEnums["DISCONNECTED"] = 0] = "DISCONNECTED";
    WalletStatusEnums[WalletStatusEnums["LOADING"] = 1] = "LOADING";
    WalletStatusEnums[WalletStatusEnums["CONNECTED"] = 2] = "CONNECTED";
    WalletStatusEnums[WalletStatusEnums["WRONG_NETWORK"] = 3] = "WRONG_NETWORK";
})(WalletStatusEnums || (WalletStatusEnums = {}));
export var walletStore = new WalletStore();
