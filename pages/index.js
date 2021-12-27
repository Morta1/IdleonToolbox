import React, { useContext } from "react";
import styled from "styled-components";
import CharacterWrapper from "../components/CharacterWrapper";
import ItemBrowser from "../components/ItemBrowser";
import CraftIt from "../components/CraftIt/CraftIt";
import { AppContext } from '../components/Common/context';
import MissingData from "../components/General/MissingData";
import { Toolbar } from "@material-ui/core";
import CharactersDrawer from "../components/Common/Drawers/CharactersDrawer";
import { breakpoint, screens } from "../Utilities";
import Head from 'next/head'
import ShopStock from "../components/ShopStock";
import Account from "../components/Account";
import Quests from "../components/Quests/Quests";
import Achievements from "../components/Achievements";
import CardSearch from "../components/CardSearch";
import useMediaQuery from "../components/Common/useMediaQuery";
import ActiveXpCalculator from "../components/General/ActiveXpCalculator";
import Todo from "../components/Todo";

const Index = () => {
  const { userData, display } = useContext(AppContext);
  const matches = useMediaQuery(breakpoint);
  return (
    <>
      <Head>
        <title>Idleon Toolbox - Family Progression</title>
      </Head>
      <CharactersDrawer/>
      <FamilyWrapper
        isCharacterDisplay={userData && display?.view === screens.characters}>
        <Toolbar/>
        {matches && <Toolbar/>}
        <Main>
          {!userData ? <MissingData/> :
              <>
                {display?.view === screens.characters ? <CharacterWrapper characters={userData?.characters}/> : null}
                {display?.view === screens.account ? <Account/> : null}
                {display?.view === screens.craftIt ? <CraftIt userData={userData}/> : null}
                {display?.view === screens.itemBrowser ? <ItemBrowser userData={userData}/> : null}
                {display?.view === screens.achievements ? <Achievements userData={userData}/> : null}
                {display?.view === screens.shopStock ? <ShopStock stock={userData?.account?.shopStock}/> : null}
                {display?.view === screens.quests ?
                  <Quests characters={userData?.characters} quests={userData?.account?.quests}/> : null}
                {display?.view === screens.cardSearch ? <CardSearch userData={userData}/> : null}
                {display?.view === screens.activeExpCalculator ? <ActiveXpCalculator userData={userData}/> : null}
                {display?.view === screens.itemPlanner ? <Todo userData={userData}/> : null}
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