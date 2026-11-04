import React from 'react';
import { Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getPrismaMulti, getTesseractTotalUpgradeCost, tachyonNames } from '@parsers/class-specific/tesseract';
import MasterclassUpgradeCard, { formatNextLevelBonus, masterclassText } from '../MasterclassUpgradeCard';
import CardGrid from '@components/common/cards/CardGrid';
import GameIcon from '@components/common/GameIcon';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { matchesUpgradeSearch } from '../matchesUpgradeSearch';
import UpgradeHelpIcon from '@components/common/UpgradeHelpIcon';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import { OPT } from '@parsers/accountOptions';

// A saved checkbox from before resets once: the old shared "Hide maxed/locked upgrades" keys ticked four pages at once
const UPGRADES_TOOLBAR = { search: '', sort: null, view: 'list', hideMaxed: false, hideLocked: false };
// The game's placeholder rows: listed in its data, never in its menu
const PLACEHOLDER = 'These_pages_are_missing...';
const byCost = (order) => (a, b) => (order === 'desc' ? -1 : 1) * ((a.cost || 0) - (b.cost || 0));
const round2 = (value) => Math.round(100 * value) / 100;

// The game's own $ fills on the arcane upgrade panel (N.js, the MenuType2 arcane draw), from values the toolbox has;
// Tenteyecle (7) and any other read "?". prismaChance is the picked Arcane Cultist's (the game reads the active
// character's drop rate), so with none the sentence reads "?" too.
const arcaneDollar = (upgrade, { prismaChance, crystalChargeReq, bonusOf }) => {
  switch (upgrade?.index) {
    case 3:
      if (prismaChance == null) return undefined;
      return prismaChance > 0 ? formatGame(1 / prismaChance, 'ArcaneType.PrismaBubDropChance') : formatGame(1e4, 'Big');
    case 13:
      return crystalChargeReq == null ? undefined : formatGame(crystalChargeReq, 'ArcaneType.CrystalChargeReq');
    case 40:
      return `${round2(1.1 + bonusOf(40) / 100)}`;
    case 45:
      return `${round2(2 + bonusOf(45) / 100)}`;
    case 58:
      return `${round2(bonusOf(58))}`;
    default:
      return undefined;
  }
};

// costing: the page's Levels ahead and Daily Shopping Spree (its Page settings). sectionFailed: the catalog at zero
// (the parser's empty save) by name, with no cost, state or Toolbar.
const Upgrades = ({ account, upgrades, tachyons, prismaChance, costing, sectionFailed }) => {
  const { levelsAhead = 1, forceLegendTalent, isOverridden } = costing ?? {};
  const [view, setView, resetView] = useToolbarState('tesseract-upgrades', UPGRADES_TOOLBAR);
  const accountOptions = account?.accountOptions;
  const helpValues = {
    prismaFound: formatNum(Math.round(Number(accountOptions?.[OPT.prismaFound]) || 0)),
    prismaMult: formatGame(Math.max(1, getPrismaMulti(account)?.value ?? 1), 'ArcaneType.PrismaBonusMult'),
    weaponDropsLeft: Math.max(0, Math.round(100 - (Number(accountOptions?.[OPT.arcanistWeaponDropsToday]) || 0))),
    ringDropsLeft: Math.max(0, Math.round(100 - (Number(accountOptions?.[OPT.arcanistRingDropsToday]) || 0)))
  };
  const fills = {
    prismaChance,
    crystalChargeReq: account?.tesseract?.crystalChargeReq,
    bonusOf: (index) => (upgrades ?? []).find((upgrade) => upgrade?.index === index)?.bonus ?? 0
  };
  const catalog = (upgrades ?? []).filter(({ description }) => description !== PLACEHOLDER);
  const shown = sectionFailed ? catalog : catalog.filter((upgrade) => matchesUpgradeSearch(upgrade, view?.search)
    && !(view?.hideMaxed && upgrade.level >= upgrade.x4)
    && !(view?.hideLocked && !upgrade.unlocked));
  // One list in the game's order, or by tachyon, cheapest first inside each (as the Type sort did); a group with
  // nothing shown draws nothing
  const groups = view?.view === 'tachyon' && !sectionFailed
    ? Object.keys(tachyonNames).map((type) => ({
      key: type,
      title: tachyonNames[type],
      icon: `data/Tach${type}_x1.png`,
      list: shown.filter(({ x3 }) => `${x3}` === type).toSorted(byCost(view?.sort?.order ?? 'asc'))
    }))
    : [{ key: 'all', list: view?.sort && !sectionFailed ? shown.toSorted(byCost(view.sort.order)) : shown }];

  const renderUpgradeCard = (upgrade) => {
    const { name, cost, description, level, x3, x4, x6, extraData, index, unlocked } = upgrade;
    const owned = tachyons?.[x3]?.value || 0;
    const nextCost = isOverridden ? getTesseractTotalUpgradeCost(account, upgrade, level + 1, forceLegendTalent) : cost;
    const targetLevel = Math.min(level + levelsAhead, x4);
    const targetCost = targetLevel > level + 1 ? getTesseractTotalUpgradeCost(account, upgrade, targetLevel, forceLegendTalent) : 0;

    return <MasterclassUpgradeCard key={name + index}
                                   name={name}
                                   icon={`ArcaneUpg${index}`}
                                   helpIcon={<UpgradeHelpIcon label={cleanUpgradeName(name)} panel="arcane" index={index} values={helpValues}/>}
                                   level={level}
                                   maxLevel={x4}
                                   description={masterclassText(description, arcaneDollar(upgrade, fills))}
                                   nextLevelBonus={formatNextLevelBonus(upgrade)}
                                   extraData={extraData}
                                   currencyIcon={`Tach${x3}_x1`}
                                   currencyName={tachyonNames[x3]}
                                   costGame={'ArcaneType.ArcaneUpgCost'}
                                   owned={owned}
                                   nextCost={nextCost}
                                   targetLevel={targetLevel}
                                   targetCost={targetCost}
                                   unlockText={x6 > 0 ? `Unlocks at ${formatNum(x6)} levels` : null}
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
        <Toolbar.View options={[['list', 'List'], ['tachyon', 'By tachyon']]}/>
      </Toolbar>}
      {groups.map(({ key, title, icon, list }) => list.length ? <Stack key={key} direction="column" gap={2}>
        {title ? <Stack direction="row" alignItems="center" gap={1}>
          <GameIcon src={icon} size={24} alt={''}/>
          <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
        </Stack> : null}
        <CardGrid size={'m'}>{list.map(renderUpgradeCard)}</CardGrid>
      </Stack> : null)}
    </Stack>
  );
};

export default Upgrades;
