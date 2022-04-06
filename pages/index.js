import React, { useContext } from "react";
import styled from "styled-components";
import CharacterWrapper from "../components/CharacterWrapper";
import ItemBrowser from "../components/ItemBrowser";
import CraftIt from "../components/CraftIt/CraftIt";
import { AppContext } from '../components/Common/context';
import { Toolbar } from "@material-ui/core";
import CharactersDrawer from "../components/Common/Drawers/CharactersDrawer";
import { breakpoint, screensMap } from "../Utilities";
import Head from 'next/head'
import Account from "../components/Account";
import CardSearch from "../components/CardSearch";
import useMediaQuery from "../components/Common/useMediaQuery";
import ActiveXpCalculator from "../components/General/ActiveXpCalculator";
import Todo from "../components/Todo";
import HomePage from "../components/HomePage";
import Navigation from "../components/Common/Navigation";
import DropList from "../components/DropList";
import { monsterDrops } from '../data/website-data';

const Index = () => {
  const { userData, display, lastUpdated } = useContext(AppContext);
  const matches = useMediaQuery(breakpoint);

  return (
    <>
      <Head>
        <title>Idleon Toolbox - Family Progression</title>
      </Head>
      <Navigation source={'main'}/>
      {matches && <Toolbar/>}
      <CharactersDrawer/>
      <FamilyWrapper
        isCharacterDisplay={userData && display?.view === screensMap.characters}>
        <Toolbar/>
        <Main>
          {!userData ? <HomePage/> :
            <>
              {display?.view === screensMap.homePage ? <HomePage/> : null}
              {display?.view === screensMap.characters ?
                <CharacterWrapper lab={userData?.account?.lab} characters={userData?.characters}/> : null}
              {display?.view === screensMap.account ? <Account/> : null}
              {display?.view === screensMap.craftIt ? <CraftIt userData={userData}/> : null}
              {display?.view === screensMap.itemBrowser ? <ItemBrowser userData={userData}/> : null}
              {display?.view === screensMap.cardSearch ? <CardSearch userData={userData}/> : null}
              {display?.view === screensMap.activeExpCalculator ? <ActiveXpCalculator userData={userData}/> : null}
              {display?.view === screensMap.dropList ? <DropList dropList={monsterDrops}/> : null}
              {display?.view === screensMap.itemPlanner ?
                <Todo lastUpdated={lastUpdated} userData={userData}/> : null}
            </>}
        </Main>
      </FamilyWrapper>
    </>
  );
};

const FamilyWrapper = styled.div`
  flex-grow: 1;
  ${({ isCharacterDisplay }) => isCharacterDisplay ? 'padding-left: 240px;' : ''}
`;

const Main = styled.main`
  color: white;
`;
export default Index;