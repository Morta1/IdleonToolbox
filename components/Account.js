import styled from 'styled-components'
import { extVersion, screens } from "../Utilities";
import React, { useContext } from "react";
import { AppContext } from "./Common/context";
import AccountDrawer from "./Common/Drawers/AccountDrawer";
import { Toolbar, useMediaQuery } from "@material-ui/core";
import Vials from "./Alchemy/Vials";
import General from "./General";
import Brewing from "./Alchemy/Brewing/Brewing";
import Stamps from "./Stamps/Stamps";
import Bribes from "./General/Bribes";

const Account = () => {
  const { userData, display, accountDisplay } = useContext(AppContext);
  const matches = useMediaQuery('(max-width:1260px)');

  return (
    <AlchemyStyle
      isCharacterDisplay={userData && display?.view === screens.account && userData?.version === extVersion}>
      <AccountDrawer/>
      {matches && <Toolbar/>}
      {accountDisplay?.view === 'general' ? <General account={userData?.account}/> : null}
      {accountDisplay?.view === 'stamps' ?
        <Stamps stamps={userData?.account?.stamps} alchemy={userData?.account?.alchemy}
                bribes={userData?.account?.bribes}/> : null}
      {accountDisplay?.view === 'brewing' ? <Brewing alchemy={userData?.account?.alchemy}/> : null}
      {accountDisplay?.view === 'vials' ? <Vials vials={userData?.account?.alchemy?.vials}/> : null}
      {accountDisplay?.view === 'bribes' ? <Bribes bribes={userData?.account?.bribes}/> : null}
    </AlchemyStyle>
  );
};

const AlchemyStyle = styled.div`
  ${({ isCharacterDisplay }) => isCharacterDisplay ? 'padding-left: 240px;' : ''}
  margin-top: 25px;
`;

export default Account;
