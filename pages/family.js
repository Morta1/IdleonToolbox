import { useEffect, useState } from "react";
import styled from "styled-components";
import NavBar from "../components/NavBar";
import { Wrapper } from "../components/common-styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Character from '../components/Character';
import { prefix } from "../Utilities";
import JsonImport from "../components/JsonImport";
import Info from "../components/InfoTooltip";
import InfoIcon from "@material-ui/icons/Info";
import ViewListIcon from '@material-ui/icons/ViewList';
import DashboardIcon from '@material-ui/icons/Dashboard';
import { IconButton } from "@material-ui/core";

const Family = () => {
  const [userData, setUserData] = useState(null);
  const [value, setValue] = useState(0);
  const [view, setView] = useState();

  useEffect(() => {
    const temp = localStorage.getItem('view');
    console.log(temp);
    setView(temp);
    if (!userData) {
      try {
        const data = localStorage.getItem('characterData');
        const parsed = JSON.parse(data);
        console.log(parsed);
        setUserData(parsed);
      } catch (e) {
        console.log('Failed to import family data from localStorage');
      }
    }
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleImport = (json) => {
    setUserData(json);
    localStorage.setItem('characterData', JSON.stringify(json));
  };

  const changeView = (newView) => {
    localStorage.setItem('view', newView);
    setView(newView);
  };

  return (
    <Wrapper>
      <NavBar/>
      <Main view={view}>
        <h1>Family <JsonImport handleImport={handleImport}/></h1>
        <div className={'view-icons'}>
          <IconButton onClick={() => changeView('dashboard')} aria-label={'dashboard-view'} title={'dashboard-view'}>
            <DashboardIcon/>
          </IconButton>
          <IconButton onClick={() => changeView('list')} aria-label={'list-view'} title={'list-view'}>
            <ViewListIcon/>
          </IconButton>
        </div>
        {view === 'list' ? <div className="characters">
          {userData?.characters?.map((characterData, tabPanelIndex) => {
            return <Character {...characterData} key={tabPanelIndex}/>;
          })}
        </div> : null}
        {view === 'dashboard' ? userData ? <>
          <AppBar position="static">
            <StyledTabs scrollButtons="auto"
                        variant="scrollable"
                        value={value} onChange={handleChange}>
              {userData?.characters?.map(({ name, class: charClassName }, charIndex) => {
                return <Tab key={name + charIndex} label={<div className={'tab-name'}>
                  <img src={`${prefix}/icons/${charClassName}_icon.png`} alt=""/>
                  {name}
                </div>}/>;
              })}
            </StyledTabs>
          </AppBar>
          <div className="characters">
            {userData?.characters?.map((characterData, tabPanelIndex) => {
              return tabPanelIndex === value ? <Character {...characterData} key={tabPanelIndex}/> : null;
            })}
          </div>
        </> : <div className={'missing-json'}>
          <div className={'missing-text'}>
            <span>Please load your family JSON</span>
            <Info>
              <InfoIcon style={{ marginLeft: 10 }}/>
            </Info></div>

          <img src={`${prefix}/etc/Dr_Defecaus_Walking.gif`} alt=""/>
        </div> : null}

      </Main>
    </Wrapper>
  );
};

const Main = styled.main`
  color: white;

  h1 {
    color: white;
    padding: 10px;
    display: grid;
    grid-template-columns: 135px 135px;
  }

  .view-icons {
    display: flex;
    justify-content: flex-end;
  }

  .tab-name {
    display: flex;
    align-items: center;
  }

  .characters {
    display: grid;
    grid-template-columns: ${({ view }) => view === 'dashboard' ? 'max-content' : '1fr 1fr 1fr'};
    place-content: center;

    @media (max-width: 1919px) {
      grid-template-columns: ${({ view }) => view === 'dashboard' ? 'max-content' : '1fr 1fr'};
    }

    @media (max-width: 1200px) {
      grid-template-columns: ${({ view }) => view === 'dashboard' ? 'max-content' : 'none'};
    }

    @media (max-width: 750px) {
      grid-template-columns: none;
    }
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

const StyledTabs = styled(Tabs)`
  && {
    background-color: #545456;
  }

  & .MuiTabs-indicator {
    background-color: #50ff00;
  }
`;
export default Family;
