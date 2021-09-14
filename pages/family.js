import { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import NavBar from "../components/NavBar";
import { StyledTabs, Wrapper } from "../components/common-styles";
import { prefix } from "../Utilities";
import Tab from "@material-ui/core/Tab";
import AppBar from "@material-ui/core/AppBar";
import CharacterWrapper from "../components/CharacterWrapper";
import AccountWrapper from "../components/AccountWrapper";
import GuildWrapper from "../components/GuildWrapper";
import ItemLocator from "../components/General/ItemLocator";
import CraftIt from "../components/General/CraftIt/CraftIt";
import { AppContext } from '../components/context';

const Family = () => {
  const { userData } = useContext(AppContext);
  const [display, setDisplay] = useState({
    view: 0,
    subView: '',
  });

  useEffect(() => {
    const displayObj = JSON.parse(localStorage.getItem('display')) || {
      view: 0,
      subView: '',
    };
    setDisplay(displayObj);
  }, []);

  const handleChange = (event, newTabIndex) => {
    const storageObj = JSON.parse(localStorage.getItem('display'));
    let displayObj;
    if (storageObj) {
      displayObj = { ...storageObj, view: newTabIndex };
    } else {
      displayObj = { view: newTabIndex, subView: '' };
    }
    localStorage.setItem('display', JSON.stringify(displayObj));
    setDisplay(displayObj);
  };

  return (
    <>
      <NavBar/>
      <Wrapper>
        <Main>
          {!userData ? <div className={'missing-json'}>
            <div className={'missing-text'}>
              <div className={'instructions'}>
                <div>1. Head over to <a href="https://github.com/Morta1/idleon-data-extractor"
                                        rel={'noreferrer'}
                                        target={'_blank'}>idleon-data-extractor</a> and download the extension.
                </div>
                <div>2. Make sure you&apos;re logged-in in <a href="https://legendsofidleon.com/"
                                                              rel={'noreferrer'}
                                                              target={'_blank'}>Legends Of Idleon</a> (This is a
                  one-time process)
                </div>
                <div>3. Click Fetch Data and wait (The process can take roughly 20-45 seconds, depends on the network)
                </div>
              </div>
            </div>
            <img src={`${prefix}etc/Dr_Defecaus_Walking.gif`} alt=""/>
          </div> : <div className={'tab-wrapper'}>
            <AppBar position="static" style={{ maxWidth: 800 }}>
              <StyledTabs value={display?.view} onChange={handleChange} variant="fullWidth">
                <Tab label={'Account'}/>
                <Tab label={'Characters'}/>
                <Tab label={'Guild'}/>
                <Tab label={'Item Locator'}/>
                <Tab label={'Craft It'}/>
              </StyledTabs>
            </AppBar>
            {display?.view === 0 ? <AccountWrapper account={userData?.account}/> : null}
            {display?.view === 1 ? <CharacterWrapper characters={userData?.characters}/> : null}
            {display?.view === 2 ? <GuildWrapper guild={userData?.guild}/> : null}
            {display?.view === 3 ? <ItemLocator userData={userData}/> : null}
            {display?.view === 4 ? <CraftIt userData={userData}/> : null}
          </div>}
        </Main>
      </Wrapper>
    </>
  );
};

const Main = styled.main`
  color: white;

  .page-header {
    display: flex;
    justify-content: center;
    //display: inline-flex;
    //flex-wrap: wrap;
    margin: 15px 0;
  }

  h1 {
    padding: 10px;
  }

  .missing-json {
    display: grid;

    .instructions {
      > div {
        margin-bottom: 5px;
      }

      a {
        color: white;

        &:visited, &:active {
          color: white;
        }
      }
    }

    .missing-text {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    > img {
      place-self: center;
    }
  }
`;
export default Family;
