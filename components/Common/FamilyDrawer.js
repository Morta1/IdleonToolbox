import styled from 'styled-components'
import AppBar from "@material-ui/core/AppBar";
import NavBar from "../NavBar";
import { Chip, Collapse, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar } from "@material-ui/core";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import { extVersion, prefix, screens } from "../../Utilities";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context";
import ViewModuleIcon from "@material-ui/icons/ViewModule";

const nestedOptionPadding = 35;

const FamilyDrawer = () => {
  const {
    userData,
    display,
    dataFilters,
    setUserDataFilters,
    displayedCharactersIndices,
    setUserDisplayedCharactersIndices,
    lastUpdated
  } = useContext(AppContext);
  const [open, setOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [viewAll, setViewAll] = useState(!Object.values(displayedCharactersIndices).every((value) => value));

  const handleClick = () => {
    setOpen(!open);
  };

  const handleFiltersClick = () => {
    setFiltersOpen(!filtersOpen);
  };

  const onChipClick = (clickedIndex) => {
    const updatedArr = dataFilters?.map((field, index) => index === clickedIndex ? {
      ...field,
      selected: !field.selected
    } : field);
    setUserDataFilters(updatedArr);
  }

  useEffect(() => {
    if (Object.values(displayedCharactersIndices).every((value) => value)) {
      setViewAll(false);
    } else {
      setViewAll(true);
    }
  }, [displayedCharactersIndices]);


  const handleCharacterClick = (index) => {
    if (index === 'all') {
      const allIndices = Object.keys(userData?.characters).reduce((res, charIndex) => ({
        ...res,
        [charIndex]: viewAll ? true : charIndex === '0'
      }), {});
      setUserDisplayedCharactersIndices(allIndices);
      setViewAll(!viewAll);
    } else {
      setUserDisplayedCharactersIndices({ ...displayedCharactersIndices, [index]: !displayedCharactersIndices[index] });
    }
  }

  return (
    <FamilyDrawerStyle>
      <StyledDrawer isCharacterDisplay={userData && display?.view === screens.characters && userData?.version === extVersion}
                    anchor={'left'} variant={'permanent'}>
        <AppBar position={"fixed"}>
          <NavBar/>
        </AppBar>
        <Toolbar/>
        {userData && display?.view === 0 && userData?.version === extVersion ? <>
          <List>
            <ListItem button onClick={handleClick}>
              <ListItemText
                primary={`Characters (Lv. ${userData?.characters?.reduce((totalLv, { level }) => totalLv + level, 0)})`}/>
              {open ? <ExpandLess/> : <ExpandMore/>}
            </ListItem>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItem key={'View-All'}
                          onClick={() => handleCharacterClick('all')}
                          button
                          style={{ paddingLeft: nestedOptionPadding }}>
                  <ListItemIcon>
                    <ViewModuleIcon/>
                  </ListItemIcon>
                  <ListItemText primary={viewAll ? 'View All' : 'View Less'}/>
                </ListItem>
                {userData?.characters?.map(({ name, class: charClassName, level }, charIndex) => {
                  return <ListItem
                    dense
                    onClick={() => handleCharacterClick(charIndex)}
                    selected={displayedCharactersIndices[charIndex]}
                    key={name + charIndex} button
                    style={{ paddingLeft: nestedOptionPadding }}>
                    <ListItemIcon>
                      <img src={`${prefix}icons/${charClassName}_Icon.png`} alt=""/>
                    </ListItemIcon>
                    <ListItemText primary={name}/>
                  </ListItem>;
                })}
              </List>
            </Collapse>
            <ListItem button onClick={handleFiltersClick}>
              <ListItemText primary="Filters"/>
              {filtersOpen ? <ExpandLess/> : <ExpandMore/>}
            </ListItem>
            <Collapse in={filtersOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding className={'chips'}>
                {dataFilters?.map(({ name, selected }, index) => {
                  return <StyledChip
                    key={name + "" + index}
                    size="small"
                    clickable
                    color={selected ? 'primary' : 'default'}
                    variant={selected ? 'default' : 'outlined'}
                    label={name}
                    onClick={() => onChipClick(index)}
                  />;
                })}
              </List>
            </Collapse>
          </List>
          <List style={{ marginTop: 'auto' }}>
            <ListItem>
              <ListItemText>
                Last Updated <div>{lastUpdated}</div>
              </ListItemText>
            </ListItem>
          </List>
        </> : null}
      </StyledDrawer>
    </FamilyDrawerStyle>
  );
};

const FamilyDrawerStyle = styled.div`
  .chips {
    margin-top: 10px;
    display: flex;
    padding-left: 10px;
    gap: 10px;
    flex-wrap: wrap;
    @media (max-width: 1041px) {
      margin-top: 15px;
    }
  }
`;

const StyledChip = styled(Chip)`
  && {
    height: 24px;
  }
`

const StyledDrawer = styled(({ isCharacterDisplay, ...other }) => (
  <Drawer {...other}/>
))`
  && {
    display: flex;
  }

  & .MuiPaper-root.MuiDrawer-paper {
    background-color: #393e46;
    ${({ isCharacterDisplay }) => isCharacterDisplay ? `
      max-width: 230px;
      min-width: 230px;
      height: 100%;
    ` : ''}
    width: 0;
    flex-shrink: 0;
  }
`;

export default FamilyDrawer;
