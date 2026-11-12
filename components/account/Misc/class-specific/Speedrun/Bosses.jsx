import React from 'react';
import { Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';

// The run's sentence for the account it reads: a guest has no Voidwalker to read it off
const bossNote = ({ bossPortals, runUnlocked, hasVoidwalker, emptyAccount }) => {
  if (!hasVoidwalker && emptyAccount) return 'Your Voidwalker\'s boss portals show here once you sign in.';
  if (bossPortals > 0) {
    return `+${formatNum(bossPortals)} portals per run from bosses. Each boss kill is worth its difficulty plus one, and speeds mob respawn for the rest of the run.`;
  }
  return runUnlocked ? 'Level "Bossing Vain" to make boss kills count as portals.' : 'Level "Void Trial Rerun" to start a speedrun.';
};

// One small tile per world boss under a section title: six short numbers, not a list to scan. A failed section has
// none, so nothing draws
const Bosses = ({ bosses, bossPortals, runUnlocked, hasVoidwalker, emptyAccount }) => {
  if (!bosses?.length) return null;
  return <Stack gap={1.5} sx={{ mb: 3 }}>
    <Stack gap={0.5}>
      <Typography variant={'sectionTitle'} component={'h2'}>Bosses</Typography>
      <Typography variant={'body2'} color={'text.secondary'}>{bossNote({ bossPortals, runUnlocked, hasVoidwalker, emptyAccount })}</Typography>
    </Stack>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {bosses.map(({ mapIndex, name, world, difficultyName, portals, payoutBossName }) => <StatTile
        key={mapIndex} label={name} value={`+${formatNum(bossPortals > 0 ? portals : 0)} portals`}
        sub={`World ${formatNum(world)} · ${difficultyName}`}
        info={payoutBossName ? `Pays out on ${payoutBossName}'s difficulty: a game bug.` : undefined}/>)}
    </Stack>
  </Stack>;
};

export default Bosses;
