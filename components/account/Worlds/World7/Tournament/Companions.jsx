import React, { useDeferredValue } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { monsterSprite } from '@utility/spriteImages';
import { companions as companionsData } from '@website-data';
import CardGrid, { LABELED_TILE_MIN } from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const isReleased = (pet) => pet?.name && pet?.effect !== 'Not_officially_in_the_game_and_may_never_be';

const COMPANIONS_TOOLBAR = { search: '' };

const countOf = (bands) => bands.reduce((sum, { rows }) => sum + rows.length, 0);
const nameOf = (pet) => `${cleanUnderscore(pet?.name)}${pet?.upgraded ? '+' : ''}`;
// Strongest first, as the tournament ranks them
const byPower = (a, b) => (b?.tourPower ?? 0) - (a?.tourPower ?? 0);
// The power number after the game's power glyph, as the tournament screen draws it
const POWER_SX = { display: 'inline-flex', alignItems: 'center', gap: 0.5 };

// A tile per companion, its name under the sprite and its tour power, a group each for owned and not yet owned: a table
// row each ran twice the old page's height on a desktop. Not yet owned greys the sprite, as a not-found tile does.
// sectionFailed: the game's catalog at its base power, with no owned state and no Toolbar
const Companions = ({ companions, sectionFailed }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('tournament-companions', COMPANIONS_TOOLBAR);
  // The grid follows the search a beat behind the box, so typing stays responsive
  const searchText = useDeferredValue(toolbar?.search ?? '');
  const query = sectionFailed ? '' : searchText.trim().toLowerCase();
  // acquired also covers Pet Bonus Token / simulated pets, which can't be entered in the tournament.
  const acquired = (companions ?? []).filter((pet) => pet?.copies > 0);
  const notOwned = (companions ?? []).filter((pet) => !(pet?.copies > 0) && isReleased(pet));
  const catalog = (Array.isArray(companionsData) ? companionsData : Object.values(companionsData ?? {})).filter(isReleased);
  const bands = sectionFailed
    ? [{ key: 'all', label: 'Companions', rows: catalog }]
    : [{ key: 'owned', label: 'Owned', rows: acquired }, { key: 'not', label: 'Not yet owned', rows: notOwned, missing: true }];
  // A searched group keeps its whole count, as Death Note's do
  const shownBands = bands.map((band) => ({
    ...band,
    count: band.rows.length,
    rows: (query ? band.rows.filter((pet) => cleanUnderscore(pet?.name).toLowerCase().includes(query)) : band.rows).toSorted(byPower)
  })).filter(({ rows }) => rows.length);
  return <Box>
    {sectionFailed ? null : <Toolbar state={toolbar} defaults={COMPANIONS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                                     total={countOf(bands)} shown={countOf(shownBands)} noun={'companions'}>
      <Toolbar.Search placeholder={'Search companions'}/>
    </Toolbar>}
    <Stack gap={3}>
      {shownBands.map(({ key, label, count, rows, missing }) => <Stack key={key} gap={1.5} component={'section'} aria-label={label}>
        <Typography variant={'sectionTitle'} component={'h2'}>
          {label} <Box component={'span'} sx={{ color: 'text.secondary', fontWeight: 400 }}>{count}</Box>
        </Typography>
        {/* Three lines for a name: the champions' differ only at their end */}
        <CardGrid size={'icon'} fill={LABELED_TILE_MIN}>
          {rows.map((pet) => <IconTile key={pet.name} icon={monsterSprite(pet?.name)} alt={nameOf(pet)} label={nameOf(pet)} labelLines={3}
                                       status={missing ? 'missing' : undefined}
                                       value={<Box component={'span'} sx={POWER_SX}>
                                         <GameIcon src={'etc/Companion_Power.png'} size={16} alt={'Power'}/>
                                         {formatGame(pet?.tourPower ?? 0, 'Stuff2.PetTournyPOW')}
                                       </Box>}/>)}
        </CardGrid>
      </Stack>)}
    </Stack>
  </Box>;
};

export default Companions;
