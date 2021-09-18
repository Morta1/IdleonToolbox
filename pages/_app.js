import { createGlobalStyle, ThemeProvider } from "styled-components";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import Head from 'next/head'
import '../polyfills';
import { useEffect, useState } from "react";
import { AppContext } from '../components/context';
import { fields } from "../Utilities";
import { CircularProgress } from "@material-ui/core";

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'JetBrains Mono', monospace;
    background-color: #222831;
    width: 100%;
  }
`;

const theme = {};

const muiTheme = createTheme({
  palette: {
    type: "dark",
  },
});

const initialDisplay = { view: 0, subView: '' };

export default function App({ Component, pageProps }) {
  const [initialData, setData] = useState(null);
  const [dataFilters, setDataFilters] = useState();
  const [display, setDisplay] = useState();
  const [displayedCharactersIndices, setDisplayedCharactersIndices] = useState();
  const [loader, setLoader] = useState(true);
  const [lastUpdated, setLastUpdated] = useState();

  useEffect(() => {
    try {
      const charData = localStorage.getItem('characterData');
      if (charData) {
        const parsedData = JSON.parse(localStorage.getItem('characterData'));
        setData(parsedData);
      }

      const characterIndices = JSON.parse(localStorage.getItem('characterIndices'));
      setDisplayedCharactersIndices(characterIndices ? characterIndices : { 0: true, 1: false });

      // set filters for characters` view
      const fieldsObj = JSON.parse(localStorage.getItem('dataFilters'));
      setDataFilters(fieldsObj ? fieldsObj : fields);

      const userLastUpdated = JSON.parse(localStorage.getItem('lastUpdated'));
      setLastUpdated(userLastUpdated);

      const displayObj = JSON.parse(localStorage.getItem('display')) || initialDisplay;
      setDisplay(displayObj);

      setLoader(false);
    } catch (e) {
      console.log('Error during app init data parsing');
      setLoader(false);
    }
  }, []);

  const setUserData = (userData) => {
    setData(userData);
    localStorage.setItem('characterData', JSON.stringify(userData));
  }

  const setUserDisplay = (newTabIndex) => {
    const storageObj = JSON.parse(localStorage.getItem('display'));
    let displayObj;
    if (storageObj) {
      displayObj = { ...storageObj, view: newTabIndex };
    } else {
      displayObj = { view: newTabIndex, subView: '' };
    }
    localStorage.setItem('display', JSON.stringify(displayObj));
    setDisplay(displayObj);
  }

  const setUserDataFilters = (userDataFilters) => {
    localStorage.setItem('dataFilters', JSON.stringify(userDataFilters));
    setDataFilters(userDataFilters);
  }

  const setUserDisplayedCharactersIndices = (userCharacterIndices) => {
    localStorage.setItem('characterIndices', JSON.stringify(userCharacterIndices));
    setDisplayedCharactersIndices(userCharacterIndices);
  }

  const setUserLastUpdated = (userLastUpdate) => {
    localStorage.setItem('lastUpdated', JSON.stringify(userLastUpdate));
    setLastUpdated(userLastUpdate);
  }

  return (
    <>
      <Head>
        <title>Idleon Toolbox</title>
        <meta
          name="description"
          content="Follow your Legends of Idleon progression with ease with the help of account and characters' overview, craft calculator and more!"
        />
        <meta name="keywords" content="Legends of Idleon, account, characters, craft calculator"/>
      </Head>
      <GlobalStyle/>
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={theme}>
          <AppContext.Provider value={{
            userData: initialData, setUserData,
            dataFilters, setUserDataFilters,
            display, setUserDisplay,
            displayedCharactersIndices, setUserDisplayedCharactersIndices,
            lastUpdated, setUserLastUpdated
          }}>
            {loader ? <div style={{ textAlign: 'center', margin: 55 }}>
                <CircularProgress size={60} style={{ color: 'white' }}/>
              </div>
              : <Component {...pageProps} />}
          </AppContext.Provider>
        </ThemeProvider>
      </MuiThemeProvider>
    </>
  );
}

