import React from 'react';
import { Stack } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { boneNames, getGrimoireTotalUpgradeCost } from '@parsers/class-specific/grimoire';
import MasterclassUpgradeCard, { masterclassText } from '../MasterclassUpgradeCard';
import CardGrid from '@components/common/cards/CardGrid';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { matchesUpgradeSearch } from '../matchesUpgradeSearch';
import UpgradeHelpIcon from '@components/common/UpgradeHelpIcon';
import { cleanUpgradeName } from '@utility/goals/registry/names';

// A saved checkbox from before resets once: the old shared "Hide maxed/locked upgrades" keys ticked four pages at once
const UPGRADES_TOOLBAR = { search: '', sort: null, hideMaxed: false, hideLocked: false };
const byCost = (order) => (a, b) => (order === 'desc' ? -1 : 1) * ((a.cost || 0) - (b.cost || 0));

// costing: the page's Levels ahead and Daily Shopping Spree (its Page settings)
const Upgrades = ({ account, upgrades, bones, costing }) => {
  const { levelsAhead = 1, forceLegendTalent, isOverridden } = costing ?? {};
  const [view, setView, resetView] = useToolbarState('grimoire-upgrades', UPGRADES_TOOLBAR);
  // A failed grimoire section has no list: an empty catalog, not a crash
  const catalog = upgrades ?? [];
  const shown = catalog.filter((upgrade) => matchesUpgradeSearch(upgrade, view?.search)
    && !(view?.hideMaxed && upgrade.level >= upgrade.x4)
    && !(view?.hideLocked && !upgrade.unlocked));
  const sorted = view?.sort ? shown.toSorted(byCost(view.sort.order)) : shown;

  return (
    <Stack direction="column" gap={4}>
      <Toolbar state={view} defaults={UPGRADES_TOOLBAR} onChange={setView} onReset={resetView}
               total={catalog.length} shown={shown.length} noun={'upgrades'}>
        <Toolbar.Search placeholder={'Search upgrades'}/>
        <Toolbar.Sort options={[['cost', 'Cost', 'asc']]}/>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        <Toolbar.Filter name={'hideLocked'} label={'Hide locked'}/>
      </Toolbar>
      {sorted.length ? <CardGrid size={'m'}>
        {sorted.map((upgrade) => {
          const { name, cost, description, monsterProgress, boneType, unlockLevel, level, unlocked, x4, index } = upgrade;
          const owned = bones?.[boneType] || 0;
          const nextCost = isOverridden ? getGrimoireTotalUpgradeCost(account, upgrade, level + 1, forceLegendTalent) : cost;
          const targetLevel = Math.min(level + levelsAhead, x4);
          const targetCost = targetLevel > level + 1 ? getGrimoireTotalUpgradeCost(account, upgrade, targetLevel, forceLegendTalent) : 0;

          return <MasterclassUpgradeCard key={name + index}
                                         name={name}
                                         icon={`GrimoireUpg${index}`}
                                         helpIcon={<UpgradeHelpIcon label={cleanUpgradeName(name)} panel="grimoire" index={index}/>}
                                         level={level}
                                         maxLevel={x4}
                                         // The three monster ladders' target, after the space the game's "Target:$" lacks
                                         description={masterclassText(description, ` ${monsterProgress ? cleanUnderscore(monsterProgress) : '?'}`)}
                                         currencyIcon={`Bone${boneType}_x1`}
                                         currencyName={boneNames[boneType]}
                                         costGame={'Summoning.GrimoireUpgCost'}
                                         owned={owned}
                                         nextCost={nextCost}
                                         targetLevel={targetLevel}
                                         targetCost={targetCost}
                                         unlockText={unlockLevel > 0 ? `Unlocks at ${formatNum(unlockLevel)} levels` : null}
                                         unlocked={unlocked}/>;
        })}
      </CardGrid> : null}
    </Stack>
  );
};

export default Upgrades;
