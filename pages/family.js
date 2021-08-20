import { useEffect, useState } from "react";
import styled from "styled-components";
import NavBar from "../components/NavBar";
import { StyledTabs, Wrapper } from "../components/common-styles";
import { prefix } from "../Utilities";
import JsonImport from "../components/JsonImport";
import Info from "../components/InfoTooltip";
import InfoIcon from "@material-ui/icons/Info";
import { IconButton } from "@material-ui/core";
import Tab from "@material-ui/core/Tab";
import AppBar from "@material-ui/core/AppBar";
import CharacterWrapper from "../components/CharacterWrapper";
import AccountWrapper from "../components/AccountWrapper";
import GuildWrapper from "../components/GuildWrapper";

const Family = () => {
  const [userData, setUserData] = useState(null);
  const [display, setDisplay] = useState({
    view: 0,
    subView: '',
  });

  useEffect(() => {
    setDisplay(JSON.parse(localStorage.getItem('display')));
    if (!userData) {
      try {
        const data = localStorage.getItem('characterData');
        const parsed = JSON.parse(data);
        setUserData(parsed);
      } catch (e) {
        console.log('Failed to import family data from localStorage');
      }
    }
  }, []);

  const handleChange = (event, newTabIndex) => {
    const displayObj = { view: newTabIndex, subView: '' };
    localStorage.setItem('display', JSON.stringify((displayObj)));
    setDisplay(displayObj);
  };

  const handleImport = (json) => {
    setUserData(json);
    localStorage.setItem('characterData', JSON.stringify(json));
  };

  return (
    <Wrapper>
      <NavBar/>
      <Main>
        <h1>Idleon Progression <JsonImport handleImport={handleImport}/></h1>
        {!userData ? <div className={'missing-json'}>
          <div className={'missing-text'}>
            <span>Please load your family JSON</span>
            <Info>
              <IconButton>
                <InfoIcon/>
              </IconButton>
            </Info></div>
          <img src={`${prefix}etc/Dr_Defecaus_Walking.gif`} alt=""/>
        </div> : <div className={'tab-wrapper'}>
          <AppBar position="static" style={{ maxWidth: 550 }}>
            <StyledTabs value={display?.view} onChange={handleChange} variant="fullWidth">
              <Tab label={'Account'}/>
              <Tab label={'Characters'}/>
              <Tab label={'Guild'}/>
            </StyledTabs>
          </AppBar>
          {display?.view === 0 ? <AccountWrapper account={userData?.account}/> : null}
          {display?.view === 1 ? <CharacterWrapper characters={userData?.characters}/> : null}
          {display?.view === 2 ? <GuildWrapper guild={userData?.guild}/> : null}
        </div>}
      </Main>
    </Wrapper>
  );
};

const Main = styled.main`
  color: white;

  h1 {
    color: white;
    padding: 10px;
    display: flex;

  }


  .missing-json {
    display: grid;

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
