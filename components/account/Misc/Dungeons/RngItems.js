import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, notateNumber } from '@utility/helpers';
import React from 'react';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// The game's rarity order; each is a Panel named with the game's word
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const nextLevelCost = ({ level, rarity }) => {
  const baseCost = 1 + .7 * Math.pow(level, 1.5 + .05 * level);
  const costMulti = RARITIES.indexOf(rarity);
  return Math.floor(baseCost * (1 + (costMulti + 1) * Math.pow(4, (costMulti + 2.348) / 2.348)));
};

// The game reads a level under 0 as not found
const isFound = (item) => (item?.level ?? 0) >= 0;
const isMaxed = (item) => isFound(item) && (item?.level ?? 0) >= (item?.maxLevel ?? Infinity);

const rngDetails = (item, credits, sectionFailed) => {
  const { name, level = 0, desc = '', baseValue = 0, increment = 0, maxLevel } = item ?? {};
  if (sectionFailed) return cleanUnderscore(name);
  // The game's sentence: its { filled in MultiplierInfo
  const sentence = cleanUnderscore(desc.replace('{', notateNumber(baseValue + increment * Math.max(0, level), 'MultiplierInfo')));
  return <Stack gap={1}>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(name)}</Typography>
    <Typography variant={'body2'}>{sentence}</Typography>
    {!isFound(item) ? <StatusText status={'needs'}>Not found yet</StatusText>
      : level >= maxLevel ? <StatusText status={'maxed'}>Max level</StatusText>
        : <ItemCard.Section label={'Next level cost'}>
          <ItemCard.Cost icon={'data/DungCredits1.png'} iconAlt={'Credits'} game={'DungeonCalc.RngUpgCost'}
                         need={nextLevelCost(item)} have={credits ?? 0}/>
        </ItemCard.Section>}
  </Stack>;
};

const RNG_TOOLBAR = { hideMaxed: false };

// Most items max out on a late account, so the ones left are a filter away rather than a mark on every tile
const RngItems = ({ rngItems, credits, sectionFailed }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('dungeon-rng-items', RNG_TOOLBAR);
  const list = rngItems ?? [];
  const hideMaxed = !sectionFailed && toolbar?.hideMaxed;
  const shown = hideMaxed ? list.filter((item) => !isMaxed(item)) : list;
  return <Stack gap={2}>
    {sectionFailed ? null : <Toolbar state={toolbar} defaults={RNG_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                                     total={list.length} shown={shown.length} noun={'items'}>
      <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
    </Toolbar>}
    {RARITIES.map((rarity) => {
      const all = list.filter((item) => item?.rarity === rarity);
      const items = shown.filter((item) => item?.rarity === rarity);
      if (!items.length) return null;
      const found = all.filter(isFound).length;
      return <Panel key={rarity} title={rarity}
                    meta={sectionFailed ? undefined : `${formatNum(found)} of ${formatNum(all.length)} found`}>
        <Box sx={{ p: 1.5 }}>
          <CardGrid size={'icon'} fill>
            {items.map((item) => <IconTile key={item?.index} icon={`data/DungItems${item?.index}.png`} alt={cleanUnderscore(item?.name)}
                                           value={sectionFailed ? undefined : `${formatNum(Math.max(0, item?.level ?? 0))} / ${formatNum(item?.maxLevel ?? 0)}`}
                                           status={!sectionFailed && !isFound(item) ? 'missing' : undefined}
                                           details={rngDetails(item, credits, sectionFailed)}/>)}
          </CardGrid>
        </Box>
      </Panel>;
    })}
  </Stack>;
};

export default RngItems;
