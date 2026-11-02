import React from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { cleanText } from '@utility/goals/registry/names';
import { CardTitleAndValue } from '@components/common/styles';
import { getTotalStatueLevels } from '@parsers/class-specific/royalGuardian';

const TIER_NOTE = 'Total marble to bring every statue of that marble up to this level from its current level.';
const LOCKED_TIER_NOTE = 'Locked: needs the Menagerie unlock that boosts max Flair LV of Statues to Elegant.';

// A marble's costs to bring every statue to each flair level. A locked flair or tier keeps its amounts, in the muted
// color: they are what the player plans toward. Otherwise a cost already covered says so beside its amount.
const flairColumns = (statueFlair) => [
  {
    key: 'marble', label: 'Marble', value: ({ name }) => cleanUnderscore(name),
    icon: ({ costItem }) => <GameIcon src={`data/${costItem}.png`} alt={''} size={32}/>
  },
  { key: 'owned', label: 'Owned', numeric: true, value: ({ owned }) => owned, render: ({ owned }) => notateNumber(owned) },
  { key: 'left', label: 'Statues left', numeric: true, value: ({ statuesLeft }) => statuesLeft },
  ...(statueFlair?.marbleTotals?.[0]?.tiers ?? []).map((_, tier) => {
    const locked = tier >= statueFlair?.maxLevel;
    return {
      key: `tier-${tier}`,
      label: `All to Lv ${tier + 1}`,
      numeric: true,
      // Short amounts: every column fits a 600 px window
      from: 'sm',
      info: locked ? LOCKED_TIER_NOTE : tier === 0 ? TIER_NOTE : undefined,
      ...(locked ? { cellSx: { color: 'text.muted' } } : {}),
      render: ({ owned, tiers }) => {
        const cost = tiers?.[tier];
        if (locked || !statueFlair?.unlocked) return cost > 0 ? notateNumber(cost) : 'Done';
        if (cost <= 0) return <StatusText status={'maxed'}>Done</StatusText>;
        return owned >= cost ? <StatusText status={'ready'}>{notateNumber(cost)}</StatusText> : notateNumber(cost);
      }
    };
  })
];

const RoyalStatues = ({ royalStatues, statueFlair, statueLevels }) => {
  return (
    <Stack direction="column" gap={4}>
      <Stack direction="row" gap={{ xs: 1, md: 3 }} flexWrap="wrap">
        <CardTitleAndValue title={'Total Statue Levels'} value={notateNumber(getTotalStatueLevels(statueLevels))}/>
      </Stack>
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="stretch">
        {royalStatues?.map(({ index, description, level, bonus, upgradeOdds, costItem, named }) => (
          <Card key={index}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', width: 300, minHeight: 190 }}>
              <Stack direction="row" gap={2} alignItems="center">
                <img style={{ width: 32, height: 32 }} src={`${prefix}data/${costItem}.png`} alt=""/>
                <Typography>Statue {index} (Lv {level})</Typography>
                {!named ? <StatusText status={'locked'}>Unreleased</StatusText> : null}
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Typography>{named ? cleanText(description) : 'Not yet released in-game.'}</Typography>
              <Divider sx={{ my: 1, mt: 'auto' }}/>
              <Typography variant="body2">Bonus: {notateNumber(bonus)}</Typography>
              <Stack direction="row" gap={1} alignItems="center">
                <Typography variant="body2">Upgrade odds: 1 in {notateNumber(Math.round(1 / upgradeOdds))}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Divider/>

      <Stack gap={2}>
        <Stack gap={1.5}>
          <Stack direction="row" gap={2} alignItems="center">
            <Typography variant={'sectionTitle'} component={'h2'}>Statue Flair</Typography>
            {!statueFlair?.unlocked ? <StatusText status={'locked'}/> : null}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Enhances a regular statue's EXP multiplier once unlocked by the Statue Flair armory upgrade.
          </Typography>
          {statueFlair?.marbleTotals?.length > 0 ? (
            // A phone hides columns behind chevrons, so the table takes the width it has instead of its own.
            <Box sx={{ width: { xs: '100%', sm: 'fit-content' }, maxWidth: '100%' }}>
              <DataTable columns={flairColumns(statueFlair)} rows={statueFlair.marbleTotals} rowKey={'shardIndex'}
                         rowLabel={({ name }) => cleanUnderscore(name)} surface={'card'}
                         // Locked flair: every cell in the muted color, its amounts kept.
                         sx={statueFlair?.unlocked ? undefined : { '& td': { color: 'text.muted' } }}/>
            </Box>
          ) : null}
        </Stack>
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="stretch">
          {statueFlair?.statues?.map(({ index, name, level, maxLevel, cost, bonus, expMulti, costItem }) => (
            <Card key={index} sx={{ opacity: statueFlair?.unlocked ? 1 : 0.5 }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', width: 240, minHeight: 150 }}>
                <Typography>{cleanText(name)} ({level} / {maxLevel})</Typography>
                <Divider sx={{ my: 1 }}/>
                <Typography variant="body2">EXP multi: {notateNumber(expMulti, 'MultiplierInfo')}x</Typography>
                <Typography variant="body2">Bonus: +{notateNumber(bonus)}%</Typography>
                <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 'auto' }}>
                  <img style={{ width: 20, height: 20 }} src={`${prefix}data/${costItem}.png`} alt=""/>
                  <Typography variant="body2">Cost: {notateNumber(cost)}</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RoyalStatues;
