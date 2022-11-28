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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { observer } from "mobx-react-lite";
import { ThemeProvider } from "@mui/material/styles";
import { Container, CssBaseline, Box, Grid, Typography } from "@mui/material";
// import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import theme from "./theme";
import Wallet from "./components/Wallet";
import { walletStore, WalletStatusEnums } from "./features/wallet/walletStore";
import { NFTsList } from "./components/NFTsList";
import Map from "./components/map/Map";
// function Footer() {
//   const { status } = appStore.wallet;
//   useEffect(() => {
//     if (status === WalletStatusEnums.CONNECTED) {
//       console.log("Wallet connected");
//     }
//   }, [status]);
//   const connected = status === WalletStatusEnums.CONNECTED;
//   return (
//     <Typography
//       component={"div"}
//       variant="body2"
//       color="text.secondary"
//       align="center"
//       gutterBottom
//     >
//       <Grid container rowSpacing={1} columnSpacing={3}>
//         {!connected && (
//           <Grid item xs={12}>
//             Status: {WalletStatusEnums[status]}
//           </Grid>
//         )}
//         {/* {ceramic && (
//           <Grid item xs={12} mb={1}>
//             {ceramic.did?.id}
//           </Grid>
//         )} */}
//         {connected && (
//           <Grid
//             container
//             direction="row"
//             justifyContent="center"
//             alignItems="center"
//           >
//             <Grid item xs={1}>
//               <AccountBalanceWalletIcon />
//             </Grid>
//             {/* <Grid item xs={5}>
//               {formattedBalance} CELO
//             </Grid> */}
//             {/* <Grid item xs={5}>
//               <Button
//                 variant="contained"
//                 onClick={() => dispatch(disconnect())}
//               >
//                 Disconnect
//               </Button>
//             </Grid> */}
//           </Grid>
//         )}
//         {connected && (
//           <Grid>
//             <Grid item xs={12}>
//               {/* {address} */}
//             </Grid>
//             <Grid item xs={12}>
//               {/* Block Number: {blockNumber} */}
//             </Grid>
//           </Grid>
//         )}
//       </Grid>
//     </Typography>
//   );
// }
var App = observer(function () {
    var connected = walletStore.status === WalletStatusEnums.CONNECTED;
    return (_jsxs(ThemeProvider, __assign({ theme: theme }, { children: [_jsx(CssBaseline, {}), _jsx(Container, __assign({ maxWidth: "xl" }, { children: _jsxs(Grid, __assign({ container: true, rowSpacing: 5 }, { children: [_jsxs(Grid, __assign({ item: true, xs: 12, mt: 4 }, { children: [_jsx(Typography, __assign({ variant: "h4", component: "h1", gutterBottom: true }, { children: "Kolektivo Cura\u00E7ao GeoNFT PoC" })), _jsx(Box, __assign({ mt: 6 }, { children: _jsx(Wallet, {}) }))] })), _jsxs(Grid, __assign({ item: true, xs: 12 }, { children: [connected && (_jsxs(Box, __assign({ display: "flex", gap: 4 }, { children: [_jsx(Box, __assign({ flexGrow: 1 }, { children: _jsx(Map, {}) })), _jsx(Box, __assign({ width: "400px" }, { children: _jsx(NFTsList, {}) }))] }))), !connected && (_jsxs(Typography, __assign({ variant: "body2", component: "h2", color: "text.secondary", textAlign: "center", gutterBottom: true }, { children: ["Wallet status: ", WalletStatusEnums[walletStore.status]] })))] }))] })) }))] })));
});
export default App;
