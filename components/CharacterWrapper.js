import AppBar from "@material-ui/core/AppBar";
import { StyledTabs } from "./common-styles";
import Tab from "@material-ui/core/Tab";
import { Chip, IconButton } from "@material-ui/core";
import Character from "./Character";
import { fields, prefix } from "../Utilities";
import React, { useEffect, useState } from "react";
import styled from 'styled-components';
import DashboardIcon from "@material-ui/icons/Dashboard";
import ViewListIcon from "@material-ui/icons/ViewList";

const CharacterWrapper = ({ characters }) => {
  const [view, setView] = useState();
  const [value, setValue] = useState(0);
  const [dataFilter, setDataFilter] = useState();

  useEffect(() => {
    const displayObj = JSON.parse(localStorage.getItem('display'));
    const fieldsObj = JSON.parse(localStorage.getItem('fields'));
    setDataFilter(fieldsObj ? fieldsObj : fields);
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

  const getFields = () => {
    return dataFilter?.reduce((res, field) => ({ ...res, ...(field?.selected ? { [field?.name]: true } : {}) }), {});
  }

  const onChipClick = (clickedIndex) => {
    const updatedArr = dataFilter?.map((field, index) => index === clickedIndex ? {
      ...field,
      selected: !field.selected
    } : field);
    localStorage.setItem('fields', JSON.stringify(updatedArr));
    setDataFilter(updatedArr);
  }

  return <CharacterWrapperStyle className={view?.subView}>
    <div className={'filters'}>
      {view?.subView === 'list' ? <div className="chips">
        {dataFilter?.map(({ name, selected }, index) => {
          return <Chip
            key={name + "" + index}
            className="chip"
            size="small"
            clickable
            color={selected ? 'primary' : 'default'}
            variant={selected ? 'default' : 'outlined'}
            label={name}
            onClick={() => onChipClick(index)}
          />
        })}
      </div> : null}
      <div className={'view-icons'}>
        <IconButton onClick={() => changeView('dashboard')} aria-label={'dashboard-view'} title={'dashboard-view'}>
          <DashboardIcon/>
        </IconButton>
        <IconButton onClick={() => changeView('list')} aria-label={'list-view'} title={'list-view'}>
          <ViewListIcon/>
        </IconButton>
      </div>
    </div>
    {view?.subView === 'list' ? <div className="characters">
      {characters?.map((characterData, tabPanelIndex) => {
        return <Character fields={getFields()} {...characterData} key={tabPanelIndex}/>;
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
      <div className="characters">
        {characters?.map((characterData, tabPanelIndex) => {
          return tabPanelIndex === value ?
            <Character {...characterData} key={tabPanelIndex}/> : null;
        })}
      </div>
    </> : null : null}
  </CharacterWrapperStyle>
}

const CharacterWrapperStyle = styled.div`
  position: relative;

  .filters {
    display: flex;
    justify-content: ${({ className }) => className === 'list' ? 'space-between' : 'flex-end'};

    .chips {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      @media (max-width: 1041px) {
        margin-top: 15px;
      }
    }

    .view-icons {
      display: flex;
      justify-self: flex-end;
    }
  }

  .tab-name {
    display: flex;
    align-items: center;
  }

  .characters {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
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