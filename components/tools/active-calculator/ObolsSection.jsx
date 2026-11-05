import { Box, Stack, Typography } from '@mui/material';
import { Section, SectionGroup } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { compareInventories, consolidateItems } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';
import Inventory from '@components/characters/Inventory';
import Notice from '@components/common/Notice';
import { isSectionFailed } from '@components/common/styles';
import { items } from '@website-data';

const flattenObols = (inventory) => inventory?.flat()
  .filter((name) => name !== 'Blank' && name !== 'LockedInvSpace')
  .map((name) => ({ ...items[name], rawName: name, amount: 1 }));

const ObolsSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const failed = isSectionFailed(state?.account, 'obols');
  const flattenSnapshot = flattenObols(snapshottedAcc?.obols?.inventory);
  const flattenCurrent = flattenObols(state?.account?.obols?.inventory);
  const difference = failed ? [] : compareInventories(flattenSnapshot, flattenCurrent, lastUpdated, snapshottedAcc?.snapshotTime);

  if (!snapshottedAcc?.obols?.inventory) {
    return <Section title={'Obols'}>
      <Box sx={{ p: 2 }}><Notice>This snapshot has no obols: save a new one to compare them.</Notice></Box>
    </Section>;
  }
  return <Section title={'Obols'} info={'Identical items are combined and their amounts summed.'}>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} sx={{ p: 2 }}>
      {!resultsOnly ? <>
        <SectionGroup label={'Snapshot'}>
          <Inventory inventory={consolidateItems(flattenSnapshot)} inventoryLength={flattenSnapshot?.length}/>
        </SectionGroup>
        {failed ? null : <SectionGroup label={'Now'}>
          <Inventory inventory={consolidateItems(flattenCurrent)} inventoryLength={flattenCurrent?.length}/>
        </SectionGroup>}
      </> : null}
      <SectionGroup label={'Gained'}>
        {difference.length ? <Inventory inventory={difference} amountKey={'difference'}/>
          : <Typography variant={'body2'} color={'text.secondary'}>
            {failed ? 'Obols failed to load, so there is nothing to compare.' : 'No obol has gone up since the snapshot.'}
          </Typography>}
      </SectionGroup>
    </Stack>
  </Section>;
};

export default ObolsSection;
