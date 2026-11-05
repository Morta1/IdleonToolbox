import { Box, Stack, Typography } from '@mui/material';
import { Section, SectionGroup } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { compareInventories, consolidateItems } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';
import Inventory from '@components/characters/Inventory';
import NumberField from '@components/common/NumberField';

const DropSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [goal, setGoal] = useLocalStorage({ key: 'activeDropGoal', defaultValue: '' });
  const character = state?.characters?.[selectedChar];
  const difference = compareInventories(snapshottedChar?.inventory, character?.inventory, lastUpdated, snapshottedChar?.snapshotTime, goal);
  // An older value holds commas; the parser reads either
  const goalNumber = Number(`${goal}`.replace(/,/g, ''));

  return <Section title={'Drops'} meta={'Updates when you cloud save in game'} info={'Identical items are combined and their amounts summed.'}>
    <Stack gap={2} sx={{ p: 2 }}>
      <Box>
        <NumberField label={'Goal'} integer min={0} help={false} sx={{ width: 200 }}
                     value={goal === '' || !Number.isFinite(goalNumber) ? null : goalNumber}
                     onChange={(next) => setGoal(next == null ? '' : String(next))}/>
      </Box>
      <Stack direction={'row'} flexWrap={'wrap'} gap={3}>
        {!resultsOnly ? <>
          <SectionGroup label={'Snapshot'}>
            <Inventory asc inventory={consolidateItems(snapshottedChar?.inventory)} inventoryLength={snapshottedChar?.inventory?.length}
                       inventorySlots={snapshottedChar?.inventorySlots}/>
          </SectionGroup>
          <SectionGroup label={'Now'}>
            <Inventory asc inventory={consolidateItems(character?.inventory)} inventoryLength={character?.inventory?.length}
                       inventorySlots={character?.inventorySlots}/>
          </SectionGroup>
        </> : null}
        <SectionGroup label={'Gained'}>
          {difference.length ? <Inventory asc inventory={difference} amountKey={'difference'}/>
            : <Typography variant={'body2'} color={'text.secondary'}>No item has gone up since the snapshot.</Typography>}
        </SectionGroup>
      </Stack>
    </Stack>
  </Section>;
};

export default DropSection;
