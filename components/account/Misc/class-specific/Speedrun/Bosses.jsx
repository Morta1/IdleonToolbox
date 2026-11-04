import React from 'react';
import { formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';

// The run's sentence for the account it reads: a guest has no Voidwalker to read it off
const bossNote = ({ bossPortals, runUnlocked, hasVoidwalker, emptyAccount }) => {
  if (!hasVoidwalker && emptyAccount) return 'Your Voidwalker\'s boss portals show here once you sign in.';
  if (bossPortals > 0) return 'Each boss kill is worth its difficulty plus one in portals, and speeds mob respawn for the rest of the run.';
  return runUnlocked ? 'Level "Bossing in Vain" to make boss kills count as portals.' : 'Level "Void Trial Rerun" to start a speedrun.';
};

// One row per world boss; a failed section has none, so no Panel draws over nothing
const Bosses = ({ bosses, bossPortals, runUnlocked, hasVoidwalker, emptyAccount }) => {
  if (!bosses?.length) return null;
  return <Panel title={'Bosses'} meta={bossNote({ bossPortals, runUnlocked, hasVoidwalker, emptyAccount })} sx={{ mb: 3 }}>
    {bosses.map(({ mapIndex, name, world, difficultyName, portals, payoutBossName }) => <Panel.Row
      key={mapIndex} name={name}
      sub={`World ${formatNum(world)} · ${difficultyName}${payoutBossName ? ` · Pays out on ${payoutBossName}'s difficulty (game bug)` : ''}`}
      value={`+${formatNum(bossPortals > 0 ? portals : 0)} portals`}/>)}
  </Panel>;
};

export default Bosses;
