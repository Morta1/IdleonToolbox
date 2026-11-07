import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { commaNotation } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { gameTables } from '@website-data';
import CardGrid from '@components/common/cards/CardGrid';
import BonusesPanel, { bonusRows } from '@components/account/BonusesPanel';
import InfoButton from '@components/common/InfoButton';
import { CatalogList, catalogCard } from '@components/account/Worlds/World7/Gallery/Trophies';

const BASE_STATS = gameTables.galleryBonusStats;

// The vine's own number: the total rounded up. The vine skips a base stat at 0.
const vineValue = (value, percent) => `+${commaNotation(Math.ceil(value))}${percent ? '%' : ''}`;

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
    <BonusesPanel rows={bonusRows(shownBonuses, vineValue)} sx={{ mb: 3 }} aside={<InfoButton label={'Bonuses'}>
      Game bug: the base stats (Weapon Power, STR, AGI, WIS, LUK, Defence) are your Hat Rack totals plus only the last
      cape&apos;s stats, so the Hat Rack&apos;s base stats count twice. The other bonuses add up every cape. The numbers here match
      the game.
    </InfoButton>}/>
    {capesUsed?.length ? <Stack gap={1.5} sx={{ mb: 3 }}>
      <Typography variant={'sectionTitle'} component={'h2'}>On the vine</Typography>
      <CardGrid size={'s'}>
        {capesUsed.map((cape) => catalogCard({ ...cape, isAcquired: true }, { meta: vineMeta(cape), acquired: null }))}
      </CardGrid>
    </Stack> : null}
    <CatalogList page={'cape-vine'} title={'All capes'} noun={'capes'} items={allCapes} acquired={'On the vine'} notAcquired={'Not on the vine'} failed={sectionFailed}/>
  </>;
};

export default CapeVine;
