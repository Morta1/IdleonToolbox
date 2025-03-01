import { createTheme } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material';

let darkTheme = createTheme({
  palette: {
    mode: 'dark',
    multi: '#2087e8',
    multiLight: '#94baee',
    background: {
      default: '#141A21',
      paper: '#141A21'
    }
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: 14
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          height: 32,
          textTransform: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#1C252E'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#1C252E',
          borderRadius: '8px'
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          background: '#1C252E',
          borderRadius: '8px'
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          background: '#1C252E',
        }
      }
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          background: '#141A21',
          borderRadius: '4px',
          border: '1px solid #424242'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': { padding: 16 },
          borderRadius: '8px'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: '#c9c9c9',
          boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 3px 0px, rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px',
          border: '1px solid #424242',
          background: '#1C252E',
          padding: 8
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#141A21',
          borderBottom: '1px solid #2f3641'
        }
      }
    }
  }
});

darkTheme = responsiveFontSizes(darkTheme, { factor: 2.5 });

export default darkTheme;
