import React from 'react';
import { Box } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';

// A name and a score per row: two columns, so a Panel list rather than a table (Tables board, "A table needs a
// header" with 3 or more columns). A score with upgrades (Hoops, Darts) lists them in a group of its own under the
// scores, so nothing in the Panel opens only on a tap.
const Highscores = ({ title, highscore }) => {
  const sorted = (highscore ?? []).toSorted((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  return <Panel title={title}>
    {sorted.map((row) => <Panel.KV key={row?.name} label={row?.name?.capitalize()} value={formatNum(Number(row?.score) || 0)}/>)}
    {sorted.filter((row) => row?.upgrades?.length).map((row) => <Panel.Group key={row?.name} label={`${row?.name?.capitalize()} upgrades`}>
      <Panel.KV label={'Total points'} value={formatNum(row?.totalPoints ?? 0)}/>
      {row?.upgrades?.map((upgrade, index) => <Panel.KV key={index} label={cleanUnderscore(upgrade?.description)}
                                                        value={upgrade?.unlocked || !upgrade?.pointsToUnlock
                                                          ? <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{formatNum(upgrade?.level ?? 0, 'level')}</Box>
                                                          : `Unlocks at ${formatNum(upgrade.pointsToUnlock)} points`}/>)}
    </Panel.Group>)}
  </Panel>;
};

export default Highscores;
