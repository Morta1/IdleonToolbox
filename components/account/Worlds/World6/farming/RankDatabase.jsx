import { Card, CardContent, Stack, Typography, Select, MenuItem, FormControl, InputLabel, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import React, { useState, useMemo } from 'react';


const SortBy = {
  Default: 'default',
  BestBonus: 'bestBonus',
};

const RankDatabase = ({ plot, ranks, hasLandRank }) => {
  const avgLandRank = useMemo(() => plot.reduce((sum, p) => sum + (p.rank || 0), 0) / plot.length || 0, [plot]);
  const [sortBy, setSortBy] = useState(SortBy.Default);
  const [bonusLevel, setBonusLevel] = useState(25);
  const [hideSeedOf, setHideSeedOf] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [groupByUpgrade, setGroupByUpgrade] = useState(false);

  const sortedRanks = useMemo(() => {
    let ranksWithIndex = ranks ? ranks.map((rank, idx) => ({ ...rank, originalIndex: idx })) : [];
    let arr = [...ranksWithIndex];
    if (sortBy === SortBy.BestBonus) {
      arr.sort((a, b) => {
        return percentBonusDiff(b, 1, avgLandRank) - percentBonusDiff(a, 1, avgLandRank);
      });
    }

    if (hideSeedOf) {
      // 'Seed of X' appear every 5th upgrade
      arr = arr.filter(rank => rank.originalIndex % 5 !== 4);
    }
    return arr;
  }, [ranks, sortBy, avgLandRank, bonusLevel, hideSeedOf]);

  function renderRankCard(rank) {
    const { name, upgradeLevel, description, bonus, unlockAt, originalIndex } = rank;
    const filter = 99 < upgradeLevel || 0 === (originalIndex + 1) % 5 || (24 < upgradeLevel
      ? 'grayscale(1)'
      : .5 < upgradeLevel && 'hue-rotate(330deg)')
    return (
      <Card key={'rank-' + originalIndex} sx={{ width: 300, opacity: upgradeLevel === 0 || !hasLandRank ? .5 : 1 }}>
        <CardContent>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <img src={`${prefix}data/RankUpg${originalIndex}.png`} style={{ filter }} alt={''} />
            <Stack>
              <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
              <Typography variant={'body1'}>Lv. {hasLandRank ? upgradeLevel : 0}</Typography>
              {upgradeLevel <= 0 ? <Typography>
                Unlocks at {unlockAt}
              </Typography> : null}
            </Stack>
          </Stack>
          <Typography mt={1}
            variant={'body1'}>{cleanUnderscore(description).replace('{', hasLandRank ? round(bonus) : 0)}</Typography>
          {!minimized && upgradeLevel > 0 && hasLandRank ? (
            <Stack>
              {BonusTooltip(rank, 1, avgLandRank)}
              {BonusTooltip(rank, bonusLevel, avgLandRank)}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  function groupRanksByName(ranks) {
    const groups = {};
    ranks.forEach(rank => {
      const words = cleanUnderscore(rank.name).split(' ');
      const groupName = words.length > 1 ? words.slice(0, -1).join(' ') : words[0];
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(rank);
    });
    return groups;
  }

  function renderGroupedRanks(ranks) {
    const groups = groupRanksByName(ranks);
    return Object.entries(groups).map(([groupName, groupRanks]) => (
      <Stack key={groupName} sx={{ mb: 2, width: '100%' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>{cleanUnderscore(groupName)}</Typography>
        <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
          {groupRanks.map(renderRankCard)}
        </Stack>
      </Stack>
    ));
  }

  return <>
    <Stack direction="row" gap={2} mb={2} alignItems="center">
      <FormControl sx={{ minWidth: 180 }} size="small">
        <InputLabel id="sort-by-label">Sort By</InputLabel>
        <Select
          labelId="sort-by-label"
          value={sortBy}
          label="Sort By"
          onChange={e => setSortBy(e.target.value)}
        >
          <MenuItem value={SortBy.Default}>Default</MenuItem>
          <MenuItem value={SortBy.BestBonus}>By Best Bonus</MenuItem>
        </Select>
      </FormControl>
      <TextField
        size="small"
        label={'+N Level Bonus'}
        type="number"
        value={bonusLevel}
        onChange={e => setBonusLevel(Number(e.target.value) || 1)}
        inputProps={{ min: 1, step: 1 }}
        sx={{ minWidth: 120 }}
      />
      <ToggleButtonGroup>
        <ToggleButton
          value="hideSeedOf"
          selected={hideSeedOf}
          onChange={() => setHideSeedOf(v => !v)}
          sx={{ ml: 1 }}
          size="small"
        >Hide 'Seed of' Upgrades</ToggleButton>
        <ToggleButton
          value="minimized"
          selected={minimized}
          onChange={() => setMinimized(v => !v)}
          sx={{ ml: 1 }}
          size="small"
        >Minimized</ToggleButton>
        <ToggleButton
          value="groupByUpgrade"
          selected={groupByUpgrade}
          onChange={() => setGroupByUpgrade(v => !v)}
          sx={{ ml: 1 }}
          size="small"
        >Group by upgrade</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
    {groupByUpgrade
      ? renderGroupedRanks(sortedRanks)
      : <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
          {sortedRanks?.map(renderRankCard)}
        </Stack>
    }
  </>
};

function BonusTooltip(rank, bonusLevel, avgLandRank) {
  return <Typography mt={1} variant={'body2'} color={'text.secondary'}>+{bonusLevel} Level{bonusLevel > 1 && 's'}: {round(flatBonusDiff(rank, bonusLevel, avgLandRank))}% ({round(percentBonusDiff(rank, bonusLevel, avgLandRank))}% increase)</Typography>;
}

function flatBonusDiff(rank, bonusLevel, avgLandRank) {
  return rank.calcBonus(rank.upgradeLevel + bonusLevel, avgLandRank) - rank.calcBonus(rank.upgradeLevel, avgLandRank);
}

function percentBonusDiff(rank, bonusLevel, avgLandRank) {
  return flatBonusDiff(rank, bonusLevel, avgLandRank) / rank.calcBonus(rank.upgradeLevel, avgLandRank) * 100;
}

function round(value, digis = 2) {
  const decimals = Math.pow(10, digis);
  return Math.round(value * decimals) / decimals;
}

export default RankDatabase;
