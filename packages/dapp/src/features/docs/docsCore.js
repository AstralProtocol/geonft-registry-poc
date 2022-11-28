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
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import ThreeIdResolver from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";
import { DID } from "dids";
// DocumentContent is a generic type that can be passed to define the content of a document
// In this context, it would be the NFTMetadata type passed on function execution
export var readCeramicDocument = function (ceramic, docId) { return __awaiter(void 0, void 0, void 0, function () {
    var doc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TileDocument.load(ceramic, docId)];
            case 1:
                doc = _a.sent();
                return [2 /*return*/, doc.content];
        }
    });
}); };
export var writeCeramicDocument = function (ceramic, metadata) { return __awaiter(void 0, void 0, void 0, function () {
    var createStreamOptions, doc;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!ceramic || !ceramic.did) {
                    throw new Error("Ceramic or did provider not initialized");
                }
                createStreamOptions = {
                    controllers: [ceramic.did.id],
                };
                return [4 /*yield*/, TileDocument.create(ceramic, metadata, createStreamOptions)];
            case 1:
                doc = _a.sent();
                return [2 /*return*/, doc.id.toString()];
        }
    });
}); };
export var updateCeramicDocument = function (ceramic, docId, metadata) { return __awaiter(void 0, void 0, void 0, function () {
    var document;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, TileDocument.load(ceramic, docId)];
            case 1:
                document = _a.sent();
                return [4 /*yield*/, document.update(metadata)];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
export var createCeramicClient = function (address, provider) { return __awaiter(void 0, void 0, void 0, function () {
    var authProvider, threeIdConnect, DEFAULT_CERAMIC_HOST, ceramic, resolver, did, didProvider;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!provider || !address) {
                    throw new Error("Wallet or provider not found");
                }
                authProvider = new EthereumAuthProvider(provider, address);
                threeIdConnect = new ThreeIdConnect();
                console.log("connecting to 3id");
                return [4 /*yield*/, threeIdConnect.connect(authProvider)];
            case 1:
                _a.sent();
                DEFAULT_CERAMIC_HOST = "https://ceramic-clay.3boxlabs.com";
                ceramic = new CeramicClient(DEFAULT_CERAMIC_HOST);
                resolver = __assign({}, ThreeIdResolver.getResolver(ceramic));
                did = new DID({ resolver: resolver });
                ceramic.setDID(did);
                return [4 /*yield*/, threeIdConnect.getDidProvider()];
            case 2:
                didProvider = _a.sent();
                console.log("ceramic.did:", ceramic.did);
                if (!ceramic.did) {
                    throw new Error("Ceramic did not initialized");
                }
                return [4 /*yield*/, ceramic.did.setProvider(didProvider)];
            case 3:
                _a.sent();
                return [4 /*yield*/, ceramic.did.authenticate()];
            case 4:
                _a.sent();
                return [2 /*return*/, ceramic];
        }
    });
}); };
