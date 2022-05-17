import { createTheme } from "@mui/material/styles";
import { responsiveFontSizes } from "@mui/material";

let darkTheme = createTheme({
  palette: {
    mode: "dark",
    multi: '#1073ce',
    multiLight: '#94baee',
    background: {
      default: "#222831",
      paper: "#222831"
    },
  },
  components: {
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': { padding: 16 }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          padding: 8
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "#222831"
        }
      }
    }
  }
});

darkTheme = responsiveFontSizes(darkTheme, { factor: 2.5 });

export default darkTheme;
