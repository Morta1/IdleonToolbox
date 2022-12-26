import React, { useContext, useState } from 'react';
import { AppContext } from "components/common/context/AppProvider";
import { Card, CardContent, Stack, Tab, Tabs, Typography, useMediaQuery } from "@mui/material";
import Artifacts from "components/account/Worlds/World5/Sailing/Artifacts";
import LootPile from "../../../components/account/Worlds/World5/Sailing/LootPile";
import { prefix } from "../../../utility/helpers";

const Sailing = () => {
  const { state } = useContext(AppContext);
  const { artifacts, lootPile, maxChests, captains, boats } = state?.account?.sailing || {};
  const [selectedTab, setSelectedTab] = useState(0);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const handleOnClick = (e, selected) => {
    setSelectedTab(selected);
  }

  return <>
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Sailing</Typography>
    <Tabs centered
          sx={{ marginBottom: 3 }}
          variant={isMd ? 'fullWidth' : 'standard'}
          value={selectedTab} onChange={handleOnClick}>
      {['Artifacts', 'Loot Pile']?.map((tab, index) => {
        return <Tab label={tab} key={`${tab}-${index}`}/>;
      })}
    </Tabs>

    <Stack mb={2} direction={'row'} gap={1}>
      <Card >
        <CardContent>
          <Stack sx={{ width: 200 }} direction={'row'} gap={1} alignItems={'center'}>
            <img style={{ width: 50, objectFit: 'contain' }} src={`${prefix}npcs/Chesty.gif`} alt=""/>
            Max chests: {maxChests}
          </Stack>
        </CardContent>
      </Card>
      <Card >
        <CardContent>
          <Stack sx={{ width: 200 }} direction={'row'} gap={1} alignItems={'center'}>
            <img style={{ width: 28, objectFit: 'contain' }} src={`${prefix}npcs/Captain.gif`} alt=""/>
            Captains: {captains?.length}
          </Stack>
        </CardContent>
      </Card>
      <Card >
        <CardContent>
          <Stack sx={{ width: 200 }} direction={'row'} gap={1} alignItems={'center'}>
            <img style={{ width: 42, objectFit: 'contain' }} src={`${prefix}npcs/Boat.gif`} alt=""/>
            Boats: {boats?.length}
          </Stack>
        </CardContent>
      </Card>
    </Stack>

    {selectedTab === 0 ? <Artifacts artifacts={artifacts}/> : null}
    {selectedTab === 1 ? <LootPile lootPile={lootPile}/> : null}
  </>
};

export default Sailing;
