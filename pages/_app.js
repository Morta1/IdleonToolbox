import { createGlobalStyle, ThemeProvider } from "styled-components";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import Head from 'next/head'
import '../polyfills';
import { useEffect, useState } from "react";
import { AppContext } from '../components/context';

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
  const [initialData, setData] = useState(null)
  useEffect(() => {
    try {
      const charData = localStorage.getItem('characterData');
      if (charData) {
        const parsedData = JSON.parse(localStorage.getItem('characterData'));
        setData(parsedData);
      }
    } catch (e) {
      console.log('Error during app init data parsing');
    }
  }, []);

  const setUserData = (userData) => {
    setData(userData);
    localStorage.setItem('characterData', JSON.stringify(userData));
  }

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
          <AppContext.Provider value={{ userData: initialData, setUserData }}>
            <Component {...pageProps} />
          </AppContext.Provider>
        </ThemeProvider>
      </MuiThemeProvider>
    </>
  );
}
