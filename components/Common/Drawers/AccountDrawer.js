import styled from 'styled-components'
import AppBar from "@material-ui/core/AppBar";
import NavBar from "../../NavBar";
import { capitalize, Collapse, Drawer, List, ListItem, ListItemText, Toolbar, useMediaQuery } from "@material-ui/core";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import { extVersion, prefix, screens } from "../../../Utilities";
import React, { useContext, useState } from "react";
import { AppContext } from "../context";
import { cauldrons, stamps } from "../../General/calculationHelper";

const nestedOptionPadding = 35;

const AccountDrawer = () => {
  const {
    userData,
    display,
    accountDisplay,
    setUserAccountDisplay
  } = useContext(AppContext);
  const matches = useMediaQuery('(max-width:1260px)');
  const [bubblesOpen, setBubblesOpen] = useState(true);
  const [stampsOpen, setStampsOpen] = useState(true);
  const [selected, setSelected] = useState(accountDisplay);

  const handleClick = (view, subView) => {
    setSelected({ view, subView });
    setUserAccountDisplay({ view, subView });
  }

  return (
    <AlchemyDrawerStyle>
      <StyledDrawer
        shouldDisplay={userData && display?.view === screens.account && userData?.version === extVersion}
        anchor={'left'} variant={'permanent'}>
        <AppBar position={"fixed"}>
          <NavBar/>
        </AppBar>
        <Toolbar/>
        {matches && <Toolbar/>}
        {userData && display?.view === screens.account && userData?.version === extVersion ? <>
          <List>
            <ListItem button selected={selected?.view === 'general'} onClick={() => handleClick('general')}>
              <img className={'list-img'} width={32} src={`${prefix}data/ClassIcons1.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'General'}/>
            </ListItem>
            <ListItem button onClick={() => setStampsOpen(!stampsOpen)}>
              <img className={'list-img'} width={32} src={`${prefix}data/StampA34.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Stamps'}/>
              {stampsOpen ? <ExpandLess/> : <ExpandMore/>}
            </ListItem>
            <Collapse in={stampsOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {stamps?.map((cauldronName, index) => {
                  return <ListItem selected={selected?.view === 'stamps' && selected?.subView === stamps[index]}
                                   onClick={() => handleClick('stamps', stamps[index])}
                                   style={{ paddingLeft: nestedOptionPadding }} button
                                   key={cauldronName + index}>
                    <img className={'list-img'} width={32}
                         src={`${prefix}data/Stamp${index === 0 ? 'A' : index === 1 ? 'B' : 'C'}${1}.png`}
                         alt=""/>
                    <ListItemText style={{ marginLeft: 10 }} primary={capitalize(cauldronName)}/>
                  </ListItem>
                })}
              </List>
            </Collapse>
            <ListItem button onClick={() => setBubblesOpen(!bubblesOpen)}>
              <img className={'list-img'} width={32} src={`${prefix}data/aBrewOptionA0.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Bubbles'}/>
              {bubblesOpen ? <ExpandLess/> : <ExpandMore/>}
            </ListItem>
            <Collapse in={bubblesOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {cauldrons?.map((cauldronName, index) => {
                  return <ListItem selected={selected?.view === 'brewing' && selected?.subView === cauldrons[index]}
                                   onClick={() => handleClick('brewing', cauldrons[index])}
                                   style={{ paddingLeft: nestedOptionPadding }} button
                                   key={cauldronName + index}>
                    <img className={'list-img'} src={`${prefix}data/aBrewBarCircle${index}.png`} alt=""/>
                    <ListItemText style={{ marginLeft: 10 }} primary={capitalize(cauldronName)}/>
                  </ListItem>
                })}
              </List>
            </Collapse>
            <ListItem selected={selected?.view === 'vials'} button onClick={() => handleClick('vials', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/aVials1.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Vials'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'bribes'} button onClick={() => handleClick('bribes', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/BribeW.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Bribes'}/>
            </ListItem>
          </List>
        </> : null}
      </StyledDrawer>
    </AlchemyDrawerStyle>
  );
};

const AlchemyDrawerStyle = styled.div`
`;

const StyledDrawer = styled(({ shouldDisplay, ...other }) => (
  <Drawer {...other}/>
))`
  && {
    display: flex;
  }

  & .MuiPaper-root.MuiDrawer-paper {
    background-color: #393e46;
    ${({ shouldDisplay }) => shouldDisplay ? `
      max-width: 240px;
      min-width: 240px;
      height: 100%;
    ` : ''}
    width: 0;
    flex-shrink: 0;
  }

  .list-img {
    object-fit: contain;
  }
`;

export default AccountDrawer;
