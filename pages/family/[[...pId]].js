import React, { useContext } from "react";
import styled from "styled-components";
import CharacterWrapper from "../../components/CharacterWrapper";
import AccountWrapper from "../../components/AccountWrapper";
import GuildWrapper from "../../components/GuildWrapper";
import ItemLocator from "../../components/General/ItemLocator";
import CraftIt from "../../components/General/CraftIt/CraftIt";
import { AppContext } from '../../components/context';
import MissingData from "../../components/General/MissingData";
import OutdatedData from "../../components/General/OutdatedData";
import { Toolbar, useMediaQuery } from "@material-ui/core";
import FamilyDrawer from "../../components/Common/FamilyDrawer";
import { extVersion, screens } from "../../Utilities";
import Head from 'next/head'
import ShopStock from "../../components/ShopStock";
import Cauldrons from "../../components/General/Cauldrons/Alchemy";
import Quests from "../../components/General/Quests/Quests";

const Family = () => {
  const { userData, display } = useContext(AppContext);
  const matches = useMediaQuery('(max-width:1220px)');

  return (
    <>
      <Head>
        <title>Idleon Toolbox - Family Progression</title>
      </Head>
      <FamilyDrawer/>
      <FamilyWrapper
        isCharacterDisplay={userData && display?.view === screens.characters && userData?.version === extVersion}>
        <Toolbar/>
        {matches && <Toolbar/>}
        <Main>
          {!userData ? <MissingData/> :
            userData?.version !== extVersion ?
              <OutdatedData extVersion={extVersion}/> :
              <>
                {display?.view === screens.characters ? <CharacterWrapper characters={userData?.characters}/> : null}
                {display?.view === screens.account ? <AccountWrapper account={userData?.account}/> : null}
                {display?.view === screens.alchemy ?
                  <Cauldrons cauldrons={userData?.account?.cauldronsMap} vials={userData?.account?.vialsMap}/> : null}
                {display?.view === screens.craftIt ? <CraftIt userData={userData}/> : null}
                {display?.view === screens.itemLocator ? <ItemLocator userData={userData}/> : null}
                {display?.view === screens.guild ? <GuildWrapper guild={userData?.guild}/> : null}
                {display?.view === screens.shopStock ? <ShopStock stock={userData?.account?.shopStock}/> : null}
                {display?.view === screens.quests ? <Quests characters={userData?.characters} quests={userData?.account?.quests}/> : null}
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
export default Family;