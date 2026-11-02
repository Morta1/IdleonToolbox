import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import React from 'react';
import { SUMMONING_COLOURS } from '@parsers/world-6/summoning';
import useRealDate from '@hooks/useRealDate';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';

const UPGRADES_TOOLBAR = { sort: null, view: 'group' };

const Upgrades = ({ upgrades, essences, familiarCostReset }) => {
  const getRealDateInMs = useRealDate();
  // The game's | is the familiar cost's reset date
  const bonusText = (bonus, value, totalBonus) => bonus.replace('{', value).replace('}', totalBonus)
    .replace('|', familiarCostReset ? getRealDateInMs(familiarCostReset) : '');
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
      <ItemCard.Desc text={bonusText(bonus, value, totalBonus)}/>
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
