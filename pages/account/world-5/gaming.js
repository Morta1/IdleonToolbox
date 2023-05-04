import React, { useContext, useState } from 'react';
import { AppContext } from "../../../components/common/context/AppProvider";
import { Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import { MissingData } from "../../../components/common/styles";
import { NextSeo } from "next-seo";
import General from "../../../components/account/Worlds/World5/Gaming/General";
import Superbits from "../../../components/account/Worlds/World5/Gaming/Superbits";

const Gaming = () => {
  const { state } = useContext(AppContext);
  const { superbitsUpgrades } = state?.account?.gaming || {};
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  if (!state?.account?.gaming) return <MissingData name={'gaming'}/>;
  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
  }
  return <>
    <NextSeo
      title="Idleon Toolbox | Gaming"
      description="Keep track of your gaming upgrades including dirty shovel and autumn squirrel timers"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Gaming</Typography>
    <Tabs centered
          sx={{ marginBottom: 3 }}
          variant={isMd ? 'fullWidth' : 'standard'}
          value={selectedTab} onChange={handleOnClick}>
      {['General', 'Superbits']?.map((tab, index) => {
        return <Tab label={tab} key={`${tab}-${index}`}/>;
      })}
    </Tabs>
    {selectedTab === 0 ? <General {...state?.account?.gaming} lastUpdated={state?.lastUpdated}/> : null}
    {selectedTab === 1 ? <Superbits superbits={superbitsUpgrades}/> : null}
  </>
};


export default Gaming;
