import { createGlobalStyle, ThemeProvider } from "styled-components";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import Head from 'next/head'
import '../polyfills';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'JetBrains Mono', monospace;
    background-color: #212121;
  }
`;

const theme = {};

const muiTheme = createTheme({
  palette: {
    type: "dark",
  },
});

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Idleon Toolbox</title>
        <meta
          name="description"
          content="Legends of Idleon - toolbox for card search and family overview"
        />
      </Head>
      <GlobalStyle/>
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
        </ThemeProvider>
      </MuiThemeProvider>
    </>
  );
}
