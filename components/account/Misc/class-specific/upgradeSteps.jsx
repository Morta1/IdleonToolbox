import { Box, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';

// A plan's rows, as every optimizer reads them.

const NOWRAP_SX = { whiteSpace: 'nowrap' };
// The game's max level for an upgrade with no cap (most of the Compass's): a "/ 999,999" says nothing
const NO_CAP = 999999;

// "Lv 99 → 100 / 100": where the step starts and the level it buys to; a group from its first step's start. Not every
// upgrade set has a max level (clam work upgrades are uncapped), so the max shows only where there is a real one.
export const stepLevels = (upgrade, max = upgrade?.x4) => {
  const grouped = upgrade?.sequence?.length > 1;
  const to = grouped ? upgrade.finalLevel : upgrade?.level;
  const from = (grouped ? upgrade.startLevel : upgrade?.level) - 1;
  return `Lv ${formatNum(from)} → ${formatNum(to)}${Number.isFinite(max) && max < NO_CAP ? ` / ${formatNum(max)}` : ''}`;
};

// How many times a grouped row buys its upgrade, the number its card is about: "x48" at the card's top right. A
// single step is one purchase, so it has none.
export const stepCount = (upgrade) => {
  const count = upgrade?.sequence?.length ?? 0;
  return count > 1 ? <Typography variant={'body1'} component={'span'} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
    x{formatNum(count)}
  </Typography> : null;
};

// A table's Level cell: the levels, and a grouped row's count after them in bold ("Lv 351 → 399 x48"), as its card has it
export const stepLevelCell = (upgrade, max) => {
  const count = upgrade?.sequence?.length ?? 0;
  return <>
    {stepLevels(upgrade, max)}
    {count > 1 ? <Box component={'span'} sx={{ fontWeight: 600, ml: 1 }}>x{formatNum(count)}</Box> : null}
  </>;
};

// Under a table row's name below md, where the Level column (and its count) folds into the row's details: a closed
// row on a phone still says how many times to buy
export const stepCountUnderName = (upgrade) => {
  const count = upgrade?.sequence?.length ?? 0;
  return count > 1 ? <Box component={'span'} sx={{ display: { xs: 'block', md: 'none' }, typography: 'body2', fontWeight: 600 }}>
    x{formatNum(count)}
  </Box> : null;
};

// A card's meta: its levels, and a single step's place in the plan ("Upgrade #10"), each kept whole so the line wraps
// only between them. A group's card carries its count instead (stepCount): its steps' places across the plan read as
// noise under the name. extra is a third part, as Spelunking's All names a card's category.
export const stepMeta = (upgrade, { max, extra } = {}) => {
  const parts = [stepLevels(upgrade, max), upgrade?.sequence?.length > 1 ? null : `Upgrade #${upgrade?.upgradeIndex + 1}`, extra]
    .filter(Boolean);
  return parts.map((part, index) => <Box key={index} component={'span'} sx={NOWRAP_SX}>{index ? ' · ' : null}{part}</Box>);
};
