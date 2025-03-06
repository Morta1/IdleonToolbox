import { NextSeo } from 'next-seo';
import React, { useContext, useEffect, useState } from 'react';
import { Divider, Select, selectClasses, Stack, TextField, Typography, useMediaQuery } from '@mui/material';
import { numberWithCommas, prefix } from '@utility/helpers';
import MenuItem from '@mui/material/MenuItem';
import { AppContext } from '@components/common/context/AppProvider';
import Inventory from '@components/characters/Inventory';
import { IconDeviceFloppy, IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';
import Button from '@mui/material/Button';
import { format } from 'date-fns';
import { useLocalStorage } from '@mantine/hooks';

const consolidateItems = (items) => {
  // Create a map to store consolidated items
  const consolidatedMap = new Map();
  if (!Array.isArray(items)) return null;
  // Iterate through each item in the array
  items.forEach(item => {
    // Use displayName as the key for consolidation
    const key = item.displayName;

    // If the item already exists in the map, update its amount
    if (consolidatedMap.has(key)) {
      const existingItem = consolidatedMap.get(key);
      existingItem.amount += item.amount;
    } else {
      // If it's a new item, create a deep copy and add to the map
      consolidatedMap.set(key, { ...item });
    }
  });

  // Convert the map back to an array
  return Array.from(consolidatedMap.values());
}

function compareInventories(snapshotInventory, currentInventory, snapshotTime, goal) {
  if (!Array.isArray(snapshotInventory) || !Array.isArray(currentInventory)) return [];

  const inv1 = consolidateItems(snapshotInventory);
  const inv2 = consolidateItems(currentInventory);
  const inv1Map = new Map(inv1.map(item => [item.displayName, item]));
  const inv2Map = new Map(inv2.map(item => [item.displayName, item]));
  const report = [];

  new Set([...inv1Map.keys(), ...inv2Map.keys()]).forEach(name => {
    const item1 = inv1Map.get(name) || { displayName: name, amount: 0 };
    const item2 = inv2Map.get(name) || { displayName: name, amount: 0 };
    const difference = item2.amount - item1.amount;

    if (difference !== 0) {
      const perHour = (difference / ((Date.now() - snapshotTime) / 1000 / 60)) * 60;
      report.push({
        ...item1,
        snapshotInventoryItem: item1.amount ? item1 : null,
        currentInventoryItem: item2.amount ? item2 : null,
        snapshotInventoryAmount: item1.amount,
        currentInventoryAmount: item2.amount,
        difference,
        perHour,
        perDay: perHour * 24,
        perGoal: (Number(goal.replace(/,/g, '')) - difference) / perHour,
        status: difference > 0 ? 'increased' : 'decreased'
      });
    }
  });

  return report;
}

const ActiveDropCalculator = () => {
  const { state } = useContext(AppContext);
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('lg'), { noSsr: true });
  const [goal, setGoal] = useLocalStorage({
    key: 'activeDropGoal',
    defaultValue: ''
  });

  const [snapshottedChar, setSnapshottedChar] = useLocalStorage({
    key: 'activeDropPlayer',
    defaultValue: null
  });

  const [selectedChar, setSelectedChar] = useState('0');

  useEffect(() => {
    if (snapshottedChar) {
      setSelectedChar(snapshottedChar?.playerId + '');
    }
  }, [snapshottedChar]);


  const handleSaveSnapshot = () => {
    setSnapshottedChar({ ...state?.characters?.[selectedChar], snapshotTime: new Date().getTime() })
  }

  const handleChange = (event) => {
    const rawValue = event.target.value.replace(/,/g, ''); // Remove existing commas
    if (!isNaN(rawValue) && rawValue !== '') {
      setGoal(numberWithCommas(Number(rawValue))); // Format with commas
    } else {
      setGoal(''); // Clear if invalid input
    }
  };

  const difference = compareInventories(snapshottedChar?.inventory, state?.characters?.[selectedChar]?.inventory, snapshottedChar?.snapshotTime, goal);

  return <>
    <NextSeo
      title="Active Drop Calculator | Idleon Toolbox"
      description="Calculate how much items you get when playing actively"
    />
    <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'}>
      <Select
        size={'small'}
        sx={{
          width: 230,
          paddingRight: 2,
          [`& .${selectClasses.select}`]: {
            display: 'flex',
            alignItems: 'center'
          }
        }} value={selectedChar} onChange={(e) => setSelectedChar(e.target.value)}>
        {state?.characters?.map((character, index) => {
          return <MenuItem key={character?.name + index} value={character?.playerId}
                           selected={selectedChar === character?.playerId}>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}data/ClassIcons${character?.classIndex}.png`} alt="" width={32} height={32}/>
              <Typography>{character?.name}</Typography>
            </Stack>
          </MenuItem>
        })}
      </Select>
      <Divider orientation={'vertical'} flexItem sx={{ ml: 2, display: { xs: 'none', sm: 'block' } }}/>
      <TextField value={goal} onChange={handleChange} label={'Goal'} size={'small'}/>
      <Divider orientation={'vertical'} flexItem sx={{ ml: 2, display: { xs: 'none', sm: 'block' } }}/>
      <Stack gap={.5} sx={{ ml: 2 }}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Button sx={{ width: 'fit-content' }} variant={'contained'} size={'small'} onClick={handleSaveSnapshot}
                  startIcon={<IconDeviceFloppy/>}>Save
            snapshot</Button>
          <Tooltip
            title={'You can only take a snapshot of one character at a time.'}>
            <IconInfoCircleFilled/>
          </Tooltip>
        </Stack>
        {snapshottedChar?.snapshotTime
          ? <Typography
            variant={'caption'}>{snapshottedChar?.name} - {format(snapshottedChar?.snapshotTime, 'dd/MM/yyyy HH:mm:ss')}</Typography>
          : null}
      </Stack>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} alignItems={'center'} gap={1} mb={2}>
      <Typography variant={'h6'}>Total Items</Typography>
      <Tooltip
        title={'This is a consolidated view of your items, where identical items have been combined and their total quantities summed.'}>
        <IconInfoCircleFilled/>
      </Tooltip>
    </Stack>
    <Stack direction={isMd ? 'column' : 'row'} gap={1} flexWrap={'wrap'}
           divider={isMd ? null : <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>}>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        {(snapshottedChar?.playerId + '') === selectedChar ? <Inventory
          inventory={consolidateItems(snapshottedChar?.inventory)}
          inventoryLength={snapshottedChar?.inventory?.length}
          inventorySlots={snapshottedChar?.inventorySlots}/> : <Typography variant={'body1'}>No snapshot available for
          this character</Typography>}
      </Stack>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
        <Inventory
          inventory={consolidateItems(state?.characters?.[selectedChar]?.inventory)}
          inventoryLength={state?.characters?.[selectedChar]?.inventory?.length}
          inventorySlots={state?.characters?.[selectedChar]?.inventorySlots}/>
      </Stack>
      {(snapshottedChar?.playerId + '') === selectedChar ? <Stack>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Result</Typography>
          <Tooltip
            title={'Hover over each item to see more stats'}>
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
        <Typography variant={'body1'}>Cloudsave in-game to update the results</Typography>
        <Inventory inventory={difference} amountKey={'difference'}/>
      </Stack> : null}
    </Stack>

  </>;
};

export default ActiveDropCalculator;
