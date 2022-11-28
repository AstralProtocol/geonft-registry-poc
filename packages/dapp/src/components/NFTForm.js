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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography, } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { walletStore } from "../features/wallet/walletStore";
import { docsStore } from "../features/docs/docsStore";
import { nftsStore } from "../features/nfts/nftsStore";
var NFTForm = observer(function (props) {
    var open = props.open, metadata = props.metadata, geojson = props.geojson, closeForm = props.closeForm, onAccept = props.onAccept;
    console.log("AddNFTForm metadata", metadata);
    var _a = useState(""), error = _a[0], setError = _a[1];
    var _b = useState((metadata === null || metadata === void 0 ? void 0 : metadata.name) || ""), name = _b[0], setName = _b[1];
    var _c = useState((metadata === null || metadata === void 0 ? void 0 : metadata.description) || ""), description = _c[0], setDescription = _c[1];
    var _d = useState((metadata === null || metadata === void 0 ? void 0 : metadata.image) || ""), fileUrl = _d[0], setFileUrl = _d[1];
    var _e = useState(undefined), file = _e[0], setFile = _e[1];
    var ipfsClient = walletStore.ipfsClient;
    var isBusyMinting = nftsStore.isBusyMinting;
    var imgSrc = file
        ? URL.createObjectURL(file)
        : "https://ipfs.io/ipfs/".concat(fileUrl);
    console.log("IMG SRC: ", imgSrc);
    useEffect(function () {
        if (metadata) {
            setName(metadata.name);
            setDescription(metadata.description);
            setFileUrl(metadata.image);
        }
    }, [metadata]);
    var onNameChanged = function (e) { return setName(e.target.value); };
    var onDescriptionChanged = function (e) { return setDescription(e.target.value); };
    var onFileLoadChange = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var file;
        return __generator(this, function (_a) {
            file = e.target.files[0];
            setFile(file);
            return [2 /*return*/];
        });
    }); };
    var handleClose = function () {
        closeForm();
        nftsStore.editNft = null;
    };
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var added, newMetadata, docId, metadataURI, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (ipfsClient == null) {
                        throw new Error("IPFS client is not initialized");
                    }
                    if (!geojson) {
                        throw new Error("GeoJSON is not defined");
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, , 9]);
                    nftsStore.isBusyMinting = true;
                    if (!file) {
                        throw new Error("File is not defined");
                    }
                    return [4 /*yield*/, ipfsClient.add(file, {
                            progress: function (prog) { return console.log("received: ".concat(prog)); },
                        })];
                case 2:
                    added = _b.sent();
                    console.log(added.path);
                    newMetadata = {
                        name: name,
                        description: description,
                        image: added.path,
                    };
                    if (!metadata) return [3 /*break*/, 4];
                    docId = (_a = nftsStore.editNft) === null || _a === void 0 ? void 0 : _a.metadataURI;
                    if (!docId) {
                        handleClose();
                        throw new Error("NFT ID is not defined");
                    }
                    return [4 /*yield*/, nftsStore.updateNftMetadata(docId, newMetadata)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 4: return [4 /*yield*/, docsStore.writeDocument(newMetadata)];
                case 5:
                    metadataURI = _b.sent();
                    return [4 /*yield*/, nftsStore.mint(metadataURI, geojson)];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    nftsStore.isBusyMinting = false;
                    setName("");
                    setDescription("");
                    setFileUrl("");
                    setError("");
                    onAccept();
                    handleClose();
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _b.sent();
                    setError(err_1.message);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    return (_jsx("div", { children: _jsxs(Dialog, __assign({ open: open, onClose: handleClose, fullWidth: true, maxWidth: "md" }, { children: [_jsxs(DialogTitle, { children: ["Create NFT ", error && _jsx(Alert, __assign({ severity: "error" }, { children: error }))] }), _jsx(DialogContent, { children: _jsxs("form", { children: [_jsxs("label", __assign({ htmlFor: "upload-file" }, { children: [_jsx("input", { style: { display: "none" }, id: "upload-file", name: "upload-file", type: "file", accept: "image/*", onChange: onFileLoadChange }), _jsx(Button, __assign({ color: "secondary", variant: "contained", component: "span" }, { children: "Upload image" })), _jsx(Typography, __assign({ component: "span", variant: "body2", color: "textSecondary", ml: 2 }, { children: (file === null || file === void 0 ? void 0 : file.name) || "No file selected" }))] })), _jsx("div", { children: (fileUrl || file) && (_jsx("img", { id: "image-preview", className: "rounded mt-4", alt: "upload", style: {
                                        marginTop: "10px",
                                        width: "auto",
                                        height: "auto",
                                        maxWidth: "100%",
                                        maxHeight: "350px",
                                    }, src: imgSrc })) }), _jsx(TextField, { fullWidth: true, id: "nftName", name: "nftName", label: "Name", variant: "outlined", value: name, onChange: onNameChanged, margin: "normal" }), _jsx(TextField, { fullWidth: true, id: "nftDesc", name: "nftDesc", label: "Description", variant: "outlined", value: description, onChange: onDescriptionChanged, margin: "normal" }), _jsx("div", { children: _jsx("pre", { children: geojson && JSON.stringify(JSON.parse(geojson), null, 2) }) })] }) }), _jsx(DialogActions, { children: _jsxs(Grid, __assign({ container: true, justifyContent: "flex-end", spacing: 1 }, { children: [_jsx(Grid, __assign({ item: true }, { children: _jsx(Button, __assign({ variant: "contained", color: "secondary", fullWidth: true, onClick: handleClose }, { children: "Cancel" })) })), _jsx(Grid, __assign({ item: true }, { children: _jsx(LoadingButton, __assign({ loading: isBusyMinting, variant: "contained", color: "primary", fullWidth: true, onClick: handleSubmit }, { children: "Create NFT" })) }))] })) })] })) }));
});
export default NFTForm;
