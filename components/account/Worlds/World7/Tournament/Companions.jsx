import React from 'react';
import { cleanUnderscore } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { monsterSprite } from '@utility/spriteImages';
import { companions as companionsData } from '@website-data';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import usePageTop from '@hooks/usePageTop';

const isReleased = (pet) => pet?.name && pet?.effect !== 'Not_officially_in_the_game_and_may_never_be';

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

// sectionFailed: the game's catalog at its base power, with no owned state
const Companions = ({ companions, sectionFailed }) => {
  const pageTop = usePageTop();
  // acquired also covers Pet Bonus Token / simulated pets, which can't be entered in the tournament.
  const acquired = (companions ?? []).filter((pet) => pet?.copies > 0);
  const notOwned = (companions ?? []).filter((pet) => !(pet?.copies > 0) && isReleased(pet));
  const catalog = (Array.isArray(companionsData) ? companionsData : Object.values(companionsData ?? {})).filter(isReleased);
  const bands = sectionFailed
    ? [{ key: 'all', label: 'Companions', rows: catalog }]
    : [{ key: 'owned', label: 'Owned', rows: acquired }, { key: 'not', label: 'Not yet owned', rows: notOwned }];
  return <DataTable columns={columns} bands={bands} rowKey={'name'} rowLabel={(pet) => cleanUnderscore(pet?.name)}
                    defaultSort={{ key: 'power', order: 'desc' }} surface={'card'} stickyTop={pageTop}/>;
};

export default Companions;
