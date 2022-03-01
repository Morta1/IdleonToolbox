import styled from 'styled-components'
import { Chip, Collapse, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar } from "@material-ui/core";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import { breakpoint, prefix, screens } from "../../../Utilities";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context";
import ViewModuleIcon from "@material-ui/icons/ViewModule";
import Navigation from "../Navigation";
import useMediaQuery from "../useMediaQuery";
import { format } from "date-fns";

const nestedOptionPadding = 35;

const CharactersDrawer = () => {
  const {
    userData,
    display,
    outdated,
    dataFilters,
    setUserDataFilters,
    displayedCharactersIndices,
    setUserDisplayedCharactersIndices,
    lastUpdated
  } = useContext(AppContext);
  const matches = useMediaQuery(breakpoint);
  const [open, setOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [viewAll, setViewAll] = useState(!Object.values(displayedCharactersIndices).every((value) => value));
  const [viewAllFilter, setViewAllFilter] = useState(dataFilters?.every(({ selected }) => selected));

  const handleClick = () => {
    setOpen(!open);
  };

  const handleFiltersClick = () => {
    setFiltersOpen(!filtersOpen);
  };

  const onChipClick = (clickedIndex) => {
    let updatedArr;
    if (clickedIndex === 'all' && !viewAllFilter) {
      updatedArr = dataFilters?.map((field) => ({ ...field, selected: true }));
    } else if (clickedIndex === 'all' && viewAllFilter) {
      updatedArr = dataFilters?.map((field) => ({ ...field, selected: false }));
    } else {
      updatedArr = dataFilters?.map((field, index) => index === clickedIndex ? {
        ...field,
        selected: !field.selected
      } : field);
    }
    setViewAllFilter(!viewAllFilter);
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
    <CharactersDrawerStyle>
      <StyledDrawer
        isCharacterDisplay={userData && display?.view === screens.characters && !outdated}
        anchor={'left'} variant={'permanent'}>
        <Navigation/>
        <Toolbar/>
        {matches && <Toolbar/>}
        {userData && display?.view === screens.characters ? <>
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
              <div className={'toggle-all'}>
                <StyledChip
                  key={'view-all'}
                  size="small"
                  clickable
                  color={'default'}
                  variant={'outlined'}
                  label={'Toggle All'}
                  onClick={() => onChipClick('all')}
                />
              </div>
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
                <form action="https://www.paypal.com/donate" method="post" target="_blank">
                  <input type="hidden" name="hosted_button_id" value="V7TZB6JHTVXR4"/>
                  <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
                         name="submit" title="PayPal - The safer, easier way to pay online!"
                         alt="Donate with PayPal button"/>
                </form>
              </ListItemText>
            </ListItem>
            <ListItem>
              <ListItemText>
                Last Updated <div>{lastUpdated ? format(lastUpdated, 'dd/MM/yyyy HH:mm:ss') : ''}</div>
              </ListItemText>
            </ListItem>
          </List>
        </> : null}
      </StyledDrawer>
    </CharactersDrawerStyle>
  );
};

const CharactersDrawerStyle = styled.div`
  .toggle-all, .chips {
    display: flex;
    padding-left: 10px;
    gap: 10px;
    flex-wrap: wrap;
  }

  .chips {
    margin-top: 10px;
    @media (max-width: 1041px) {
      margin-top: 15px;
    }
  }
`;

const StyledChip = styled(Chip)`
  && {
    height: 24px;
    min-width: 60px;
    max-width: 150px;
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
      max-width: 240px;
      min-width: 240px;
      height: 100%;
    ` : ''}
    width: 0;
    flex-shrink: 0;
  }
`;

export default CharactersDrawer;
