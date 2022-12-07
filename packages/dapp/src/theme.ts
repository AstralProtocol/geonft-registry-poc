import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// A custom theme for this app
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
    error: {
      main: red.A400,
    },
    background: {
      default: "#222",
      paper: "#222",
    },
  },
});

theme.typography.h6 = {
  fontSize: ".7rem",
  "@media (min-width:600px)": {
    fontSize: ".7rem",
  },
};

export default theme;
