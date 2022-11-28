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
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Button, Box, Typography, CircularProgress } from "@mui/material";
import Feature from "ol/Feature";
import { Polygon, MultiPolygon } from "ol/geom";
import GeoJSON from "ol/format/GeoJSON";
import "ol/ol.css";
import { initMap, select, draw, modify, editLayer, geoNftsLayer, } from "./OpenLayersVariables";
import NFTForm from "../NFTForm";
import { nftsStore } from "../../features/nfts/nftsStore";
var Status;
(function (Status) {
    Status[Status["IDLE"] = 0] = "IDLE";
    Status[Status["CREATE"] = 1] = "CREATE";
    Status[Status["EDIT_GEOMETRY"] = 2] = "EDIT_GEOMETRY";
    Status[Status["EDIT_METADATA"] = 3] = "EDIT_METADATA";
})(Status || (Status = {}));
var EditionStatus;
(function (EditionStatus) {
    EditionStatus[EditionStatus["DRAW"] = 0] = "DRAW";
    EditionStatus[EditionStatus["MODIFY"] = 1] = "MODIFY";
    EditionStatus[EditionStatus["DELETE"] = 2] = "DELETE";
})(EditionStatus || (EditionStatus = {}));
var isDeleteFeatureActive = false;
var MapWrapper = observer(function () {
    var nfts = nftsStore.nfts;
    console.log("MAP NFTS: ", toJS(nfts));
    var _a = useState(Status.IDLE), status = _a[0], setStatus = _a[1];
    var _b = useState(EditionStatus.MODIFY), editionStatus = _b[0], setEditionStatus = _b[1];
    var _c = useState(false), formIsOpen = _c[0], setFormIsOpen = _c[1];
    var _d = useState(""), geojson = _d[0], setGeojson = _d[1];
    var _e = useState(), metadata = _e[0], setMetadata = _e[1];
    var _f = useState(), selectedFeature = _f[0], setSelectedFeature = _f[1];
    useEffect(function () {
        initMap.setTarget("map");
        initMap.on("click", function (e) { return _deleteClickedFeature(initMap, e); });
        select.on("select", function (e) {
            var selectedFeature = e.target.getFeatures().getArray()[0];
            setSelectedFeature(selectedFeature);
        });
    }, []);
    useEffect(function () {
        if (!nfts || nfts.length === 0)
            return;
        nfts.forEach(function (nft) {
            var _a;
            var geojson = nft.geojson, metadata = nft.metadata;
            var geojsonFeatures = new GeoJSON().readFeatures(JSON.parse(geojson));
            var feature = geojsonFeatures[0];
            feature.setId(nft.id);
            feature.setProperties(metadata);
            (_a = geoNftsLayer.getSource()) === null || _a === void 0 ? void 0 : _a.addFeatures([feature]);
        });
    }, [nfts]);
    useEffect(function () {
        _editNftMetadata();
    }, [nftsStore.editNft]);
    useEffect(function () {
        var isDeleteStatus = editionStatus === EditionStatus.DELETE;
        isDeleteFeatureActive = isDeleteStatus;
    }, [editionStatus]);
    // PUBLIC FUNCTIONS
    var createNft = function () {
        setStatus(Status.CREATE);
        draw.setActive(true);
    };
    var editGeometry = function () {
        var _a, _b;
        if (!selectedFeature) {
            alert("Please select a feature to modify");
            return;
        }
        var polygonFeatures = _convertMultiPolygonFeatureToPolygonFeatures(selectedFeature);
        // Remove feature from geoNftsLayer and add it to editLayer
        (_a = geoNftsLayer.getSource()) === null || _a === void 0 ? void 0 : _a.removeFeature(selectedFeature);
        (_b = editLayer.getSource()) === null || _b === void 0 ? void 0 : _b.addFeatures(polygonFeatures);
        select.setActive(false);
        setStatus(Status.EDIT_GEOMETRY);
        setEditionDrawMode();
    };
    var editMetadata = function () {
        setStatus(Status.EDIT_METADATA);
        _setSelectedFeatureAsEditNft();
    };
    var accept = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (status === Status.CREATE) {
                        try {
                            _createNft();
                        }
                        catch (error) {
                            console.error(error);
                            alert("Could not create GeoNFT");
                        }
                    }
                    if (!(status === Status.EDIT_GEOMETRY)) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, _updateNftGeometry()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error(error_1);
                    alert("Could not modify GeoNFT geometry");
                    return [3 /*break*/, 4];
                case 4:
                    setStatus(Status.IDLE);
                    return [2 /*return*/];
            }
        });
    }); };
    var cancel = function () {
        if (confirm("Are you sure you want to cancel?")) {
            _resetEdition();
            setStatus(Status.IDLE);
        }
    };
    var setEditionDrawMode = function () {
        setEditionStatus(EditionStatus.DRAW);
        modify.setActive(false);
        draw.setActive(true);
    };
    var setEditionModifyMode = function () {
        setEditionStatus(EditionStatus.MODIFY);
        modify.setActive(true);
        draw.setActive(false);
    };
    var setEditionDeleteMode = function () {
        setEditionStatus(EditionStatus.DELETE);
        modify.setActive(false);
        draw.setActive(false);
    };
    // PRIVATE FUNCTIONS
    var _createNft = function () {
        var _a;
        var createdFeaturesPolygon = (_a = _getEditLayer().getSource()) === null || _a === void 0 ? void 0 : _a.getFeatures();
        if (!createdFeaturesPolygon || createdFeaturesPolygon.length === 0) {
            throw new Error("Geometry cannot be empty");
        }
        var createdFeatureMultiPolygon = _convertPolygonFeaturesToMultiPolygonFeature(createdFeaturesPolygon);
        var geojson = new GeoJSON().writeFeature(createdFeatureMultiPolygon);
        setMetadata(undefined);
        setGeojson(geojson);
        setFormIsOpen(true);
    };
    var _onFormSubmit = function () {
        var _a, _b;
        var createdFeaturesPolygon = (_a = _getEditLayer().getSource()) === null || _a === void 0 ? void 0 : _a.getFeatures();
        if (!createdFeaturesPolygon || createdFeaturesPolygon.length === 0) {
            console.log("INSIDE ERROR");
            throw new Error("Geometry cannot be empty");
        }
        var createdFeatureMultiPolygon = _convertPolygonFeaturesToMultiPolygonFeature(createdFeaturesPolygon);
        (_b = geoNftsLayer.getSource()) === null || _b === void 0 ? void 0 : _b.addFeature(createdFeatureMultiPolygon);
        _resetEdition();
    };
    var _updateNftGeometry = function () { return __awaiter(void 0, void 0, void 0, function () {
        var modifiedFeaturesPolygon, modifiedFeatureMultiPolygon, nftId, newGeojson, success;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedFeature) {
                        throw new Error("No feature selected");
                    }
                    modifiedFeaturesPolygon = (_a = _getEditLayer().getSource()) === null || _a === void 0 ? void 0 : _a.getFeatures();
                    if (!modifiedFeaturesPolygon) {
                        throw new Error("Geometry cannot be empty");
                    }
                    modifiedFeatureMultiPolygon = _convertPolygonFeaturesToMultiPolygonFeature(modifiedFeaturesPolygon);
                    nftId = selectedFeature.getId();
                    newGeojson = new GeoJSON().writeFeature(modifiedFeatureMultiPolygon);
                    return [4 /*yield*/, nftsStore.updateNftGeojson(nftId, newGeojson)];
                case 1:
                    success = _c.sent();
                    if (success) {
                        (_b = geoNftsLayer.getSource()) === null || _b === void 0 ? void 0 : _b.addFeature(modifiedFeatureMultiPolygon);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var _editNftMetadata = function () {
        var editNft = nftsStore.editNft;
        if (!editNft) {
            return;
        }
        setMetadata(editNft.metadata);
        setGeojson(editNft.geojson);
        setFormIsOpen(true);
    };
    var _setSelectedFeatureAsEditNft = function () {
        var selectedFeature = select.getFeatures().getArray()[0];
        if (!selectedFeature) {
            return;
        }
        var nftId = selectedFeature.getId();
        if (!nftId && nftId !== 0) {
            throw new Error("NFT ID is not defined");
        }
        var editNft = nfts.find(function (nft) { return nft.id === nftId; });
        if (!editNft) {
            throw new Error("NFT not found");
        }
        nftsStore.editNft = editNft;
    };
    var _deleteClickedFeature = function (map, e) {
        if (!map || !isDeleteFeatureActive)
            return;
        var editLayerSource = editLayer.getSource();
        if (!editLayerSource)
            return;
        map.forEachFeatureAtPixel(e.pixel, function (feature) {
            var numberOfFeatures = editLayerSource.getFeatures().length;
            if (numberOfFeatures < 2) {
                alert("Cannot delete last feature");
                return;
            }
            editLayerSource.removeFeature(feature);
        });
    };
    var _convertPolygonFeaturesToMultiPolygonFeature = function (features) {
        var multiPolygonCoordinatesArray = features.map(function (feature) {
            var geometry = feature.getGeometry() || new Polygon([]);
            return geometry.getCoordinates();
        });
        var multiPolygonFeature = new Feature({
            geometry: new MultiPolygon(multiPolygonCoordinatesArray),
        });
        return multiPolygonFeature;
    };
    var _convertMultiPolygonFeatureToPolygonFeatures = function (feature) {
        var multiPolygonGeometry = feature.getGeometry();
        var polygonCoordinatesArray = multiPolygonGeometry.getCoordinates();
        var polygonFeatures = polygonCoordinatesArray.map(function (polygonCoordinates) {
            return new Feature({
                geometry: new Polygon(polygonCoordinates),
            });
        });
        return polygonFeatures;
    };
    var _getEditLayer = function () {
        return editLayer;
    };
    var _resetEdition = function () {
        var editLayerSource = _getEditLayer().getSource();
        select.getFeatures().clear();
        select.setActive(true);
        draw.setActive(false);
        modify.setActive(false);
        editLayerSource === null || editLayerSource === void 0 ? void 0 : editLayerSource.clear();
        setSelectedFeature(undefined);
    };
    return (_jsxs(Box, __assign({ position: "relative" }, { children: [_jsx(Box, __assign({ id: "map", width: "100%", height: "400px" }, { children: nftsStore.isBusyFetching && _jsx(NFTsLoaderDisplay, {}) })), _jsxs(Box, __assign({ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 2, padding: 1, borderRadius: 1, bgcolor: "#00000052" }, { children: [_jsx(Button, __assign({ variant: "contained", onClick: createNft, disabled: status === Status.CREATE || status === Status.EDIT_GEOMETRY }, { children: "Create NFT" })), _jsx(Button, __assign({ variant: "contained", onClick: editGeometry, disabled: status === Status.CREATE ||
                            status === Status.EDIT_GEOMETRY ||
                            !selectedFeature }, { children: "Edit geometry" })), _jsx(Button, __assign({ variant: "contained", onClick: editMetadata, disabled: status === Status.CREATE ||
                            status === Status.EDIT_GEOMETRY ||
                            !selectedFeature }, { children: "Edit metadata" })), _jsx(Button, __assign({ variant: "contained", color: "secondary", onClick: accept, disabled: !(status === Status.CREATE || status === Status.EDIT_GEOMETRY) }, { children: "Accept" })), _jsx(Button, __assign({ variant: "contained", color: "error", onClick: cancel }, { children: "Cancel" }))] })), _jsxs(Box, __assign({ position: "absolute", bottom: 8, left: 8, display: status === Status.EDIT_GEOMETRY ? "flex" : "none", padding: 1, borderRadius: 1, bgcolor: "#000000d4" }, { children: [_jsx(Button, __assign({ color: "info", onClick: setEditionDrawMode, disabled: editionStatus === EditionStatus.DRAW }, { children: "Draw" })), _jsx(Button, __assign({ color: "warning", onClick: setEditionModifyMode, disabled: editionStatus === EditionStatus.MODIFY }, { children: "Modify" })), _jsx(Button, __assign({ color: "error", onClick: setEditionDeleteMode, disabled: editionStatus === EditionStatus.DELETE }, { children: "Delete" }))] })), _jsx(NFTForm, { open: formIsOpen, metadata: metadata, geojson: geojson, onAccept: _onFormSubmit, closeForm: function () { return setFormIsOpen(false); } })] })));
});
var NFTsLoaderDisplay = function () { return (_jsxs(Box, __assign({ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", bgcolor: "rgba(0, 0, 0, 0.5)", zIndex: 9999 }, { children: [_jsx(Typography, __assign({ variant: "h5", color: "white" }, { children: "Fetching NFTs..." })), _jsx(Box, __assign({ mt: 2, color: "white" }, { children: _jsx(CircularProgress, { color: "inherit" }) }))] }))); };
export default MapWrapper;
