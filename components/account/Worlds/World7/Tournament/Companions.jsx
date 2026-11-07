import React, { useDeferredValue, useState } from 'react';
import { Box } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { monsterSprite } from '@utility/spriteImages';
import { companions as companionsData } from '@website-data';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import usePageTop from '@hooks/usePageTop';
import useToolbarState from '@hooks/useToolbarState';

const isReleased = (pet) => pet?.name && pet?.effect !== 'Not_officially_in_the_game_and_may_never_be';

const COMPANIONS_TOOLBAR = { search: '' };

const columns = [
  {
    key: 'name', label: 'Companion', sortable: true,
    icon: (pet) => <GameIcon src={monsterSprite(pet?.name)} size={24} alt={''}/>,
    value: (pet) => `${cleanUnderscore(pet?.name)}${pet?.upgraded ? '+' : ''}`
  },
  {
    key: 'power', label: 'Tour power', numeric: true, sortable: true, phone: true,
    sortValue: (pet) => pet?.tourPower ?? 0,
    render: (pet) => formatGame(pet?.tourPower ?? 0, 'Stuff2.PetTournyPOW')
  }
];

const countOf = (bands) => bands.reduce((sum, { rows }) => sum + rows.length, 0);

// sectionFailed: the game's catalog at its base power, with no owned state and no Toolbar
const Companions = ({ companions, sectionFailed }) => {
  const pageTop = usePageTop();
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('tournament-companions', COMPANIONS_TOOLBAR);
  const [toolbarBottom, setToolbarBottom] = useState(null);
  // The table follows the search a beat behind the box, so typing stays responsive
  const searchText = useDeferredValue(toolbar?.search ?? '');
  const query = sectionFailed ? '' : searchText.trim().toLowerCase();
  // acquired also covers Pet Bonus Token / simulated pets, which can't be entered in the tournament.
  const acquired = (companions ?? []).filter((pet) => pet?.copies > 0);
  const notOwned = (companions ?? []).filter((pet) => !(pet?.copies > 0) && isReleased(pet));
  const catalog = (Array.isArray(companionsData) ? companionsData : Object.values(companionsData ?? {})).filter(isReleased);
  const bands = sectionFailed
    ? [{ key: 'all', label: 'Companions', rows: catalog }]
    : [{ key: 'owned', label: 'Owned', rows: acquired }, { key: 'not', label: 'Not yet owned', rows: notOwned }];
  const shownBands = query
    // A searched band keeps its whole count, as Death Note's do
    ? bands.map((band) => ({ ...band, count: band.rows.length, rows: band.rows.filter((pet) => cleanUnderscore(pet?.name).toLowerCase().includes(query)) }))
      .filter(({ rows }) => rows.length)
    : bands;
  return <Box>
    {sectionFailed ? null : <Toolbar state={toolbar} defaults={COMPANIONS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                                     total={countOf(bands)} shown={countOf(shownBands)} noun={'companions'}
                                     onStickyBottom={setToolbarBottom}>
      <Toolbar.Search placeholder={'Search companions'}/>
    </Toolbar>}
    {/* A search that finds nothing has the Toolbar's note, not a header over nothing */}
    {shownBands.length ? <DataTable columns={columns} bands={shownBands} rowKey={'name'} rowLabel={(pet) => cleanUnderscore(pet?.name)}
                                    defaultSort={{ key: 'power', order: 'desc' }} surface={'card'}
                                    stickyTop={toolbarBottom ?? pageTop}/> : null}
  </Box>;
};

export default Companions;
