import React, { useContext, useState } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Card, CardContent, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import BreedingUpgrades from "components/account/Worlds/World4/Breeding/BreedingUpgrades";
import BreedingArena from "components/account/Worlds/World4/Breeding/BreedingArena";
import { prefix } from "utility/helpers";
import { NextSeo } from "next-seo";
import Pets from "../../../components/account/Worlds/World4/Breeding/Pets";

const Breeding = () => {
  const { state } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
  }
  return (
    <>
      <NextSeo
        title="Idleon Toolbox | Breeding"
        description="Keep track of your breeding upgrades, eggs and arena upgrades"
      />
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Breeding</Typography>
      <Stack my={2} direction={'row'} alignItems={'center'} justifyContent={'center'} flexWrap={'wrap'} gap={2}>
        {state?.account?.breeding?.eggs?.map((eggLevel, index) => {
          return eggLevel > 0 ? <Card key={`egg-${index}`}>
            <CardContent sx={{ '&:last-child': { padding: '8px' }, display: 'flex', alignItems: 'center' }}>
              <img src={`${prefix}data/PetEgg${eggLevel}.png`} alt=""/>
            </CardContent>
          </Card> : null;
        })}
      </Stack>
      <Tabs centered
            sx={{ marginBottom: 3 }}
            variant={isMd ? 'fullWidth' : 'standard'}
            value={selectedTab} onChange={handleOnClick}>
        {['Pets', 'Upgrades', 'Arena' ]?.map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>;
        })}
      </Tabs>
      {selectedTab === 0 ? <Pets {...state?.account?.breeding}/> : null}
      {selectedTab === 1 ? <BreedingUpgrades petUpgrades={state?.account?.breeding?.petUpgrades}
                                             meals={state?.account?.cooking?.meals}/> : null}
      {selectedTab === 2 ? <BreedingArena {...state?.account?.breeding}/> : null}
    </>
  );
};

export default Breeding;
