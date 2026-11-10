import React from 'react';
import { Typography } from '@mui/material';
import { formatNum, notateNumber } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import PageSettings from '@components/common/PageSettings';

// Typed values need a ceiling: totals are summed one level at a time and some upgrades (Royal
// Armory past 999, Menagerie boosts) have no cap.
export const MAX_LEVELS_AHEAD = 1000;

// The total of costAt(level) over every level from `from` up to (not including) `to`: what buying up to `to` costs.
export const sumLevelCosts = (costAt, from, to) => {
  let total = 0;
  for (let level = Math.max(0, from ?? 0); level < to; level++) total += costAt(level);
  return total;
};

// The gear's "Levels ahead" row; `noun` names what each card prices.
export const LevelsAheadSetting = ({ noun = 'upgrade', help }) => <PageSettings.Number
  name={'levelsAhead'} label={'Levels ahead'} defaultValue={1} min={1} max={MAX_LEVELS_AHEAD} integer
  help={help ?? `Each ${noun} also shows the total cost of this many levels.`}/>;

// Far enough ahead, some cost curves (Compass within a few hundred levels) sum past the largest
// number JS can hold, and notateNumber renders Infinity as "NaNEInfinity".
export const formatLevelsAheadCost = (cost) => Number.isFinite(cost) ? notateNumber(cost, 'Big') : '∞';

// The "Lv N: cost" line under a card's cost row, for when the picker reaches past the next level. Like ItemCard.Cost
// above it: green when the owned amount covers it, amber and "need X more" when not, so it never rests on color alone.
// indent lines it up with the cost text, past the currency icon.
export const LevelsAheadCaption = ({ targetLevel, targetCost, owned, format = formatLevelsAheadCost, indent = 44 }) => {
  const short = owned < targetCost;
  return <Typography variant="caption" color="text.secondary" sx={{ pl: `${indent}px` }}>
    {'Lv '}{targetLevel}{': '}
    <Typography component="span" variant="caption" fontWeight={600} color={short ? 'text.warning' : 'text.success'}>
      {Number.isFinite(targetCost) ? format(targetCost) : '∞'}
    </Typography>
    {short ? <>{' · need '}{Number.isFinite(targetCost) ? format(targetCost - owned) : '∞'}{' more'}</> : null}
  </Typography>;
};

// A page whose Upgrades tab alone is priced ahead (Minehead, Sushi Station, Jelly Operator)
export const UPGRADES_AHEAD_SETTINGS = { levelsAhead: null };

export const UpgradesAheadSettings = () => <PageSettings.Group title={'Upgrades'}>
  <LevelsAheadSetting/>
</PageSettings.Group>;

// For a cost that is a level-free base times costExponent ^ level, so each level ahead is the current cost scaled up.
// Capped at the upgrade's max level; nothing past the next level (or a free upgrade) draws nothing.
export const UpgradeCostAhead = ({ cost, costExponent = 1, level = 0, maxLevel, levelsAhead = 1, owned, game }) => {
  const cap = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : Infinity;
  const targetLevel = Math.min(level + levelsAhead, cap);
  if (levelsAhead <= 1 || !(cost > 0) || targetLevel <= level + 1) return null;
  const targetCost = sumLevelCosts((at) => cost * Math.pow(costExponent, at - level), level, targetLevel);
  return <LevelsAheadCaption targetLevel={formatNum(targetLevel)} targetCost={targetCost} owned={owned ?? 0}
                             format={(value) => formatGame(value, game, { whole: true })} indent={32}/>;
};
