import React from 'react';
import { Stack } from '@mui/material';
import { formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { cleanText } from '@utility/goals/registry/names';
import { getArmoryTotalUpgradeCost, ROYAL_RESOURCE_NAMES } from '@parsers/class-specific/royalGuardian';
import MasterclassUpgradeCard from '../MasterclassUpgradeCard';
import CardGrid from '@components/common/cards/CardGrid';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { matchesUpgradeSearch } from '../matchesUpgradeSearch';
import UpgradeHelpIcon from '@components/common/UpgradeHelpIcon';

// Shelf order (the in-game armory layout) unless a sort is picked. A saved checkbox from before resets once: the old
// shared "Hide maxed/locked upgrades" keys ticked four pages at once.
const ARMORY_TOOLBAR = { search: '', sort: null, hideMaxed: false, hideLocked: false };
const SORT_VALUE = { cost: (upgrade) => upgrade.cost || 0, level: (upgrade) => upgrade.level || 0 };

// The armory renders every upgrade at its OWN shelf currency icon (RGres{costResourceIndex}.png) -
// this is the game's own render, not a per-upgrade icon; there is no such asset.
// costing: the page's Levels ahead and Daily Shopping Spree (its Page settings). sectionFailed: the shelves at zero by
// name (the parser's empty save), with no cost, state or Toolbar.
const Armory = ({ account, upgrades, resourceStorage, resourcePerHour, costing, sectionFailed }) => {
  const { levelsAhead = 1, forceLegendTalent, isOverridden } = costing ?? {};
  const [view, setView, resetView] = useToolbarState('royal-armory-armory', ARMORY_TOOLBAR);

  // Only the 69 shelf slots are ever shown - the 14 catalog ids with no slot aren't purchasable
  // and have no shelf position to render in (see task C2 brief).
  const shelved = (upgrades ?? []).filter((upgrade) => upgrade.slot >= 0).toSorted((a, b) => a.slot - b.slot);
  const shown = sectionFailed ? shelved : shelved.filter((upgrade) => matchesUpgradeSearch(upgrade, view?.search)
    && !(view?.hideMaxed && upgrade.maxed)
    && !(view?.hideLocked && !upgrade.unlocked));
  const sorted = view?.sort && !sectionFailed
    ? shown.toSorted((a, b) => (view.sort.order === 'desc' ? -1 : 1) * (SORT_VALUE[view.sort.key](a) - SORT_VALUE[view.sort.key](b)))
    : shown;

  return (
    <Stack direction="column" gap={4}>
      {sectionFailed ? null : <Toolbar state={view} defaults={ARMORY_TOOLBAR} onChange={setView} onReset={resetView}
                                       total={shelved.length} shown={shown.length} noun={'shelves'}>
        <Toolbar.Search placeholder={'Search shelves'}/>
        <Toolbar.Sort options={[['cost', 'Cost', 'asc'], ['level', 'Level', 'desc']]}/>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
        <Toolbar.Filter name={'hideLocked'} label={'Hide locked'}/>
      </Toolbar>}
      {sorted.length ? <CardGrid size={'m'}>
        {sorted.map((upgrade) => {
          const {
            index, name, description, level, maxLevel, cost, unlocked, maxed, slot, shelfUnlockTotalLevels,
            costResourceIndex, costResourceRawName
          } = upgrade;
          const capped = maxLevel < 999;
          const stored = resourceStorage?.[costResourceIndex] ?? 0;
          const targetLevel = Math.min(level + levelsAhead, capped ? maxLevel : Infinity);
          const nextCost = isOverridden && !maxed ? getArmoryTotalUpgradeCost(account, upgrade, level + 1, forceLegendTalent) : cost;
          const targetCost = maxed ? 0 : getArmoryTotalUpgradeCost(account, upgrade, targetLevel, forceLegendTalent);
          const income = resourcePerHour?.[costResourceIndex] ?? 0;
          const missing = Math.max(0, targetCost - stored);
          // How far off the priced level is, at the outposts' income (the Resources tab's)
          const footerLine = sectionFailed || maxed || missing <= 0 ? null : income > 0
            ? `Ready in ${formatDuration(3600 * missing / income)} at ${formatGame(income, 'RoyalG.OutpostResourceRate')}/hr`
            : 'Not collected by any outpost';

          return <MasterclassUpgradeCard key={index}
                                         name={name}
                                         icon={costResourceRawName}
                                         helpIcon={<UpgradeHelpIcon label={cleanText(name)} panel="armory" index={index}/>}
                                         level={level}
                                         maxLevel={capped ? maxLevel : Infinity}
                                         // The parser turns the game's @ into line breaks: one line each
                                         description={cleanText(description).split('\n')}
                                         currencyIcon={costResourceRawName}
                                         currencyName={ROYAL_RESOURCE_NAMES[costResourceIndex] ?? ''}
                                         costGame={'RoyalG.ArmoryUpgCost'}
                                         owned={stored}
                                         nextCost={nextCost}
                                         targetLevel={targetLevel}
                                         targetCost={targetCost}
                                         // The game numbers shelves from 1, the catalog slots from 0
                                         unlockText={`Shelf ${formatNum(slot + 1)}${unlocked ? '' : ` · unlocks at ${formatNum(shelfUnlockTotalLevels)} levels`}`}
                                         footerLine={footerLine}
                                         unlocked={unlocked}
                                         catalogOnly={sectionFailed}/>;
        })}
      </CardGrid> : null}
    </Stack>
  );
};

export default Armory;
