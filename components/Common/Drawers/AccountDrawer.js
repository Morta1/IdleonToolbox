import styled from 'styled-components'
import { Collapse, Drawer, List, ListItem, ListItemText, Toolbar, Typography } from "@material-ui/core";
import { ExpandLess, ExpandMore } from "@material-ui/icons";
import { breakpoint, prefix, screensMap } from "../../../Utilities";
import React, { useContext, useState } from "react";
import { AppContext } from "../context";
import { stamps } from "../../General/calculationHelper";
import useMediaQuery from "../useMediaQuery";

const nestedOptionPadding = 35;
const worldsData = {
  'World 1': {
    icon: 'BadgeG2',
    categories: [
      { label: 'forge', icon: 'ForgeD' },
      { label: 'bribes', icon: 'BribeW' },
      { label: 'constellations', icon: 'StarTitle1' },
      { label: 'stamps', icon: 'StampA34' },
    ]
  },
  'World 2': {
    icon: 'BadgeD2',
    categories: [
      { label: 'bubbles', icon: 'aBrewOptionA0' },
      { label: 'vials', icon: 'aVials1' },
    ]
  },
  'World 3': {
    icon: 'BadgeI2',
    categories: [
      { label: 'construction', icon: 'ClassIcons49' },
      { label: 'deathNote', icon: 'ConTower2' },
      { label: 'saltLick', icon: 'ConTower3' },
      { label: 'refinery', icon: 'TaskSc6' },
    ]
  }
}
const AccountDrawer = () => {
  const {
    userData,
    display,
    accountDisplay,
    setUserAccountDisplay
  } = useContext(AppContext);
  const matches = useMediaQuery(breakpoint);
  const [worlds, setWorlds] = useState({ 'World 1': true, 'World 2': true, 'World 3': true });
  const [selected, setSelected] = useState(accountDisplay);

  const handleClick = (view, subView) => {
    setSelected({ view, subView });
    setUserAccountDisplay({ view, subView });
  }

  return (
    <AlchemyDrawerStyle>
      <StyledDrawer
        shouldDisplay={userData && display?.view === screensMap.account}
        anchor={'left'} variant={'permanent'}>
        {/*<Navigation source={'account'}/>*/}
        <Toolbar/>
        {matches && <Toolbar/>}
        {userData && display?.view === screensMap.account ? <>
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
            {Object.entries(worldsData).map(([worldName, { icon, categories }], worldIndex) => {
              return <>
                <ListItem key={worldName + worldIndex}
                          button
                          onClick={() => setWorlds({ ...worlds, [worldName]: !worlds?.[worldName] })}>
                  <img className={'list-img'} width={32} src={`${prefix}data/${icon}.png`} alt=""/>
                  <ListItemText
                    style={{ marginLeft: 10 }}
                    primary={worldName}/>
                  {worlds?.[worldName] ? <ExpandLess/> : <ExpandMore/>}
                </ListItem>
                <Collapse in={worlds?.[worldName]} timeout="auto" unmountOnExit>
                  {categories?.map((category, categoryIndex) => {
                    return <ListItem key={category + categoryIndex} style={{ paddingLeft: nestedOptionPadding }}
                                     selected={selected?.view === category?.label} button
                                     onClick={() => handleClick(category?.label, '')}>
                      <img className={'list-img'} width={32} src={`${prefix}data/${category.icon}.png`} alt=""/>
                      <ListItemText
                        style={{ marginLeft: 10 }}
                        primary={category?.label.split(/(?=[A-Z])/).join(' ').capitalize()}/>
                    </ListItem>
                  })}
                </Collapse>
              </>
            })}
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
                <Typography style={{ fontFamily: 'JetBrains Mono' }} variant={'subtitle2'}>Buy me a coffee</Typography>
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
