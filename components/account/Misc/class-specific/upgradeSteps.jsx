import { Box } from '@mui/material';
import { formatNum } from '@utility/helpers';

// A plan's rows, as every optimizer reads them.

const NOWRAP_SX = { whiteSpace: 'nowrap' };

// "Lv 99 → 100 / 100": where the step starts and the level it buys to; a group from its first step's start. Not every
// upgrade set has a max level (clam work upgrades are uncapped), so the max shows only where there is one.
export const stepLevels = (upgrade, max = upgrade?.x4) => {
  const grouped = upgrade?.sequence?.length > 1;
  const to = grouped ? upgrade.finalLevel : upgrade?.level;
  const from = (grouped ? upgrade.startLevel : upgrade?.level) - 1;
  return `Lv ${formatNum(from)} → ${formatNum(to)}${Number.isFinite(max) ? ` / ${formatNum(max)}` : ''}`;
};

// Where a row sits in the plan. Summary and Game order gather one upgrade's steps from all over the plan, so a range alone
// would claim an order they never had: those say how many steps the range holds.
const stepPlace = (upgrade) => {
  const places = upgrade?.sequence?.length > 1 ? upgrade.sequence.map((step) => step.upgradeIndex + 1) : [upgrade.upgradeIndex + 1];
  if (places.length === 1) return `Upgrade #${places[0]}`;
  const first = Math.min(...places);
  const last = Math.max(...places);
  return `${last - first + 1 === places.length ? 'Upgrades ' : `${places.length} upgrades, `}#${first} to #${last}`;
};

// A card's meta: its levels and its place in the plan each stay whole ("Upgrade #10"), so the line wraps only between them.
// extra is a third part, as Spelunking's All names a card's category.
export const stepMeta = (upgrade, { max, extra } = {}) => <>
  <Box component={'span'} sx={NOWRAP_SX}>{stepLevels(upgrade, max)}</Box>{' · '}
  <Box component={'span'} sx={NOWRAP_SX}>{stepPlace(upgrade)}</Box>
  {extra ? <>{' · '}<Box component={'span'} sx={NOWRAP_SX}>{extra}</Box></> : null}
</>;
