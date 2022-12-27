import { Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import React, { useContext, useState } from "react";
import { AppContext } from "components/common/context/AppProvider";
import Mainframe from "components/account/Worlds/World4/Mainframe";
import Console from "components/account/Worlds/World4/Console";

const Laboratory = () => {
  const { state } = useContext(AppContext);
  const { lab } = state?.account;

  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
  }
  return (
    <>
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Laboratory</Typography>
      <Tabs centered
            sx={{ marginBottom: 3 }}
            variant={isMd ? 'fullWidth' : 'standard'}
            value={selectedTab} onChange={handleOnClick}>
        {['Main frame', 'Console']?.map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>;
        })}
      </Tabs>

      {selectedTab === 0 ? <Mainframe {...lab} characters={state?.characters} divinity={state?.account?.divinity}/> : null}
      {selectedTab === 1 ? <Console {...lab} characters={state?.characters}/> : null}
    </>
  );
};

export default Laboratory;
