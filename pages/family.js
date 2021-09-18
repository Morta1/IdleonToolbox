import React, { useContext } from "react";
import styled from "styled-components";
import CharacterWrapper from "../components/CharacterWrapper";
import AccountWrapper from "../components/AccountWrapper";
import GuildWrapper from "../components/GuildWrapper";
import ItemLocator from "../components/General/ItemLocator";
import CraftIt from "../components/General/CraftIt/CraftIt";
import { AppContext } from '../components/context';
import MissingData from "../components/General/MissingData";
import OutdatedData from "../components/General/OutdatedData";
import { Toolbar } from "@material-ui/core";
import FamilyDrawer from "../components/Common/FamilyDrawer";
import { extVersion } from "../Utilities";
import Head from 'next/head'

const Family = () => {
  const { userData, display } = useContext(AppContext);
  return (
    <>
      <Head>
        <title>Idleon Toolbox - Family Progression</title>
      </Head>
      <FamilyDrawer/>
      <FamilyWrapper isCharacterDisplay={userData && display?.view === 0 && userData?.version === extVersion}>
        <Toolbar/>
        <Main>
          {!userData ? <MissingData/> :
            userData?.version !== extVersion ?
              <OutdatedData extVersion={extVersion}/> :
              <div style={{ padding: 10 }}>
                {display?.view === 0 ? <CharacterWrapper characters={userData?.characters}/> : null}
                {display?.view === 1 ? <AccountWrapper account={userData?.account}/> : null}
                {display?.view === 2 ? <CraftIt userData={userData}/> : null}
                {display?.view === 3 ? <ItemLocator userData={userData}/> : null}
                {display?.view === 4 ? <GuildWrapper guild={userData?.guild}/> : null}
              </div>}
        </Main>
      </FamilyWrapper>
    </>
  );
};

const FamilyWrapper = styled.div`
  flex-grow: 1;
  ${({ isCharacterDisplay }) => isCharacterDisplay ? 'padding-left: 230px;' : ''}
`;

const Main = styled.main`
  color: white;
`;
export default Family;