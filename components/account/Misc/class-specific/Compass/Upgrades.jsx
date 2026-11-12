import React from 'react';
import { Stack, Typography } from '@mui/material';
import { compass } from '@website-data';
import { dustNames, getCompassDollar, getCompassTotalUpgradeCost } from '@parsers/class-specific/compass';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import MasterclassUpgradeCard, { formatNextLevelBonus, masterclassText } from '../MasterclassUpgradeCard';
import CardGrid from '@components/common/cards/CardGrid';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { matchesUpgradeSearch } from '../matchesUpgradeSearch';

// A saved checkbox from before resets once: the old shared "Hide maxed/locked upgrades" keys ticked four pages at once
const UPGRADES_TOOLBAR = { search: '', sort: null, view: 'paths', hideMaxed: false, hideLocked: false };
// The game's placeholder rows: listed in its data, never in its menu
const PLACEHOLDER = 'Titan_doesnt_exist';
const byCost = (order) => (a, b) => (order === 'desc' ? -1 : 1) * ((a.cost || 0) - (b.cost || 0));

// costing: the page's Levels ahead and Daily Shopping Spree (its Page settings). sectionFailed: the catalog at zero
// (the parser's empty save) by name, with no cost, state or Toolbar.
const Upgrades = ({ account, upgrades, dusts, costing, dollarFills, sectionFailed }) => {
  const { levelsAhead = 1, forceLegendTalent, isOverridden } = costing ?? {};
  const [view, setView, resetView] = useToolbarState('compass-upgrades', UPGRADES_TOOLBAR);
  const catalog = (upgrades ?? []).flatMap(({ path, list }) => (list ?? []).map((upgrade) => ({ ...upgrade, path })))
    .filter(({ description }) => description !== PLACEHOLDER);
  const shown = sectionFailed ? catalog : catalog.filter((upgrade) => matchesUpgradeSearch(upgrade, view?.search)
    && !(view?.hideMaxed && upgrade.level >= upgrade.x4)
    && !(view?.hideLocked && !upgrade.unlocked));
  const sorted = (list) => (view?.sort ? list.toSorted(byCost(view.sort.order)) : list);
  // By path in the game's order, or by dust, cheapest first inside each (as the Type sort did); a group with nothing
  // shown draws nothing
  const groups = view?.view === 'dust' && !sectionFailed
    ? Object.keys(dustNames).map((type) => ({
      key: type,
      title: dustNames[type],
      icon: `data/Dust${type}_x1.png`,
      list: shown.filter(({ x3 }) => `${x3}` === type).toSorted(byCost(view?.sort?.order ?? 'asc'))
    }))
    : (upgrades ?? []).map(({ path }) => ({ key: path, title: path, list: sorted(shown.filter((upgrade) => upgrade.path === path)) }));

  const renderUpgradeCard = (upgrade) => {
    const {
      name, cost, description, level, x4, killsProgress, x3, baseIconIndex, index, shapeIcon, unlocksAt, unlocked, path, unlockText
    } = upgrade;
    const owned = dusts?.[x3]?.value || 0;
    const nextCost = isOverridden ? getCompassTotalUpgradeCost(account, upgrade, level + 1, forceLegendTalent) : cost;
    const targetLevel = Math.min(level + levelsAhead, x4);
    const targetCost = targetLevel > level + 1 ? getCompassTotalUpgradeCost(account, upgrade, targetLevel, forceLegendTalent) : 0;
    const iconIndex = baseIconIndex != null && baseIconIndex >= 0 ? baseIconIndex + 106 : index;

    return <MasterclassUpgradeCard key={name + iconIndex}
                                   name={name}
                                   icon={`CompassUpg${iconIndex}`}
                                   frame={shapeIcon}
                                   level={level}
                                   maxLevel={x4}
                                   description={masterclassText(description, getCompassDollar(index, account, dollarFills))}
                                   nextLevelBonus={formatNextLevelBonus(upgrade, 'compass', compass?.[index]?.description)}
                                   extraData={killsProgress ? `Kills: ${formatNum(killsProgress.kills, 'whole')} / ${formatNum(killsProgress.total, 'whole')}` : undefined}
                                   currencyIcon={`Dust${x3}_x1`}
                                   currencyName={dustNames[x3]}
                                   costGame={'Windwalker.CompassUpgCost'}
                                   owned={owned}
                                   nextCost={nextCost}
                                   targetLevel={targetLevel}
                                   targetCost={targetCost}
                                   // A path card opens at its root's level; a slayer or a default card names its own gate
                                   unlockText={unlocked ? null : unlockText ? cleanUnderscore(unlockText)
                                     : unlocksAt > 0 ? `Unlocks at ${path} Lv. ${unlocksAt}` : null}
                                   unlocked={unlocked}
                                   catalogOnly={sectionFailed}/>;
  };

  return (
    <Stack direction="column" gap={4}>
      {sectionFailed ? null : <Toolbar state={view} defaults={UPGRADES_TOOLBAR} onChange={setView} onReset={resetView}
               total={catalog.length} shown={shown.length} noun={'upgrades'}>
        <Toolbar.Search placeholder={'Search upgrades'}/>
        <Toolbar.Sort options={[['cost', 'Cost', 'asc']]}/>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        <Toolbar.Filter name={'hideLocked'} label={'Hide locked'}/>
        <Toolbar.View options={[['paths', 'By path'], ['dust', 'By dust']]}/>
      </Toolbar>}
      {groups.map(({ key, title, icon, list }) => list.length ? <Stack key={key} direction="column" gap={2}>
        <Stack direction="row" alignItems="center" gap={1}>
          {icon ? <GameIcon src={icon} size={24} alt={''}/> : null}
          <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
        </Stack>
        <CardGrid size={'m'}>{list.map(renderUpgradeCard)}</CardGrid>
      </Stack> : null)}
    </Stack>
  );
};

export default Upgrades;
