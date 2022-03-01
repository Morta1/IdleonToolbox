import styled from 'styled-components'
import { capitalize, Collapse, Drawer, List, ListItem, ListItemText, Toolbar } from "@material-ui/core";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import { breakpoint, prefix, screens } from "../../../Utilities";
import React, { useContext, useState } from "react";
import { AppContext } from "../context";
import { cauldrons, stamps } from "../../General/calculationHelper";
import Navigation from "../Navigation";
import useMediaQuery from "../useMediaQuery";

const nestedOptionPadding = 35;

const AccountDrawer = () => {
  const {
    userData,
    display,
    accountDisplay,
    setUserAccountDisplay
  } = useContext(AppContext);
  const matches = useMediaQuery(breakpoint);
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
        shouldDisplay={userData && display?.view === screens.account}
        anchor={'left'} variant={'permanent'}>
        <Navigation/>
        <Toolbar/>
        {matches && <Toolbar/>}
        {userData && display?.view === screens.account ? <>
          <List>
            <ListItem button selected={selected?.view === 'general'} onClick={() => handleClick('general')}>
              <img className={'list-img'} width={32} src={`${prefix}data/ClassIcons1.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'General'}/>
            </ListItem>
            <ListItem button selected={selected?.view === 'looty'} onClick={() => handleClick('looty')}>
              <img className={'list-img'} width={32} src={`${prefix}data/UISkillIcon305.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={`Looty (Missing ${userData?.account?.missingLootyItems.length})`}/>
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
            <ListItem selected={selected?.view === 'construction'} button onClick={() => handleClick('construction', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/ClassIcons49.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Construction'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'forge'} button onClick={() => handleClick('forge', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/ForgeD.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Forge'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'deathNote'} button onClick={() => handleClick('deathNote', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/ConTower2.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Death Note'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'saltLick'} button onClick={() => handleClick('saltLick', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/ConTower3.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Salt Lick'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'refinery'} button onClick={() => handleClick('refinery', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/TaskSc6.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Refinery'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'constellations'} button
                      onClick={() => handleClick('constellations', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/StarTitle1.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Constellations'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'bribes'} button onClick={() => handleClick('bribes', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/BribeW.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Bribes'}/>
            </ListItem>
            <ListItem selected={selected?.view === 'bundles'} button onClick={() => handleClick('bundles', '')}>
              <img className={'list-img'} width={32} src={`${prefix}data/TaskSa4.png`} alt=""/>
              <ListItemText
                style={{ marginLeft: 10 }}
                primary={'Gem Shop Bundles'} secondary={'If you\'re brave enough'}/>
            </ListItem>
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

  .sub-title {
    font-size: 12px;
    display: block;
    flex-basis: 100%;
  }
`;

export default AccountDrawer;
