import React, { useContext, useState } from "react";
import { AppContext } from "components/common/context/AppProvider";
import { Card, CardContent, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import BreedingUpgrades from "components/account/Worlds/World4/BreedingUpgrades";
import BreedingArena from "components/account/Worlds/World4/BreedingArena";
import { prefix } from "utility/helpers";

const Breeding = () => {
  const { state } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
  }
  return (
    <>
      <Typography variant={'h2'} textAlign={'center'} mb={3}>Breeding</Typography>
      <Stack my={2} direction={'row'} alignItems={'center'} justifyContent={'center'} flexWrap={'wrap'} gap={2}>
        {state?.account?.breeding?.eggs.map((eggLevel, index) => {
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
        {['Upgrades', 'Arena']?.map((tab, index) => {
          return <Tab label={tab} key={`${tab}-${index}`}/>;
        })}
      </Tabs>
      {selectedTab === 0 ? <BreedingUpgrades petUpgrades={state?.account?.breeding?.petUpgrades}
                                             meals={state?.account?.cooking?.meals}/> : null}
      {selectedTab === 1 ? <BreedingArena {...state?.account?.breeding}/> : null}
    </>
  );
};

export default Breeding;
