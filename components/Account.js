import styled from 'styled-components'
import { screens } from "../Utilities";
import React, { useContext } from "react";
import { AppContext } from "./Common/context";
import AccountDrawer from "./Common/Drawers/AccountDrawer";
import Vials from "./Alchemy/Vials";
import General from "./General";
import Brewing from "./Alchemy/Brewing/Brewing";
import Stamps from "./Stamps/Stamps";
import Bribes from "./General/Bribes";
import Constellations from "./Constellations";
import Looty from "./General/Looty";
import Refinery from "./Refinery";
import GemShopBundles from "./GemShopBundles";
import DeathNote from "./DeathNote";
import SaltLick from "./SaltLick";

const Account = () => {
  const { userData, display, accountDisplay, lastUpdated } = useContext(AppContext);

  return (
    <AccountStyle
      isCharacterDisplay={userData && display?.view === screens.account}>
      <AccountDrawer/>
      {accountDisplay?.view === 'general' ? <General account={userData?.account}/> : null}
      {accountDisplay?.view === 'looty' ? <Looty items={userData?.account?.missingLootyItems}/> : null}
      {accountDisplay?.view === 'stamps' ?
        <Stamps stamps={userData?.account?.stamps} alchemy={userData?.account?.alchemy}
                bribes={userData?.account?.bribes}/> : null}
      {accountDisplay?.view === 'brewing' ? <Brewing account={userData?.account}/> : null}
      {accountDisplay?.view === 'vials' ? <Vials vials={userData?.account?.alchemy?.vials}/> : null}
      {accountDisplay?.view === 'deathNote' ? <DeathNote deathNote={userData?.account?.deathNote}/> : null}
      {accountDisplay?.view === 'saltLick' ? <SaltLick saltLick={userData?.account?.saltLicks}/> : null}
      {accountDisplay?.view === 'refinery' ?
        <Refinery refinery={userData?.account?.refinery} saltLicks={userData?.account?.saltLicks}
                  vials={userData?.account?.alchemy?.vials} characters={userData?.characters}
                  lastUpdated={lastUpdated}/> : null}
      {accountDisplay?.view === 'bribes' ? <Bribes bribes={userData?.account?.bribes}/> : null}
      {accountDisplay?.view === 'bundles' ? <GemShopBundles bundles={userData?.account?.bundles}/> : null}
      {accountDisplay?.view === 'constellations' ?
        <Constellations userData={userData?.characters} starSigns={userData?.account?.starSigns}
                        constellations={userData?.account?.constellations}/> : null}
    </AccountStyle>
  );
};

const AccountStyle = styled.div`
  ${({ isCharacterDisplay }) => isCharacterDisplay ? 'padding-left: 240px;' : ''}
  margin-top: 30px;
`;

export default Account;
