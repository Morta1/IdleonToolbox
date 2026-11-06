import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { gameTables } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import InfoButton from '@components/common/InfoButton';
import { catalogCard } from '@components/account/Worlds/World7/Gallery/Trophies';

const BASE_STATS = gameTables.galleryBonusStats;

// Same text as the vine: the total rounded up, base stats as "+12 STR", etc bonuses carry their own "%_" prefix.
// The vine skips a base stat at 0.
const bonusText = ({ name, value }) => cleanUnderscore(`+${commaNotation(Math.ceil(value))}${BASE_STATS.includes(name) ? '_' : ''}${name}`);

// The slot's multi says which vine it hangs on, and a Golden Vine reads in the game's gold
const vineMeta = ({ golden, capeMultiplier }) => {
  const multi = capeMultiplier ? ` · ${formatGame(capeMultiplier, 'Gallery.CapevineBonusMulti')}x` : '';
  return golden
    ? <Box component={'span'} sx={{ color: 'text.warning' }}>{`Golden Vine${multi}`}</Box>
    : `Cape Vine${multi}`;
};

// Hat Rack's and Gallery's catalog cards: the title opens the wiki page, a cape not on the vine takes the card's dim
const CapeVine = ({ capesUsed, capeBonuses, allCapes, sectionFailed }) => {
  const shownBonuses = (capeBonuses || []).filter(({ name, value }) => !BASE_STATS.includes(name) || value > 0);
  return <>
    {shownBonuses.length ? <Panel title={'Bonuses'} sx={{ mb: 3 }} aside={<InfoButton label={'Bonuses'}>
      Game bug: the base stats (Weapon Power, STR, AGI, WIS, LUK, Defence) are your Hat Rack totals plus only the last
      cape&apos;s stats, so the Hat Rack&apos;s base stats count twice. The other bonuses add up every cape. The numbers here match
      the game.
    </InfoButton>}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
        {shownBonuses.map((bonus) => <Panel.Row key={bonus.name} name={bonusText(bonus)}/>)}
      </Box>
    </Panel> : null}
    {capesUsed?.length ? <Stack gap={1.5} sx={{ mb: 3 }}>
      <Typography variant={'sectionTitle'} component={'h2'}>On the vine</Typography>
      <CardGrid size={'s'}>
        {capesUsed.map((cape) => catalogCard({ ...cape, isAcquired: true }, { meta: vineMeta(cape), acquired: null }))}
      </CardGrid>
    </Stack> : null}
    {allCapes?.length ? <Stack gap={1.5} sx={{ mb: 3 }}>
      <Typography variant={'sectionTitle'} component={'h2'}>All capes</Typography>
      <CardGrid size={'s'}>
        {allCapes.map((cape) => catalogCard(cape, { acquired: 'On the vine', notAcquired: 'Not on the vine', failed: sectionFailed }))}
      </CardGrid>
    </Stack> : null}
  </>;
};

export default CapeVine;
