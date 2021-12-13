import styled from 'styled-components'
import { extVersion, screens } from "../Utilities";
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

const Account = () => {
  const { userData, display, accountDisplay } = useContext(AppContext);

  return (
    <AccountStyle
      isCharacterDisplay={userData && display?.view === screens.account && userData?.version === extVersion}>
      <AccountDrawer/>
      {accountDisplay?.view === 'general' ? <General account={userData?.account}/> : null}
      {accountDisplay?.view === 'looty' ? <Looty items={userData?.account?.missingLootyItems}/> : null}
      {accountDisplay?.view === 'stamps' ?
        <Stamps stamps={userData?.account?.stamps} alchemy={userData?.account?.alchemy}
                bribes={userData?.account?.bribes}/> : null}
      {accountDisplay?.view === 'brewing' ? <Brewing account={userData?.account}/> : null}
      {accountDisplay?.view === 'vials' ? <Vials vials={userData?.account?.alchemy?.vials}/> : null}
      {accountDisplay?.view === 'bribes' ? <Bribes bribes={userData?.account?.bribes}/> : null}
      {accountDisplay?.view === 'constellations' ? <Constellations starSigns={userData?.account?.starSigns} constellations={userData?.account?.constellations}/> : null}
    </AccountStyle>
  );
};

const AccountStyle = styled.div`
  ${({ isCharacterDisplay }) => isCharacterDisplay ? 'padding-left: 240px;' : ''}
  margin-top: 30px;
`;

export default Account;
