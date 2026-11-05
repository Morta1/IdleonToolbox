import React, { useContext, useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import DataTable from '@components/common/DataTable';
import { sortRows } from '@components/common/DataTable/layout';
import GameIcon from '@components/common/GameIcon';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { cleanUpgradeName } from '@utility/goals/registry/names';
import NumberField from '@components/common/NumberField';
import AppDialog from '@components/common/Overlays/AppDialog';
import InfoButton from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import ViewSwitch from '@components/common/ViewSwitch';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel, { FIELD_INFO_SX } from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { AppContext } from '@components/common/context/AppProvider';
import { useLocalStorage } from '@mantine/hooks';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { clampCustomMax, MAX_CUSTOM_UPGRADES } from '@parsers/genericUpgradeOptimizer';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { OPT } from '@parsers/accountOptions';
import { stepLevels, stepMeta } from './upgradeSteps';

const maxUpgradesOptions = [5, 10, 25, 50, 100, 200, 300];
// 'Game order' is Summary sorted by in-game list position: reordering single steps would scatter
// one upgrade's levels across the list, so the only useful in-game ordering is one row per upgrade.
const groupModes = ['None', 'Upgrade', 'Summary', 'Game order'];
// One rate of 1 per resource: the manual method's starting point, so an untouched rate never divides by zero
const ratesOfOne = (resourceNames) => Object.fromEntries(Object.keys(resourceNames ?? {}).map((key) => [key, 1]));
// A time left as every page writes it (Decision 8): "ready in 3d 4h", past 999 days "> 999d", "ready now" at zero
const readyText = (hours) => (hours > 0 ? `ready in ${formatDuration(hours * 3600)}` : 'ready now');
// A group's, a tile's or a band's time is its last step's; steps with no time (no rate) leave it with none
const latestReady = (steps) => (steps?.length && steps.every((step) => step?.readyHours != null)
  ? Math.max(...steps.map((step) => step.readyHours))
  : null);
// Sums one statChange into a per-stat map; shared by the Upgrade and Summary grouping branches so
// a field added to one can't silently produce NaN sums in the other.
const accumulateStatChange = (map, statChange) => {
  if (!map[statChange.stat]) {
    map[statChange.stat] = {
      stat: statChange.stat,
      change: 0,
      percentChange: 0,
      grossPercentChange: 0,
      hoardingPercentChange: 0
    };
  }
  map[statChange.stat].change += statChange.change;
  map[statChange.stat].percentChange += statChange.percentChange;
  map[statChange.stat].grossPercentChange += statChange.grossPercentChange ?? statChange.percentChange;
  map[statChange.stat].hoardingPercentChange += statChange.hoardingPercentChange ?? 0;
};

const GenericUpgradeOptimizer = ({
  // An upgrade's name as this page reads it (Clam Work's all-caps names in Title Case)
  upgradeTitle = cleanUpgradeName,
  character,
  account,
  getOptimizedUpgradesFn,
  upgradeCategories,
  resourceNames,
  resourceKey,
  resourceImagePrefix,
  // Grimoire/Compass/Tesseract's resource icons all have a `_x1` idle-quantity variant; the Royal
  // Guardian's RGres{n} currencies don't, so this lets a consumer opt out instead of 404ing.
  resourceImageSuffix = '_x1',
  // Jelly Bloodcells are a font glyph kept in etc/, not a data/ sprite.
  resourceImageDir = 'data/',
  upgradeImagePrefix,
  getResourceType,
  getUpgradeIconIndex,
  // Position in the in-game upgrade list. The index matches it for linear lists; Compass (paths)
  // and the Royal Armory (shelf slots) lay out differently and pass their own.
  getGameOrder = (upgrade) => upgrade.index,
  getResourceAmount,
  tooltipText,
  // A map of resourceType -> resource per hour the consumer derived itself. Royal Guardian income is
  // passive (outposts banking off nodes), so it can be computed; the other masterclasses can't and
  // leave this null, keeping their manual "Set RPH" flow untouched.
  autoResourcePerHour = null,
  defaultCategory = 'damage',
  // False for optimizers whose costs never read forceLegendTalent, so the Daily Shopping Spree
  // allowance has nothing to say about them (Clam Work).
  usesMasterclassReduction = true,
  showSplitByResource = true,
  // False where the currency has no hourly income to divide by (Jelly Bloodcells come from
  // operations), which pins the method to cost only and hides the selector.
  showResourcePerHour = true,
  statLabels,
  // Inputs a stats function needs but cannot derive from the account alone (Grimoire's fishing efficiency)
  optimizerOptions,
  // The game's rule for this system's costs (gameNotation), so a step's cost reads as the upgrade cards' beside it
  costGame = 'Big',
  // Whose plan this is, for the note when the account has no such character (Wind Walker, Death Bringer...)
  characterLabel = 'character',
  // The caller's section failed to load: its note is the page's first element, and the plan, which would rest on
  // nothing, draws nothing (no settings, no empty note)
  sectionFailed = false
}) => {
  const { state } = useContext(AppContext);
  // Stat keys are camelCase; the fallback spaces them out so "pearlGain" reads as "Pearl Gain".
  const statLabel = (stat) => statLabels?.[stat]
    ?? stat.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
  // GameIcon adds the site's prefix and fits the `_x1` sprites, so no shift is needed for their empty top rows
  const resourceIconPath = (type) => `${resourceImageDir}${resourceImagePrefix}${type}${resourceImageSuffix}.png`;
  const resourceName = (type) => cleanUnderscore(resourceNames?.[type] ?? `${type}`);
  const [viewMode, setViewMode] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:viewMode`,
    defaultValue: 'grid'
  });
  const [storedCategory, setCategory] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:category`,
    defaultValue: defaultCategory
  });
  // Categories differ per consumer, and the stored value outlives them. Falling back keeps a key
  // left over from another optimizer (or a renamed category) from reaching the parser as undefined.
  const category = storedCategory === 'all' || upgradeCategories?.[storedCategory]
    ? storedCategory
    : defaultCategory;
  const [maxUpgrades, setMaxUpgrades] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:maxUpgrades`,
    defaultValue: 10
  });
  const [maxUpgradesMode, setMaxUpgradesMode] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:maxUpgradesMode`,
    defaultValue: 'preset'
  });
  const [customMaxUpgrades, setCustomMaxUpgrades] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:customMaxUpgrades`,
    defaultValue: 10
  });
  const [costSortOrder, setCostSortOrder] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:costSortOrder`,
    defaultValue: 'none'
  });
  const [groupMode, setGroupMode] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:groupMode`,
    defaultValue: 'None'
  });
  const [storedSplitByResource, setSplitByResource] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:splitByResource`,
    defaultValue: false
  });
  const splitByResource = showSplitByResource && storedSplitByResource;
  // Its own key per optimizer: the old shared checkbox-Only affordable key moved every optimizer at once
  const [onlyAffordable, setOnlyAffordable] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:onlyAffordable`,
    defaultValue: false
  });
  // The legend talent grants a fixed number of discounted masterclass purchases, and
  // accountOptions[480] counts how many were already spent - the game only discounts while
  // accountOptions[480] < getLegendTalentBonus(account, 23), so the leftovers are what the
  // simulation may still spend, not the full grant.
  const dailyReductionGrant = getLegendTalentBonus(account, 23) ?? 0;
  const remainingReductions = Math.max(0, dailyReductionGrant - (account?.accountOptions?.[OPT.masterclassDiscountsUsedToday] ?? 0));
  // Only an explicit edit is stored. Seeding storage with the live count instead froze whatever it
  // read on the first visit - wrong the moment the day rolled over or anything was bought - and it
  // was that frozen seed, not the field itself, that made the field unsafe to show on Royal Guardian.
  // No defaultValue, so "never edited" stays distinguishable and keeps following the live count.
  const [reductionOverride, setReductionOverride] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:masterClassReductionOverride`
  });
  // The allowance is per DAY, and it is one pool shared by every masterclass, so a plan spanning
  // more than today gets its charges back - raising the field past today's leftovers is how you
  // price that. Left at the live count, every step past the last charge is quoted at full price:
  // 5x the number the game shows, 20x with the bonus bundle.
  const masterClassReduction = reductionOverride ?? remainingReductions;
  const [resourcePerHour, setResourcePerHour] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:resourcePerHour`,
    defaultValue: ratesOfOne(resourceNames)
  });
  const [rphDialogOpen, setRphDialogOpen] = useState(false);
  const autoRphAvailable = autoResourcePerHour != null;
  const [storedOptimizationMethod, setOptimizationMethod] = useLocalStorage({
    key: `${resourceKey}:genericUpgradeOptimizer:optimizationMethod`,
    defaultValue: autoRphAvailable ? 'rph-auto' : 'rph'
  });
  // A stored 'rph-auto' left behind by an optimizer that no longer supplies computed rates would
  // price every upgrade at zero hours, so it falls back to the manual rate instead.
  const optimizationMethod = !showResourcePerHour
    ? 'cost'
    : storedOptimizationMethod === 'rph-auto' && !autoRphAvailable
      ? 'rph'
      : storedOptimizationMethod;
  const usesRph = optimizationMethod === 'rph' || optimizationMethod === 'rph-auto';
  const effectiveResourcePerHour = (optimizationMethod === 'rph-auto' ? autoResourcePerHour : resourcePerHour) ?? {};
  const valueCommitDebouncersRef = useRef({});

  useEffect(() => () => {
    Object.values(valueCommitDebouncersRef.current).forEach(fn => fn?.cancel?.());
  }, []);
  // Before the plan is computed: the optimizer would walk a section's fallback, and a parser reading it can throw
  if (sectionFailed) return null;
  let optimizedUpgrades = [];
  if (character) {
    const maxToUse = maxUpgradesMode === 'custom'
      ? clampCustomMax(customMaxUpgrades)
      : maxUpgrades;
    optimizedUpgrades = getOptimizedUpgradesFn(character, account, category, maxToUse, {
      onlyAffordable: Boolean(onlyAffordable),
      // Optimizers whose costs never read the allowance must not spend it, or rows show a bogus -80%.
      masterClassReduction: !usesMasterclassReduction || isNaN(masterClassReduction) ? 0 : masterClassReduction,
      resourcePerHour: usesRph ? effectiveResourcePerHour : undefined,
      getResourceType,
      ...optimizerOptions
    });
  }
  // read before the grouping below, which maps the array and loses the property
  const stoppedReason = optimizedUpgrades.stoppedReason ?? null;
  const holdingBeatsSpending = stoppedReason === 'hoarding';
  const holdRates = optimizedUpgrades.holdRates ?? [];
  const bestBuy = optimizedUpgrades[0];

  // What is held of each resource, by its name
  const heldByName = {};
  const resourceArr = resourceKey.split('.').reduce((obj, key) => obj?.[key], account) || [];
  resourceArr.forEach((resource, idx) => {
    // A save's resource array can be sparse: Royal Guardian's RoyalG[1] carries nulls in the
    // slots its kingdom has not unlocked, so neither the entry nor a name for it is guaranteed.
    const name = resourceNames[idx] || resource?.name;
    if (name) {
      heldByName[name] = (getResourceAmount ? getResourceAmount(resource, idx, resourceNames) : resource?.value ?? resource) ?? 0;
    }
  });
  const usageName = (type) => resourceNames[type] || type;
  const rateOf = (type) => {
    const rph = Number(effectiveResourcePerHour?.[type]);
    return usesRph && rph > 0 ? rph : null;
  };
  // One ready rule for every step, and so for every card, tile and band built from them: the hours until what is
  // held covers the plan's spending on the step's resource up to it, (spent - held) / rate. 0 reads "ready now";
  // with no rate there is no time at all. The parser's walk (All with a rate) counts the same way, adding the
  // shared play time and the purchase that unlocks a row, so its hours stand.
  const spentByType = {};
  const plan = optimizedUpgrades.map((step) => {
    const type = getResourceType(step);
    spentByType[type] = (spentByType[type] ?? 0) + (step.cost ?? 0);
    const rate = rateOf(type);
    const held = Number(heldByName[usageName(type)]) || 0;
    const readyHours = rate === null ? null : step.readyInHours ?? Math.max(0, spentByType[type] - held) / rate;
    return { ...step, readyHours };
  });

  // Group upgrades by name if consolidation is enabled
  let displayUpgrades;
  if (groupMode === 'Upgrade') {
    // Group consecutive upgrades of the same type while preserving order
    const consolidatedUpgrades = [];
    let currentGroup = null;
    plan.forEach((upgrade, index) => {
      const upgradeName = upgrade.name;
      const startLevel = currentGroup && currentGroup.name === upgradeName
        ? currentGroup.startLevel
        : upgrade.level;
      if (!currentGroup || currentGroup.name !== upgradeName) {
        if (currentGroup) {
          currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length - 1;
          consolidatedUpgrades.push(currentGroup);
        }
        currentGroup = {
          ...upgrade,
          upgradeIndex: index,
          sequence: [{ ...upgrade, upgradeIndex: index }],
          startLevel
        };
      }
      else {
        currentGroup.sequence.push({ ...upgrade, upgradeIndex: index });
      }
    });
    if (currentGroup) {
      currentGroup.finalLevel = currentGroup.startLevel + currentGroup.sequence.length - 1;
      consolidatedUpgrades.push(currentGroup);
    }
    displayUpgrades = consolidatedUpgrades.map(upgrade => {
      if (!upgrade.sequence || upgrade.sequence.length <= 1) {
        return upgrade;
      }
      const combinedStats = {};
      let totalCost = 0;
      let discountedSteps = 0;
      const resourceType = getResourceType(upgrade);
      upgrade.sequence.forEach(seq => {
        totalCost += seq.cost;
        if (seq.hadReduction) discountedSteps += 1;
        if (category !== 'all') {
          seq.statChanges.forEach(statChange => accumulateStatChange(combinedStats, statChange));
        }
      });
      return {
        ...upgrade,
        combinedStatChanges: Object.values(combinedStats),
        totalCost,
        discountedSteps,
        resourceType,
        startLevel: upgrade.startLevel,
        finalLevel: upgrade.finalLevel,
        numberOfUpgrades: upgrade.sequence.length
      };
    });
  }
  else if (groupMode === 'Summary' || groupMode === 'Game order') {
    const grouped = {};
    plan.forEach((upgrade, index) => {
      if (!grouped[upgrade.name]) {
        grouped[upgrade.name] = {
          ...upgrade,
          upgradeIndex: index,
          startLevel: upgrade.level,
          finalLevel: upgrade.level,
          sequence: [],
          totalCost: 0,
          discountedSteps: 0,
          combinedStatChanges: {}
        };
      }

      const g = grouped[upgrade.name];
      g.sequence.push({ ...upgrade, upgradeIndex: index });
      g.finalLevel = Math.max(g.finalLevel, upgrade.level);
      g.totalCost += upgrade.cost;
      if (upgrade.hadReduction) g.discountedSteps += 1;

      if (upgrade.statChanges) {
        upgrade.statChanges.forEach(statChange => accumulateStatChange(g.combinedStatChanges, statChange));
      }
    });

    displayUpgrades = Object.values(grouped).map(g => ({
      ...g,
      combinedStatChanges: Object.values(g.combinedStatChanges)
    }));
    if (groupMode === 'Game order') {
      const position = (upgrade) => getGameOrder(upgrade) ?? Infinity;
      displayUpgrades.sort((a, b) => position(a) - position(b));
    }
  }
  else {
    displayUpgrades = plan.map((upgrade, index) => ({ ...upgrade, upgradeIndex: index }));
  }

  // The table's columns, here because the sort below reads Cost's value. Their renders name helpers declared
  // further down: they only run when the table draws.
  const sort = costSortOrder === 'none' ? null : { key: 'cost', order: costSortOrder };
  const upgradeColumns = [
    {
      key: 'name',
      label: 'Name',
      icon: upgradeImagePrefix ? (upgrade) => <GameIcon src={upgradeIconPath(upgrade)} alt={''} size={32}/> : undefined,
      render: (upgrade) => <Stack component={'span'} gap={0.25}>
        <span>{upgradeTitle(upgrade.name)}</span>
        {upgrade.lockedNow ? <Typography variant={'body2'} color={'text.secondary'} component={'span'}>{lockLabel(upgrade)}</Typography> : null}
      </Stack>
    },
    { key: 'level', label: 'Level', cellSx: { whiteSpace: 'nowrap' }, render: (upgrade) => stepLevels(upgrade) },
    { key: 'stats', label: 'Stat changes', render: (upgrade) => renderTableStats(upgrade) },
    {
      key: 'cost',
      label: 'Cost',
      numeric: true,
      sortable: true,
      phone: true,
      value: (upgrade) => upgrade.totalCost || upgrade.cost,
      render: (upgrade) => <Stack alignItems={'flex-end'}>{costNode(upgrade)}{costNotes(upgrade)}</Stack>
    }
  ];
  // # is the purchase order at every sort (as Spelunking's optimizer numbers it): numbered before the Cost sort, and
  // once, so it stays the same whether or not the list is split.
  displayUpgrades = displayUpgrades.map((upgrade, index) => ({ ...upgrade, displayPosition: index + 1 }));
  // The plan's order, or Cost's: highest first, then lowest, then back to the plan (the table's header steps).
  displayUpgrades = sortRows(displayUpgrades, upgradeColumns, sort);

  // Split into per-resource sections, ordered by first appearance so the material to farm first comes first
  const resourceSections = [];
  if (splitByResource) {
    const sectionsByType = {};
    displayUpgrades.forEach(upgrade => {
      const resourceType = getResourceType(upgrade);
      if (!sectionsByType[resourceType]) {
        sectionsByType[resourceType] = {
          resourceType,
          name: resourceNames[resourceType] ?? resourceType,
          upgrades: [],
          cost: 0
        };
        resourceSections.push(sectionsByType[resourceType]);
      }
      sectionsByType[resourceType].upgrades.push(upgrade);
      sectionsByType[resourceType].cost += upgrade.totalCost || upgrade.cost;
      sectionsByType[resourceType].steps = [...(sectionsByType[resourceType].steps ?? []), ...(upgrade.sequence ?? [upgrade])];
    });
  }
  // Calculate total resource costs by type
  const resourceUsageMap = {};
  plan.forEach(upgrade => {
    const resourceType = getResourceType(upgrade);
    const name = usageName(resourceType);
    if (!resourceUsageMap[name]) {
      resourceUsageMap[name] = {
        name,
        type: resourceType,
        cost: 0,
        steps: []
      };
    }
    resourceUsageMap[name].cost += upgrade.cost;
    resourceUsageMap[name].steps.push(upgrade);
  });
  const resourceUsage = Object.values(resourceUsageMap);

  // A stat change in the amount kind, its percent in the pct kind, neither with every decimal ("+564,379 (+0.04%)").
  // Under 100 the amount reads the pct kind's Small rule without its %, where a whole number would read +0 for a
  // crit chance step or +2 for +1.5; under 0.01 both keep two significant digits rather than read 0.
  const formatChange = (change) => (Math.abs(change) >= 100
    ? formatNum(change, 'amount', { signed: true })
    : formatNum(change, 'pct', { signed: true, bare: true, precise: Math.abs(change) < 0.01 }));
  const formatPercentChange = (percentChange) => formatNum(percentChange, 'pct', { signed: true, precise: Math.abs(percentChange) < 0.01 });
  // Precise keeps two significant digits under 0.01, so a small hoarding note still adds up on screen
  const formatSignedPercent = (percentChange) => formatNum(percentChange, 'pct', { signed: true, precise: true });
  // Hours of farming needed to rebuild the resource this purchase spends
  const getRebuildTime = (upgrade) => {
    if (!usesRph) return null;
    const rph = effectiveResourcePerHour[getResourceType(upgrade)];
    if (!rph || isNaN(rph) || rph <= 0) return null;
    const cost = upgrade.totalCost || upgrade.cost;
    return cost ? cost / rph : null;
  };
  // Hoarding upgrades scale with the resource you're holding, so spending gives some of it back.
  // Show the gross gain and what hoarding takes off it, plus how long the stash takes to recover.
  // The test is relative: hoarding loss varies by orders of magnitude between accounts, so what
  // matters is the share of the gain it eats, not its absolute size.
  const HOARDING_NOTE_MIN_SHARE = 0.01;
  const renderHoardingNote = (statChange, rebuildTime) => {
    if (!(statChange?.hoardingPercentChange > 0) || !(statChange?.grossPercentChange > 0)) return null;
    if (statChange.hoardingPercentChange < statChange.grossPercentChange * HOARDING_NOTE_MIN_SHARE) return null;
    // a rebuild measured in centuries means the rate is a placeholder, not a real farming rate
    const showRebuild = rebuildTime && rebuildTime >= 1 / 60 && rebuildTime <= 24 * 365;
    return (
      <Typography variant="caption" color="text.secondary" component="div">
        gross {formatSignedPercent(statChange.grossPercentChange)},
        hoarding {formatSignedPercent(-statChange.hoardingPercentChange)},
        net {formatSignedPercent(statChange.percentChange)}
        {showRebuild ? `, stash back in ${formatDuration(rebuildTime * 3600)}` : ''}
      </Typography>
    );
  };
  // Growing the stash is itself a gain for hoarding upgrades. Per hour of farming it lines up with
  // the best purchase (whose efficiency is % per hour of its own resource); without an RPH the
  // only honest unit is a 10x bigger stash. The gain is logarithmic, so the hourly rate is "now".
  // Same window as the rebuild note: an RPH that needs over a year to grow the stash 10x is the
  // untouched default of 1, not a farming rate, and would print as +0%; a buy paid off in under a
  // minute extrapolates to an absurd hourly rate.
  const MAX_REAL_FARMING_HOURS = 24 * 365;
  const renderHoldRates = () => {
    if (!holdRates.length) return null;
    const bestBuyHours = bestBuy ? getRebuildTime(bestBuy) : null;
    const bestBuyPerHour = bestBuyHours >= 1 / 60 && bestBuyHours <= MAX_REAL_FARMING_HOURS
      ? bestBuy.totalStatChange / bestBuyHours
      : null;
    const formatRate = (value) => formatNum(value, 'pct', { signed: true, precise: true });
    const rates = holdRates.map((rate) => {
      const rph = usesRph ? effectiveResourcePerHour[rate.resourceType] : null;
      const tenfoldHours = rph > 0 ? 9 * Math.max(rate.held, 1) / rph : Infinity;
      return { ...rate, hourly: rate.perHour !== null && tenfoldHours <= MAX_REAL_FARMING_HOURS };
    });
    return (
      <Stack gap={0.5}>
        {rates.map((rate) => (
          <Stack key={rate.resourceType} direction="row" gap={1} alignItems="center" flexWrap="wrap">
            <GameIcon src={resourceIconPath(rate.resourceType)} size={24} alt={''}/>
            <Typography variant="body2">
              {`Holding ${cleanUnderscore(rate.name)}: ${rate.hourly
                ? `${formatRate(rate.perHour)} per hour of farming right now`
                : `${formatRate(rate.perTenfold)} per 10x stash`}`}
            </Typography>
            <InfoButton label={`Holding ${cleanUnderscore(rate.name)}`}>{rate.hourly
              ? 'What farming this resource adds just by keeping it, no purchase. It shrinks as the stash grows, since the bonus follows its log.'
              : `What a stash 10x bigger than your ${formatGame(rate.held ?? 0, costGame, { whole: true })} would add, no purchase. Set a real resource per hour to see it per hour of farming.`}</InfoButton>
          </Stack>
        ))}
        {bestBuyPerHour !== null && rates.some((rate) => rate.hourly) && (
          <Typography variant="body2" color="text.secondary">
            {`Best buy: ${cleanUnderscore(bestBuy.name)}, ${formatRate(bestBuyPerHour)} per hour of ${resourceName(getResourceType(bestBuy))} farming`}
          </Typography>
        )}
      </Stack>
    );
  };
  // A stat change as the label and its amount with its percent; a hoarding upgrade's note under it
  const renderStatChanges = (statChanges, upgrade) => {
    const rebuildTime = getRebuildTime(upgrade);
    return <Stack gap={0.5}>
      {(statChanges ?? []).map((change, index) => <Stack key={index} gap={0.25}>
        <ItemCard.Facts rows={[[statLabel(change.stat), `${formatChange(change.change)} (${formatPercentChange(change.percentChange)})`]]}/>
        {renderHoardingNote(change, rebuildTime)}
      </Stack>)}
    </Stack>;
  };

  // Which rows the Daily Shopping Spree allowance actually paid for. Without this the walk silently
  // spends the charges on the cheapest rows at the head of the plan and everything after reads as
  // inexplicably expensive.
  const discountText = (upgrade) => {
    const steps = upgrade.sequence?.length ?? 1;
    const discounted = upgrade.discountedSteps ?? (upgrade.hadReduction ? 1 : 0);
    if (!discounted) return null;
    return steps > 1 ? `-80% on ${discounted}/${steps}` : '-80%';
  };

  // With a rate only: when the plan can afford this row (a group: its last level)
  const readyNote = (upgrade) => {
    const hours = latestReady(upgrade.sequence?.length > 1 ? upgrade.sequence : [upgrade]);
    return hours === null ? null : readyText(hours);
  };

  const upgradeIconPath = (upgrade) => `data/${upgradeImagePrefix}${getUpgradeIconIndex ? getUpgradeIconIndex(upgrade) : upgrade.index}.png`;
  const stepCost = (upgrade) => (upgrade.sequence?.length > 1 && upgrade.totalCost ? upgrade.totalCost : upgrade.cost);
  // The cost in the system's rule beside its resource's sprite, which names the resource: it stands alone here
  const costNode = (upgrade) => <Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
    <GameIcon src={resourceIconPath(getResourceType(upgrade))} size={16} alt={resourceName(getResourceType(upgrade))}/>
    {formatGame(stepCost(upgrade) ?? 0, costGame, { whole: true })}
  </Stack>;
  // The discount and the ready time, in words under the cost
  const costNotes = (upgrade) => {
    const discount = discountText(upgrade);
    const ready = readyNote(upgrade);
    if (!discount && !ready) return null;
    return <Typography variant={'caption'} color={'text.secondary'} component={'div'}>
      {discount ? <Box component={'span'} sx={{ color: 'text.success' }}>{discount}</Box> : null}
      {discount && ready ? ' · ' : null}
      {ready}
    </Typography>;
  };

  // One debouncer per resource: a typed rate reruns the simulation once the typing pauses, not per keystroke.
  const commitRph = (key, next) => {
    if (!valueCommitDebouncersRef.current[key]) {
      valueCommitDebouncersRef.current[key] = debounce((value) => {
        setResourcePerHour(rph => ({ ...rph, [key]: value ?? '' }));
      }, 150);
    }
    valueCommitDebouncersRef.current[key](next);
  };

  // Debounced so typing "300" doesn't run the simulation for 3 and 30 on the way there
  const handleCustomMaxChange = (next) => {
    if (!valueCommitDebouncersRef.current.customMaxUpgrades) {
      valueCommitDebouncersRef.current.customMaxUpgrades = debounce((value) => {
        setCustomMaxUpgrades(value == null ? '' : value);
      }, 400);
    }
    valueCommitDebouncersRef.current.customMaxUpgrades(next);
  };

  // Closing (the header's close, Esc or a click outside) stores whatever is still waiting in a debouncer.
  const handleRphDialogClose = () => {
    Object.keys(resourceNames).forEach((key) => valueCommitDebouncersRef.current[key]?.flush());
    setRphDialogOpen(false);
  };

  // A resource's total cost and, with a rate, when the plan has it all
  const sectionMeta = (section) => {
    const hours = latestReady(section.steps);
    return `${formatGame(section.cost, costGame, { whole: true })}${hours === null ? '' : ` · ${readyText(hours)}`}`;
  };
  const sectionCount = (section) => `${formatNum(section.upgrades.length)} ${section.upgrades.length === 1 ? 'upgrade' : 'upgrades'}`;

  // Rows can include upgrades that are still locked in game: the plan buys the levels that open
  // them first. Without this marker the list reads as "buy all of these right now".
  const lockLabel = (upgrade) => {
    const steps = upgrade.unlocksAfterStep;
    return steps > 0
      ? `Unlocks after ${steps} ${steps === 1 ? 'purchase' : 'purchases'}`
      : 'Locked now';
  };

  const renderUpgradeCard = (upgrade) => {
    const position = upgrade.upgradeIndex;
    const grouped = upgrade.sequence?.length > 1 && Boolean(upgrade.combinedStatChanges);
    return <ItemCard key={position} title={upgradeTitle(upgrade.name)}
                     icon={upgradeImagePrefix ? upgradeIconPath(upgrade) : undefined}
                     meta={stepMeta(upgrade)}
                     status={upgrade.lockedNow ? 'locked' : undefined} statusLabel={upgrade.lockedNow ? lockLabel(upgrade) : undefined}
                     footer={<>
                       <ItemCard.Facts rows={[[grouped ? 'Total cost' : 'Cost', costNode(upgrade)]]}/>
                       {costNotes(upgrade)}
                     </>}>
      {category === 'all'
        ? <ItemCard.Desc text={cleanUnderscore(upgrade.description ?? '')}/>
        : renderStatChanges(grouped ? upgrade.combinedStatChanges : upgrade.statChanges, upgrade)}
    </ItemCard>;
  };

  // A group's levels are in the Level column, so the stats cell holds only the changes
  const renderTableStats = (upgrade) => {
    if (upgrade.sequence?.length > 1 && upgrade.combinedStatChanges) {
      return renderStatChanges(upgrade.combinedStatChanges, upgrade);
    }
    return category === 'all' ? cleanUnderscore(upgrade.description ?? '') : renderStatChanges(upgrade.statChanges, upgrade);
  };

  // A band per resource when the list is split, in the order the plan first needs each one.
  const sectionBand = Object.fromEntries(resourceSections.map((section) => [section.resourceType, {
    key: section.resourceType,
    label: section.name,
    icon: <GameIcon src={resourceIconPath(section.resourceType)} size={24} alt={''}/>,
    meta: sectionMeta(section)
  }]));

  // The auto method's rates: a list, so a breakdown rather than a note (Info board step 5)
  const autoRatesBreakdown = autoRphAvailable ? createBreakdown('Auto rates', '', flatLines(Object.keys(resourceNames ?? {})
    .map((key) => ({
      name: resourceName(key),
      value: autoResourcePerHour?.[key] ?? 0,
      formatted: `${formatGame(autoResourcePerHour?.[key] ?? 0, 'RoyalG.OutpostResourceRate')}/hr`
    }))), { combine: 'list' }) : null;
  // A sentence under the row for each picked option that needs one, each on its own line: a helper line would lift
  // its field off the row's line. The discount clause only where the daily 80% discount prices these upgrades.
  const rowNotes = [
    optimizationMethod === 'rph-auto' ? 'Auto rates come from your outposts and their nodes, each capped by what its node can give in 24 hours.' : null,
    groupMode === 'Game order'
      ? `Game order lists one row per upgrade in the game's menu order${usesMasterclassReduction ? '; costs follow the plan\'s order, so the daily 80% discount may land on other purchases' : ''}.`
      : null
  ].filter(Boolean);

  const cards = splitByResource
    ? <Stack gap={3}>
      {resourceSections.map((section) => <Panel key={section.resourceType} icon={resourceIconPath(section.resourceType)} iconAlt={''}
                                                title={cleanUnderscore(section.name)}
                                                meta={`${sectionCount(section)} · ${sectionMeta(section)}`}>
        <Box sx={{ p: 2 }}>
          <CardGrid size={'m'}>{section.upgrades.map(renderUpgradeCard)}</CardGrid>
        </Box>
      </Panel>)}
    </Stack>
    : <CardGrid size={'m'}>{displayUpgrades.map(renderUpgradeCard)}</CardGrid>;
  const table = <DataTable
    columns={upgradeColumns}
    rows={displayUpgrades}
    rowKey={'upgradeIndex'}
    rowLabel={(upgrade) => upgradeTitle(upgrade.name)}
    // The page numbers its rows: # stays the position shown, whatever the split.
    rankOf={(upgrade) => upgrade.displayPosition}
    bands={splitByResource ? (upgrade) => sectionBand[getResourceType(upgrade)] : undefined}
    sort={sort}
    onSortChange={(next) => setCostSortOrder(next?.order ?? 'none')}
    surface={'card'}
  />;

  return (
    <Stack gap={3}>
      {/* The plan's settings: a tool's inputs stay on its tab, beside the plan they change (the owner's rule) */}
      <Panel title={'Upgrade plan'} aside={<ViewSwitch size={'medium'} label={'View'} options={[['grid', 'Cards'], ['list', 'Table']]}
                                                       value={viewMode} onChange={setViewMode}/>}>
        <Panel.Inputs>
          <TextField select label="Optimize for" value={category} onChange={(e) => setCategory(e.target.value)}
                     sx={{ width: 200 }}>
            {Object.entries(upgradeCategories ?? {}).map(([key, { name }]) => <MenuItem key={key} value={key}>{name}</MenuItem>)}
            <MenuItem value={'all'}>All</MenuItem>
          </TextField>
          {showResourcePerHour ? <TextField select label="Method" value={optimizationMethod}
                                            onChange={(e) => setOptimizationMethod(e.target.value)} sx={{ width: autoRphAvailable ? 260 : 220 }}>
            {autoRphAvailable ? <MenuItem value="rph-auto">Resource per hour (auto)</MenuItem> : null}
            <MenuItem value="rph">{`Resource per hour${autoRphAvailable ? ' (manual)' : ''}`}</MenuItem>
            <MenuItem value="cost">Cost only</MenuItem>
          </TextField> : null}
          {optimizationMethod === 'rph' ? <Button variant="outlined" onClick={() => setRphDialogOpen(true)}>Set RPH</Button> : null}
          {optimizationMethod === 'rph-auto' && autoRatesBreakdown ? <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
            <Breakdown asValue data={autoRatesBreakdown} title={'Auto rates'} countNoun={'resources'}>
              <Typography variant="body2" component="span">Auto rates</Typography>
            </Breakdown>
          </Box> : null}
          <TextField select label="Max upgrades" value={maxUpgradesMode === 'custom' ? 'custom' : maxUpgrades}
                     sx={{ width: 140 }}
                     onChange={(e) => {
                       const val = e.target.value;
                       if (val === 'custom') {
                         setMaxUpgradesMode('custom');
                       }
                       else {
                         setMaxUpgradesMode('preset');
                         setMaxUpgrades(val);
                       }
                     }}>
            {maxUpgradesOptions.map(max => <MenuItem key={max} value={max}>{formatNum(max)}</MenuItem>)}
            <MenuItem value={'custom'}>Custom</MenuItem>
          </TextField>
          {maxUpgradesMode === 'custom' ? <NumberField
            label="Custom max"
            value={customMaxUpgrades === '' || customMaxUpgrades == null ? null : clampCustomMax(customMaxUpgrades)}
            min={1}
            max={MAX_CUSTOM_UPGRADES}
            integer
            help={false}
            sx={{ width: 120 }}
            onChange={handleCustomMaxChange}
            // Leaving the field stores it now, so the old value never shows for the 400 ms the debounce still holds.
            onCommit={() => valueCommitDebouncersRef.current.customMaxUpgrades?.flush()}
          /> : null}
          <TextField select label="Group" value={groupMode} onChange={(e) => setGroupMode(e.target.value)} sx={{ width: 140 }}>
            {groupModes.map(group => <MenuItem key={group} value={group}>{group}</MenuItem>)}
          </TextField>
          {showSplitByResource ? <FormControlLabel label="Split by resource"
                                                   control={<Switch checked={splitByResource}
                                                                    onChange={() => setSplitByResource(prev => !prev)}/>}/> : null}
          <FormControlLabel label="Only affordable"
                            control={<Switch checked={Boolean(onlyAffordable)} onChange={() => setOnlyAffordable(!onlyAffordable)}/>}/>
          {usesMasterclassReduction ? <Stack direction="row" alignItems="flex-end" gap={0.5}>
            <NumberField
              label="Masterclass reductions"
              // Clearing the field drops the override rather than meaning zero, so there is always
              // a way back to the live remaining count.
              value={masterClassReduction}
              min={0}
              integer
              help={false}
              sx={{ width: 180 }}
              onChange={(next) => setReductionOverride(next)}
            />
            <InfoButton label={'Masterclass reductions'} sx={FIELD_INFO_SX}>
              {`Daily Shopping Spree makes your first ${formatNum(dailyReductionGrant)} Masterclass purchases each day 80% cheaper, and the allowance resets every day. This starts at what today has left, so steps past it are priced at full rate: raise it to plan across several days, or clear it to follow the live count.`}
            </InfoButton>
          </Stack> : null}
        </Panel.Inputs>
        {rowNotes.length ? <Stack gap={0.5} sx={{ p: 2 }}>
          {rowNotes.map((note) => <Typography key={note} variant={'body2'} color={'text.secondary'}>{note}</Typography>)}
        </Stack> : null}
      </Panel>

      {optimizationMethod === 'rph' && (
        // Every field saves as it changes; Done names that, where the close alone read as cancel.
        <AppDialog open={rphDialogOpen} onClose={handleRphDialogClose} size="m" title="Set resource per hour"
                   actions={[{ label: 'Done', main: true }]}>
          <Stack gap={2} sx={{ pt: 1 }}>
            {Object.entries(resourceNames).map(([key, name]) => (
              <NumberField
                key={key}
                label={`${cleanUnderscore(name)} per hour`}
                // The icon is keyed by resource type, not by position in the list: the Royal
                // Guardian's currency ids have gaps, so the two disagree.
                icon={<GameIcon src={resourceIconPath(key)} size={24} alt={''}/>}
                value={resourcePerHour?.[key] === '' ? null : resourcePerHour?.[key]}
                min={0}
                // Rates run past a million, where a phone's number pad has no letters for 1.5B.
                inputMode="text"
                fullWidth
                onChange={(next) => commitRph(key, next)}
              />
            ))}
          </Stack>
        </AppDialog>
      )}

      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant={'sectionTitle'} component={'h2'} data-testid="optimizer-heading">Recommended upgrade sequence</Typography>
        {tooltipText ? <InfoButton label={'How this plan is built'}>{tooltipText}</InfoButton> : null}
      </Stack>
      {character && resourceUsage.length ? <Stack direction="row" gap={1} flexWrap="wrap">
        {resourceUsage.map((resource) => {
          const hours = latestReady(resource.steps);
          return <StatTile key={resource.name} label={cleanUnderscore(resource.name)} icon={resourceIconPath(resource.type)}
                           value={formatGame(resource.cost, costGame, { whole: true })}
                           sub={hours === null ? undefined : readyText(hours)}/>;
        })}
      </Stack> : null}
      {character ? renderHoldRates() : null}
      {!character
        ? <Notice tone={state?.emptyAccount ? 'signin' : 'locked'}>{state?.emptyAccount
          ? `Your ${characterLabel}'s upgrade plan shows here once you sign in.`
          : `The plan needs a ${characterLabel} on this account.`}</Notice>
        : displayUpgrades.length === 0
          ? <Notice>{holdingBeatsSpending
            ? 'Build up your stash instead: every upgrade you can afford would cost more in Hoarding bonus than it would gain. Keep collecting and check back once your stash is bigger.'
            : 'No viable upgrades found for this category with your current resources.'}</Notice>
          : <>
            {holdingBeatsSpending ? <Notice>
              Stopping here: past this point, spending costs more in Hoarding bonus than it gains. Build the stash back up first.
            </Notice> : null}
            {viewMode === 'grid' ? cards : table}
          </>}
    </Stack>
  );
};

export default GenericUpgradeOptimizer;
