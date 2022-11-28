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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { observer } from "mobx-react-lite";
import { Box } from "@mui/system";
import { Typography, Button, List, ListItem, ListItemText, CircularProgress, } from "@mui/material";
import { nftsStore } from "../features/nfts/nftsStore";
export var NFTsList = observer(function () {
    var nfts = nftsStore.nfts;
    var renderContent = function () {
        if (nftsStore.isBusyFetching) {
            return _jsx(NFTsLoaderDisplay, {});
        }
        if (nfts.length === 0) {
            return _jsx(NoNFTsFound, {});
        }
        return _jsx(NFTs, { nfts: nfts, editMetadata: editMetadata });
    };
    var editMetadata = function (nftId) {
        var editNft = nfts.find(function (nft) { return nft.id === nftId; });
        if (editNft) {
            nftsStore.editNft = editNft;
        }
    };
    return (_jsxs(Box, __assign({ border: 1, borderColor: "white", borderRadius: 2, p: 4 }, { children: [_jsx(Typography, __assign({ variant: "h5", gutterBottom: true }, { children: "NFTs" })), renderContent()] })));
});
var NFTs = function (_a) {
    var nfts = _a.nfts, editMetadata = _a.editMetadata;
    return (_jsx(List, { children: nfts.map(function (nft) { return (_jsxs(ListItem, __assign({ style: { paddingLeft: 0 }, divider: true }, { children: [_jsx(ListItemText, { primary: nft.metadata.name || "Not defined", secondary: _jsxs(_Fragment, { children: ["ID: ", nft.id, _jsx("br", {}), nft.metadata.description || "Not defined"] }) }), _jsx(Button, __assign({ variant: "contained", onClick: function () { return editMetadata(nft.id); } }, { children: "Edit metadata" }))] }), nft.id)); }) }));
};
var NFTsLoaderDisplay = function () { return (_jsxs(Box, __assign({ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }, { children: [_jsx(Typography, __assign({ variant: "h5", color: "white" }, { children: "Fetching NFTs..." })), _jsx(Box, __assign({ mt: 2, color: "white" }, { children: _jsx(CircularProgress, { color: "inherit" }) }))] }))); };
var NoNFTsFound = function () { return (_jsx(Typography, __assign({ textAlign: "center" }, { children: "No NFTs found" }))); };
