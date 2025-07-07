import React, { useContext, useMemo, useState } from 'react';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Divider, MenuItem, Select, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { prefix } from '@utility/helpers';
import { samplingSetups } from '../../data/sampling-setups';
import AutoGrid from '@components/common/AutoGrid';
import DataLoadingWrapper from '@components/common/DataLoadingWrapper';
import Equipment from '@components/tools/sampling-companion/Equipment';
import Cards from '@components/tools/sampling-companion/Cards';
import Chips from '@components/tools/sampling-companion/Chips';
import Prayers from '@components/tools/sampling-companion/Prayers';
import Obols from '@components/tools/sampling-companion/Obols';
import StarSigns from '@components/tools/sampling-companion/StarSigns';
import { addEquippedItems, getAllItems, mergeItemsByOwner } from '@parsers/items';

const SamplingCompanion = () => {
  const { state } = useContext(AppContext);
  const [selectedChar, setSelectedChar] = useState(state?.characters?.[0] || {});
  const [selectedSetup, setSelectedSetup] = useState('');
  const equippedItems = useMemo(() => addEquippedItems(state?.characters, true), []);
  const totalItems = useMemo(() => getAllItems(state?.characters, state?.account), [state?.characters, state?.account])
  const items = useMemo(() => mergeItemsByOwner(equippedItems, totalItems), [equippedItems, totalItems]);

  const handleCharChange = (e) => {
    setSelectedChar(state?.characters?.[e.target.value]);
  };

  if (!state?.characters) {
    return <DataLoadingWrapper/>
  }

  return (
    <>
      <NextSeo
        title="Sampling Companion | Idleon Toolbox"
        description="Find out what your character needs for optimal sampling setups"
      />

      <Stack spacing={2}>
        <Card sx={{ width: 'fit-content' }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
              <Select
                size={'small'}
                sx={{ width: 230 }}
                value={selectedChar?.playerId}
                onChange={handleCharChange}
              >
                {state?.characters?.map((character, index) => (
                  <MenuItem
                    key={character?.name + index}
                    value={character?.playerId}
                    selected={selectedChar === character?.playerId}
                  >
                    <Stack direction={'row'} alignItems={'center'} gap={2}>
                      <img
                        src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                        alt=""
                        width={24}
                        height={24}
                      />
                      <Typography>{character?.name}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>

              <Divider orientation={'vertical'} flexItem sx={{ mx: 2, display: { xs: 'none', sm: 'block' } }}/>

              <Select
                size={'small'}
                sx={{ width: 230 }}
                value={selectedSetup}
                displayEmpty
                onChange={(e) => setSelectedSetup(e.target.value)}
                renderValue={(selected) => {
                  return selected?.name || 'Select a Setup';
                }}
              >
                <MenuItem disabled value="">Select a Setup</MenuItem>
                {Object.entries(samplingSetups).map(([id, setup]) => (
                  <MenuItem key={id} value={setup}>
                    {setup.name}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </CardContent>
        </Card>

        {selectedSetup ? <Stack sx={{ width: '100%' }}>
          <AutoGrid withBorder>
            <Equipment
              hideEmpty
              weaponByClass={selectedSetup?.weaponByClass}
              equipment={selectedSetup?.equipment}
              tools={selectedSetup?.tools}
              food={selectedSetup?.food}
              character={selectedChar}
              account={state?.account}
              allAccountItems={items}
            />
            <Cards cards={selectedSetup?.cards}
                   cardSet={selectedSetup?.cardSet}
                   account={state?.account} character={selectedChar}/>
            <Chips chips={selectedSetup?.chips} character={selectedChar} account={state?.account}/>
            <Prayers prayers={selectedSetup?.prayers} character={selectedChar} account={state?.account}/>
            <Obols obols={selectedSetup?.obols} character={selectedChar} account={state?.account}/>
            <StarSigns starSigns={selectedSetup?.starSigns} character={selectedChar} account={state?.account}/>
          </AutoGrid>
        </Stack> : <Typography variant={'h5'}>Please select a character and a setup</Typography>}
      </Stack>
    </>
  );
};

export default SamplingCompanion;
