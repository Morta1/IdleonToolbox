import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { gameTables, items } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import { catalogCard } from '@components/account/Worlds/World7/Gallery/Trophies';

const BASE_STATS = gameTables.galleryBonusStats;

// Same text as the rack: the total rounded up, base stats as "+12 STR", etc bonuses carry their own "%_" prefix
const bonusText = ({ name, value }) => cleanUnderscore(`+${formatNum(Math.ceil(value ?? 0))}${BASE_STATS.includes(name) ? '_' : ''}${name}`);

// The game's rack draws a picked helmet's own numbers, its UQ1val and UQ2val with no multi (N.js, the hat rack
// screen), so every line of a card is base: the parser's multiplied misc lines give way to the item's own
const baseHelmet = (hat) => ({
  ...hat,
  UQ1val: items?.[hat?.rawName]?.UQ1val ?? hat?.UQ1val,
  UQ2val: items?.[hat?.rawName]?.UQ2val ?? hat?.UQ2val
});

// Gallery's catalog cards (5d): the title opens the wiki page, a helmet not acquired takes the card's dim and says so.
// The rack's multi shows once, on the Bonuses panel, whose totals hold it. sectionFailed: the catalog at zero with no
// state words
const HatRack = ({ bonusMulti, hatBonuses, allPremiumHelmets, sectionFailed }) => <>
  {allPremiumHelmets?.length ? <Stack gap={1.5} sx={{ mb: 3 }}>
    <Typography variant={'sectionTitle'} component={'h2'}>Premium helmets</Typography>
    <CardGrid size={'s'}>
      {allPremiumHelmets.map((hat) => catalogCard(baseHelmet(hat), sectionFailed ? undefined : hat?.isAcquired
        ? 'Acquired'
        : 'Not acquired'))}
    </CardGrid>
  </Stack> : null}
  {hatBonuses?.length ? <Panel title={'Bonuses'}
                               meta={`Totals with the hat rack multi ${formatGame(bonusMulti ?? 1, 'Gallery.HatrackBonusMulti')}x`}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
      {hatBonuses.map((bonus, index) => <Panel.Row key={`bonus-${index}`} name={bonusText(bonus)}/>)}
    </Box>
  </Panel> : null}
</>;

export default HatRack;
