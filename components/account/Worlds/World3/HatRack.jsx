import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { gameTables } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import { catalogCard } from '@components/account/Worlds/World7/Gallery/Trophies';

const BASE_STATS = gameTables.galleryBonusStats;

// Same text as the rack: the total rounded up, base stats as "+12 STR", etc bonuses carry their own "%_" prefix
const bonusText = ({ name, value }) => cleanUnderscore(`+${formatNum(Math.ceil(value ?? 0))}${BASE_STATS.includes(name) ? '_' : ''}${name}`);

// Gallery's catalog cards (5d): the title opens the wiki page, a helmet not acquired takes the card's dim and says so.
// sectionFailed: the catalog at zero with no state words
const HatRack = ({ hatBonuses, allPremiumHelmets, sectionFailed }) => <>
  {allPremiumHelmets?.length ? <Stack gap={1.5} sx={{ mb: 3 }}>
    <Typography variant={'sectionTitle'} component={'h2'}>Premium helmets</Typography>
    <CardGrid size={'s'}>
      {allPremiumHelmets.map((hat) => catalogCard(hat, sectionFailed ? undefined : hat?.isAcquired
        ? `Hat rack multi ${formatNum(hat?.hatMultiplier ?? 1, 'mult')}`
        : 'Not acquired'))}
    </CardGrid>
  </Stack> : null}
  {hatBonuses?.length ? <Panel title={'Bonuses'}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
      {hatBonuses.map((bonus, index) => <Panel.Row key={`bonus-${index}`} name={bonusText(bonus)}/>)}
    </Box>
  </Panel> : null}
</>;

export default HatRack;
