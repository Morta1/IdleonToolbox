import AppBar from "@material-ui/core/AppBar";
import { StyledTabs } from "./common-styles";
import Tab from "@material-ui/core/Tab";
import { IconButton } from "@material-ui/core";
import DashboardIcon from "@material-ui/icons/Dashboard";
import ViewListIcon from "@material-ui/icons/ViewList";
import Character from "./Character";
import { prefix } from "../Utilities";
import { useEffect, useState } from "react";
import styled from 'styled-components';

const CharacterWrapper = ({ characters }) => {
  const [view, setView] = useState();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const displayObj = JSON.parse(localStorage.getItem('display'));
    setView(displayObj && displayObj.subView ? displayObj : { view: 1, subView: 'dashboard' });
  }, [])

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const changeView = (newView) => {
    const displayObj = { view: 1, subView: newView };
    localStorage.setItem('display', JSON.stringify(displayObj));
    setView(displayObj);
  };

  return <CharacterWrapperStyle>
    <div className={'view-icons'}>
      <IconButton onClick={() => changeView('dashboard')} aria-label={'dashboard-view'} title={'dashboard-view'}>
        <DashboardIcon/>
      </IconButton>
      <IconButton onClick={() => changeView('list')} aria-label={'list-view'} title={'list-view'}>
        <ViewListIcon/>
      </IconButton>
    </div>
    {view?.subView === 'list' ? <div className="characters list">
      {characters?.map((characterData, tabPanelIndex) => {
        return <Character {...characterData} key={tabPanelIndex}/>;
      })}
    </div> : null}
    {view?.subView === 'dashboard' ? characters ? <>
      <AppBar position="static">
        <StyledTabs scrollButtons="auto"
                    variant="scrollable"
                    value={value} onChange={handleChange}>
          {characters?.map(({ name, class: charClassName }, charIndex) => {
            return <Tab key={name + charIndex} label={<div className={'tab-name'}>
              <img src={`${prefix}icons/${charClassName}_Icon.png`} alt=""/>
              {name}
            </div>}/>;
          })}
        </StyledTabs>
      </AppBar>
      <div className="characters dashboard">
        {characters?.map((characterData, tabPanelIndex) => {
          return tabPanelIndex === value ? <Character {...characterData} key={tabPanelIndex}/> : null;
        })}
      </div>
    </> : null : null}
  </CharacterWrapperStyle>
}

const CharacterWrapperStyle = styled.div`
  position: relative;
  margin-top: 15px;

  .view-icons {
    position: absolute;
    right: 0;
    top: -45px;
  }

  .tab-name {
    display: flex;
    align-items: center;
  }

  .characters {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(580px, 1fr));
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
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

export default CharacterWrapper;