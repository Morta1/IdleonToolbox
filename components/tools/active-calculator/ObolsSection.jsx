import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext, useMemo } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { compareInventories, consolidateItems } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';
import Inventory from '@components/characters/Inventory';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { items } from '../../../data/website-data';

const DropSection = ({ lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const flattenSnapshot = useMemo(() => snapshottedAcc?.obols?.inventory?.flat().filter((name) => name !== 'Blank' && name !== 'LockedInvSpace').map((name) => ({ ...items[name], rawName: name, amount: 1 })), [snapshottedAcc]);
  const flattenCurrent = useMemo(() => state?.account?.obols?.inventory?.flat().filter((name) => name !== 'Blank' && name !== 'LockedInvSpace').map((name) => ({ ...items[name], rawName: name, amount: 1 })), [state?.account]);
  const difference = compareInventories(flattenSnapshot, flattenCurrent, lastUpdated, snapshottedAcc?.snapshotTime);

  if (!snapshottedAcc?.obols?.inventory) {
    return <Section title={'Total Obols'}><Typography variant={'body1'}>Current snapshot is missing obols inventory, please
      re-save a snapshot</Typography></Section>
  }
  return <Section title={'Total Obols'}
                  tooltip={'This is a consolidated view of your items, where identical items have been combined and their total quantities summed.'}
  >
    {!resultsOnly ? <>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        <Inventory
          inventory={consolidateItems(flattenSnapshot)}
          inventoryLength={flattenSnapshot?.length}
        />
      </Stack>
      <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
        <Inventory
          inventory={consolidateItems(flattenCurrent)}
          inventoryLength={flattenCurrent?.length}
        />
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
      <Inventory inventory={difference} amountKey={'difference'}/>
    </Stack>
  </Section>
};

export default DropSection;
