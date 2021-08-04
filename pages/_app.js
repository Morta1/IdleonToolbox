import { createGlobalStyle, ThemeProvider } from "styled-components";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'JetBrains Mono', monospace;
    background-color: #212121;
    
  }
`;

const theme = {

};

const muiTheme = createTheme({
  palette:{
    type: 'dark'
  }
});

export default function App({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
        </ThemeProvider>
      </MuiThemeProvider>
    </>
  );
}
