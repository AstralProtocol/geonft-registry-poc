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
import { walletStore } from "../wallet/walletStore";
import { createCeramicClient, readCeramicDocument, writeCeramicDocument, updateCeramicDocument, } from "./docsCore";
var DocsStore = /** @class */ (function () {
    function DocsStore() {
        var _this = this;
        this.ceramic = null;
        this.readDocument = function (docId) { return __awaiter(_this, void 0, void 0, function () {
            var _a, documentContent, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!!this.ceramic) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.createCeramicClient()];
                    case 1:
                        _a.ceramic = _b.sent();
                        _b.label = 2;
                    case 2: return [4 /*yield*/, readCeramicDocument(this.ceramic, docId)];
                    case 3:
                        documentContent = _b.sent();
                        return [2 /*return*/, documentContent];
                    case 4:
                        error_1 = _b.sent();
                        console.error("Error reading document", error_1);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.writeDocument = function (metadata) { return __awaiter(_this, void 0, void 0, function () {
            var _a, docId, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!metadata) {
                            throw new Error("Metadata not found");
                        }
                        if (!!this.ceramic) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.createCeramicClient()];
                    case 1:
                        _a.ceramic = _b.sent();
                        _b.label = 2;
                    case 2: return [4 /*yield*/, writeCeramicDocument(this.ceramic, metadata)];
                    case 3:
                        docId = _b.sent();
                        return [2 /*return*/, docId];
                    case 4:
                        error_2 = _b.sent();
                        console.error("Error writing document", error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.updateDocument = function (docId, metadata) { return __awaiter(_this, void 0, void 0, function () {
            var _a, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!docId) {
                            throw new Error("Document not found");
                        }
                        if (!metadata) {
                            throw new Error("Metadata not found");
                        }
                        if (!!this.ceramic) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.createCeramicClient()];
                    case 1:
                        _a.ceramic = _b.sent();
                        _b.label = 2;
                    case 2: return [4 /*yield*/, updateCeramicDocument(this.ceramic, docId, metadata)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _b.sent();
                        console.error("Error updating document", error_3);
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.createCeramicClient = function () { return __awaiter(_this, void 0, void 0, function () {
            var provider, address, ceramic, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        provider = walletStore.provider, address = walletStore.address;
                        if (!provider || !address) {
                            throw new Error("Wallet not connected");
                        }
                        return [4 /*yield*/, createCeramicClient(address, provider)];
                    case 1:
                        ceramic = _a.sent();
                        return [2 /*return*/, ceramic];
                    case 2:
                        error_4 = _a.sent();
                        console.error("Error creating ceramic client", error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        // This will make the whole class observable to any changes
        makeAutoObservable(this);
    }
    return DocsStore;
}());
export var docsStore = new DocsStore();
