import { Divider, Stack, TextField, Typography } from '@mui/material';
import { numberWithCommas } from '@utility/helpers';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { compareInventories, consolidateItems } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';
import Inventory from '@components/characters/Inventory';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const DropSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [goal, setGoal] = useLocalStorage({ key: 'activeDropGoal', defaultValue: '' });
  const difference = compareInventories(snapshottedChar?.inventory, state?.characters?.[selectedChar]?.inventory, lastUpdated, snapshottedChar?.snapshotTime, goal);

  const handleChange = (event) => {
    const rawValue = event.target.value.replace(/,/g, ''); // Remove existing commas
    if (!isNaN(rawValue) && rawValue !== '') {
      setGoal(numberWithCommas(Number(rawValue))); // Format with commas
    } else {
      setGoal(''); // Clear if invalid input
    }
  };

  return <Section title={'Total Items'}
                  tooltip={'This is a consolidated view of your items, where identical items have been combined and their total quantities summed.'}
                  extra={<TextField value={goal} onChange={handleChange} label={'Goal'} size={'small'}/>}
  >
    {!resultsOnly ? <>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        {(snapshottedChar?.playerId + '') === selectedChar
          ? <Inventory asc
                       inventory={consolidateItems(snapshottedChar?.inventory)}
                       inventoryLength={snapshottedChar?.inventory?.length}
                       inventorySlots={snapshottedChar?.inventorySlots}/>
          : <Typography variant={'body1'}>No snapshot available for
            this character</Typography>}
      </Stack>
      <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
        <Inventory asc
                   inventory={consolidateItems(state?.characters?.[selectedChar]?.inventory)}
                   inventoryLength={state?.characters?.[selectedChar]?.inventory?.length}
                   inventorySlots={state?.characters?.[selectedChar]?.inventorySlots}/>
      </Stack>
    </> : null}
    <Stack>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Result</Typography>
        <Tooltip
          title={<Stack>
            <Typography variant={'body1'}>Hover over each item to see more stats</Typography>
          </Stack>}>
          <IconInfoCircleFilled size={18}/>
        </Tooltip>
      </Stack>
      <Typography variant={'body1'}>Cloudsave in-game to update the results</Typography>
      <Inventory asc inventory={difference} amountKey={'difference'}/>
    </Stack>
  </Section>
};

export default DropSection;
