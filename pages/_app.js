import { createGlobalStyle, ThemeProvider } from "styled-components";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@material-ui/core/styles";
import Head from 'next/head'
import '../polyfills';
import { useEffect, useState } from "react";
import { AppContext } from '../components/Common/context';
import { extVersion, fields, screens } from "../Utilities";
import { CircularProgress } from "@material-ui/core";
import { useRouter } from "next/router";
import demo from '../data/demo.json';
import ErrorBoundary from "../components/Common/ErrorBoundary";

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

const initialDisplay = { view: screens.characters, subView: '' };
const initialAccountDisplay = { view: 'general', subView: '' }
const noOverlayWorkaroundScript = `
  window.addEventListener('error', event => {
    event.stopImmediatePropagation()
  })

  window.addEventListener('unhandledrejection', event => {
    event.stopImmediatePropagation()
  })
`

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [initialData, setData] = useState(null);
  const [dataFilters, setDataFilters] = useState();
  const [display, setDisplay] = useState();
  const [displayedCharactersIndices, setDisplayedCharactersIndices] = useState();
  const [loader, setLoader] = useState(true);
  const [lastUpdated, setLastUpdated] = useState();
  const [questCharacters, setQuestCharacters] = useState([0]);
  const [accountDisplay, setAccountDisplay] = useState(initialAccountDisplay);
  const [alchemyGoals, setAlchemyGoals] = useState();
  const [stampsGoals, setStampsGoals] = useState();
  const [userTodoList, setTodoList] = useState();
  const [connected, setConnected] = useState();
  const [outdated, setOutdated] = useState();

  useEffect(() => {
    try {
      const version = localStorage.getItem('version');
      if (router?.query?.hasOwnProperty('demo')) {
        setData(demo);
        setOutdated(false);
      } else {
        const charData = localStorage.getItem('characterData');
        if (charData) {
          const parsedData = JSON.parse(localStorage.getItem('characterData'));
          console.log(version, extVersion);
          setOutdated(version !== extVersion);
          setData(parsedData);
        } else {
          setData(null);
        }
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

      const questCharactersObj = JSON.parse(localStorage.getItem('questCharacters')) || [0];
      setQuestCharacters(questCharactersObj);

      const alchemyGoals = JSON.parse(localStorage.getItem('alchemyGoals')) || null;
      setAlchemyGoals(alchemyGoals);

      const stampsGoals = JSON.parse(localStorage.getItem('stampsGoals')) || null;
      setStampsGoals(stampsGoals);

      const accountDisplay = JSON.parse(localStorage.getItem('accountDisplay')) || initialAccountDisplay;
      setAccountDisplay(accountDisplay);

      const todoListObject = JSON.parse(localStorage.getItem('todoList')) || null;
      setTodoList(todoListObject);

      setLoader(false);
    } catch (e) {
      console.log('Error during app init data parsing');
      setLoader(false);
    }
  }, [router]);

  const setUserData = (userData) => {
    setData(userData);
    setOutdated(userData?.version !== extVersion);
    localStorage.setItem('version', userData.version);
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
    console.log('userLastUpdate', userLastUpdate)
    localStorage.setItem('lastUpdated', JSON.stringify(userLastUpdate));
    setLastUpdated(userLastUpdate);
  }

  const setUserQuestCharacters = (characters) => {
    localStorage.setItem('questCharacters', JSON.stringify(characters));
    setQuestCharacters(characters);
  }

  const setUserAlchemyGoals = (cauldronName, levels) => {
    try {
      const userAlchemyGoals = JSON.parse(localStorage.getItem('alchemyGoals')) || {};
      if (userAlchemyGoals?.[cauldronName]) {
        userAlchemyGoals[cauldronName] = { ...userAlchemyGoals[cauldronName], ...levels };
      } else {
        userAlchemyGoals[cauldronName] = levels;
      }
      localStorage.setItem('alchemyGoals', JSON.stringify(userAlchemyGoals));
      setAlchemyGoals(userAlchemyGoals);
    } catch (err) {
      console.error('Error while saving user alchemy goals');
    }
  }

  const setUserStampsGoals = (categoryName, levels) => {
    try {
      const userStampsGoals = JSON.parse(localStorage.getItem('stampsGoals')) || {};
      if (userStampsGoals?.[categoryName]) {
        userStampsGoals[categoryName] = { ...userStampsGoals[categoryName], ...levels };
      } else {
        userStampsGoals[categoryName] = levels;
      }
      localStorage.setItem('stampsGoals', JSON.stringify(userStampsGoals));
      setStampsGoals(userStampsGoals);
    } catch (err) {
      console.error('Error while saving user alchemy goals');
    }
  }

  const setUserAccountDisplay = ({ view, subView }) => {
    const display = { view, subView };
    setAccountDisplay(display);
    localStorage.setItem('accountDisplay', JSON.stringify(display));
  }

  const setUserTodoList = (todoList, materialList) => {
    const list = { todoList, materialList };
    setTodoList(list);
    localStorage.setItem('todoList', JSON.stringify(list));
  }

  const setUserConnected = (isConnected) => {
    setConnected(isConnected);
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
        {process.env.NODE_ENV !== 'production' &&
        <script dangerouslySetInnerHTML={{ __html: noOverlayWorkaroundScript }}/>}
      </Head>
      <GlobalStyle/>
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={theme}>
          <ErrorBoundary>
            <AppContext.Provider value={{
              userData: initialData, setUserData,
              outdated, setOutdated,
              dataFilters, setUserDataFilters,
              display, setUserDisplay,
              displayedCharactersIndices, setUserDisplayedCharactersIndices,
              lastUpdated, setUserLastUpdated,
              questCharacters, setUserQuestCharacters,
              accountDisplay, setUserAccountDisplay,
              alchemyGoals, setUserAlchemyGoals,
              stampsGoals, setUserStampsGoals,
              userTodoList, setUserTodoList,
              connected, setUserConnected
            }}>
              {loader ? <div style={{ textAlign: 'center', margin: 55 }}>
                  <CircularProgress size={60} style={{ color: 'white' }}/>
                </div>
                : <Component {...pageProps} />}
            </AppContext.Provider></ErrorBoundary>
        </ThemeProvider>
      </MuiThemeProvider>
    </>
  );
}

