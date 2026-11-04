import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import React from 'react';
import { SUMMONING_COLOURS } from '@parsers/world-6/summoning';
import useHydrated from '@hooks/useHydrated';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const UPGRADES_TOOLBAR = { sort: null, view: 'group' };
// The upgrades that make every upgrade cheaper ("cost }% less Essence")
const COST_UPGRADES = [49, 57, 72];

const Upgrades = ({ upgrades, essences, familiarCostReset }) => {
  const hydrated = useHydrated();
  // How long the familiar's cost has until it resets, in seconds: read only once hydrated, so the export and the first
  // render agree. A reset the save's clock has already passed is not "resets in": it says so instead.
  const resetIn = hydrated && familiarCostReset ? (familiarCostReset - new Date().getTime()) / 1000 : null;
  const resetLine = (line) => {
    if (!line.includes('|')) return line;
    if (resetIn === null) return '';
    return resetIn > 0 ? line.replace('|', formatDuration(resetIn)) : 'Cost has reset since this save.';
  };
  // The game's fill (N.js, the upgrade panel): every { is the bonus in commas (Summoning.SummUpgBonus), } the total
  // in commas, except the cost upgrades, whose } is the share they take off the cost; | is the familiar cost's reset,
  // here as the time left. A line whose } the parser has no total for is left out rather than printed empty.
  const bonusText = (bonus, value, totalBonus, originalIndex) => {
    const total = COST_UPGRADES.includes(originalIndex)
      ? formatNum(100 * (1 - 1 / (1 + (value ?? 0) / 100)), 'pct', { bare: true })
      : typeof totalBonus === 'number' ? formatGame(totalBonus, 'Summoning.SummUpgBonus') : null;
    return bonus.split('@').filter((line) => total !== null || !line.includes('}')).map(resetLine).filter(Boolean).join('@')
      .replaceAll('{', formatGame(value ?? 0, 'Summoning.SummUpgBonus'))
      .replaceAll('}', total ?? '');
  };
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('summoning-upgrades', UPGRADES_TOOLBAR);
  const byCost = toolbar?.sort?.key === 'cost';
  const descending = toolbar?.sort?.order === 'desc';
  // Maxed upgrades cost nothing, so they go last whichever way the cost runs (the old "Sort by cost" left them out)
  const sorted = (list) => (byCost ? [...list].sort((a, b) => (a.level >= a.maxLvl) - (b.level >= b.maxLvl)
    || (descending ? b.totalCost - a.totalCost : a.totalCost - b.totalCost)) : list);

  const listForm = Object.values(upgrades || {}).flat();

  // One card for both views: the cost reads "owned / cost" against its colour's essence
  const upgradeCard = ({ level, value, maxLvl, name, bonus, totalBonus, doubled, totalCost, originalIndex, colour }, key) => {
    const colourIndex = Number(colour);
    return <ItemCard key={key} icon={`data/SumUpgIc${originalIndex}.png`} title={cleanUnderscore(name)}
                     level={{ value: level, max: maxLvl }} status={level >= maxLvl ? 'maxed' : undefined}
                     dimmed={!(level > 0 || (colour === '0' && originalIndex === 2))}
                     aside={doubled ? <GameIcon src={'etc/Doubled.png'} size={24} alt={'Doubled'}/> : null}
                     footer={<ItemCard.Cost icon={`data/SummC${colourIndex + 1}.png`}
                                            iconAlt={`${SUMMONING_COLOURS[colourIndex]} essence`}
                                            need={totalCost ?? 0} have={essences?.[colourIndex]}/>}>
      <ItemCard.Desc text={bonusText(bonus, value, totalBonus, originalIndex)}/>
    </ItemCard>;
  };

  return <Box>
    <Toolbar state={toolbar} defaults={UPGRADES_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}>
      <Toolbar.Sort options={[['cost', 'Cost', 'asc']]}/>
      <Toolbar.View options={[['group', 'By color'], ['grid', 'All']]}/>
    </Toolbar>
    {toolbar?.view === 'grid'
      ? <CardGrid size={'m'}>{sorted(listForm).map((upgrade, index) => upgradeCard(upgrade, 'upgrade-' + index))}</CardGrid>
      : <Stack gap={3}>
        {Object.entries(upgrades || {})?.map(([colorIndex, colorUpgrades]) => (SUMMONING_COLOURS[colorIndex]
          ? <Stack key={'color-upgrade-' + colorIndex} gap={1}>
            <Typography variant={'sectionTitle'} component={'h2'}>{SUMMONING_COLOURS[colorIndex]}</Typography>
            <CardGrid size={'m'}>
              {sorted(colorUpgrades).map((upgrade, index) => upgradeCard(upgrade, 'upgrade-' + colorIndex + '-' + index))}
            </CardGrid>
          </Stack> : null))}
      </Stack>}
  </Box>
};

export default Upgrades;
