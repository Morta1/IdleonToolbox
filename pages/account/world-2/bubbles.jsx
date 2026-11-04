import { Box, Stack, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum, growth, round, shownPercent } from 'utility/helpers';
import { formatGame, gameBonusText } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import {
  CAULDRON_INFO,
  findAddDecayThresholdLevel,
  getAlchemy,
  getBubbleParticleCost,
  getBubbleBonus,
  getBubbleUpgradeCost,
  getGrindTimeBubbleDaily,
  getKrukBubblesDaily,
  getMaxBonus,
  getMaxCauldron,
  getPossibleZenithMarketBubbles,
  getUpgradeableBubbles,
  getVialsBonusByStat,
  isPrismaBubble,
  LIQUID_INFO
} from '@parsers/world-2/alchemy';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { getAchievementStatus } from '@parsers/achievements';
import { OPT } from '@parsers/accountOptions';
import { createBreakdown, info, listGroup } from '@parsers/breakdown';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import useToolbarState from '@hooks/useToolbarState';
import usePageTop from '@hooks/usePageTop';

const BUBBLE_SETTINGS = {
  classDiscount: false, bargainTags: 0, showTargets: true, effThreshold: 75, dimPastEff: false, levelThreshold: 100,
  dimPastLevel: false, futureFromMost: false
};
const BUBBLES_TOOLBAR = { search: '', view: 'tiles' };

// The sections each number on the page reads. A Summary number whose section failed reads "-", and the note names the
// first failed section in this order. The cauldrons' named sub-section only adds brew speeds and new bubble chances,
// which this page does not show.
const SECTION_NAMES = {
  alchemy: 'Bubbles', lab: 'the Lab', bundlesOwned: 'Bundles', sailing: 'Sailing', tasks: 'Tasks', divinity: 'Divinity',
  stamps: 'Stamps', legendTalents: 'Legend Talents', statues: 'Statues', voteBallot: 'the Vote Ballot', arcade: 'the Arcade',
  spelunking: 'Spelunking', minehead: 'Minehead', coralReef: 'Coral Reef', tesseract: 'the Tesseract',
  sushiStation: 'Sushi Station', jellyOperator: 'Jelly Operator', looty: 'the Slab', gaming: 'Gaming', farming: 'Farming',
  companions: 'Companions', achievements: 'Achievements', atoms: 'Atom Collider', storage: 'Storage', summoning: 'Summoning'
};
// No Bubble Left Behind: the bubbles, the lab bonus, the bundle, the Amberite artifact and the merit
const NBLB_SECTIONS = ['alchemy', 'lab', 'bundlesOwned', 'sailing', 'tasks'];
// Kattlekruk's major blessing and every source of its daily levels
const KRUK_SECTIONS = ['alchemy', 'divinity', 'stamps', 'legendTalents', 'statues', 'voteBallot', 'arcade', 'spelunking',
  'minehead'];
const GRIND_TIME_SECTIONS = ['alchemy', 'coralReef'];
const PRISMA_SECTIONS = ['alchemy', 'tesseract', 'arcade', 'sushiStation', 'jellyOperator', 'looty', 'gaming', 'farming',
  'legendTalents', 'companions'];
// A cost's discount (S-M-R-T) and the owned amounts beside it
const COST_SECTIONS = ['alchemy', 'achievements', 'atoms', 'storage', 'gaming', 'sailing', 'farming', 'summoning',
  'spelunking'];
const PAGE_SECTIONS = [...new Set([...NBLB_SECTIONS, ...KRUK_SECTIONS, ...GRIND_TIME_SECTIONS, ...PRISMA_SECTIONS,
  ...COST_SECTIONS])];

// The parser's shape with No Bubble Left Behind off, for a failed alchemy section whose bubble lists it cannot read
const NO_UPGRADEABLE = { normal: [], atomBubbles: [], upgradeableBubblesAmount: 0, minLevel: 0, maxLevel: 0 };

const FUTURE_BUBBLES_ROWS = 15;
// Shown when there's no cauldron progress to anchor on (logged out)
const FUTURE_BUBBLES_FALLBACK = 30;

// Brew needed to roll for each upcoming bubble, starting at the least (the one you're waiting on) or most progressed
// cauldron's next bubble. The game groups bubbles into worlds of 5.
const futureBubbles = (cauldrons, fromMost) => {
  const progress = Object.values(cauldrons ?? {})
    .map(({ unlockedBubbles }) => unlockedBubbles)
    .filter((count) => count > 0);
  const pick = fromMost ? Math.max : Math.min;
  const first = pick(...(progress.length ? progress : [FUTURE_BUBBLES_FALLBACK])) + 1;
  const brew = (bubble) => getMaxCauldron(bubble - 1);
  const text = (bubble) => `${formatGame(brew(bubble), 'CauldronStats.MaxCauldronQTY')} per attempt`;
  const rows = Array.from({ length: FUTURE_BUBBLES_ROWS }, (_, index) => first + index)
    .map((bubble) => info(`#${bubble} (World ${Math.ceil(bubble / 5)})`, brew(bubble), { formatted: text(bubble) }));
  return {
    first,
    text: text(first),
    breakdown: createBreakdown('Future bubbles', text(first), [listGroup(`Next ${FUTURE_BUBBLES_ROWS} bubbles`, rows)],
      { combine: 'list' })
  };
};

// The page's one name style for a bubble ("Roid Ragin")
const bubbleTitle = (name) => cleanUnderscore((name ?? '').toLowerCase().capitalizeAll());

// The game draws these materials with their _x1 art
const X1_MATERIALS = ['sail', 'bits', 'w6item', 'w7item', 'liquid'];
const materialSprite = (rawName = '') => (X1_MATERIALS.some((part) => rawName.toLowerCase().includes(part))
  ? `${rawName}_x1`
  : rawName);

// The item data names the sailing, World 6 and World 7 materials "Strung Jewels" (Leftovers): a treasure takes the
// Sailing page's name, the rest none
const materialName = ({ rawName = '', name }) => {
  const liquid = rawName.match(/^Liquid(\d)$/)?.[1];
  if (liquid) return LIQUID_INFO[liquid - 1]?.displayName ?? '';
  const treasure = rawName.match(/^SailTr(\d+)$/)?.[1];
  if (treasure) return `Treasure ${treasure}`;
  if (/^W[67]item/.test(rawName)) return '';
  return cleanUnderscore(name ?? '');
};

const CROPS = { W6item1: 4, W6item2: 30, W6item3: 46, W6item4: 72, W6item5: 99 };
const ESSENCES = { W6item6: 0, W6item7: 1, W6item8: 2, W6item9: 3, W6item10: 4 };
// What you own of a bubble material, from the section that holds it: undefined when that section failed (or for a
// material no section holds), so its cost shows no owned amount
const ownedAmount = (account, rawName = '') => {
  const from = (section, amount) => (isSectionFailed(account, section) ? undefined : Number(amount ?? 0));
  const liquid = rawName.match(/^Liquid(\d)$/)?.[1];
  if (liquid) return from('alchemy', account?.alchemy?.liquids?.[liquid - 1]);
  if (rawName === 'Bits') return from('gaming', account?.gaming?.bits);
  if (rawName.startsWith('SailTr')) {
    return from('sailing', account?.sailing?.lootPile?.find(({ rawName: pile }) => pile === rawName.replace('SailTr', 'SailT'))?.amount);
  }
  if (rawName.startsWith('W6item')) {
    if (Object.hasOwn(CROPS, rawName)) return from('farming', account?.farming?.crop?.[CROPS[rawName]]);
    return Object.hasOwn(ESSENCES, rawName) ? from('summoning', account?.summoning?.essences?.[ESSENCES[rawName]]) : undefined;
  }
  if (rawName.startsWith('W7item')) {
    return from('spelunking', account?.spelunking?.discoveries?.flat()?.[Number(rawName.replace('W7item', ''))]?.amount);
  }
  return from('storage', account?.storage?.list?.find(({ rawName: stored }) => stored === rawName)?.amount);
};

// One material's cost for a bubble's next level, with the cauldron's own discount bubbles and level as the game reads
// them; classDiscount previews the class bubble, bargainTags the Bargain Tags (each 25% off, stacking)
const materialCost = (account, { index, level, cauldron }, { rawName, baseCost }, { classDiscount, bargainTags }) => {
  const bubbles = account?.alchemy?.bubbles?.[cauldron];
  const cauldronCostLvl = account?.alchemy?.cauldrons?.[cauldron]?.boosts?.cost?.level || 0;
  const multiBubble = cauldron !== 'kazam' ? bubbles?.[16]?.level || 0 : 0;
  const lastBubbleLvl = bubbles?.[14]?.level || 0;
  const classMultiplierLvl = classDiscount && cauldron !== 'kazam' ? (bubbles?.[1]?.level || 0) : 0;
  const vialAndBubbleBonus = getVialsBonusByStat(account?.alchemy?.vials, 'AlchBubbleCost')
    + getBubbleBonus(account, 'UNDEVELOPED_COSTS', false);
  return getBubbleUpgradeCost({
    rawName, bubbleIndex: index, level, baseCost,
    discounts: {
      cauldronBubble: Math.max(0.05, 1 - (growth('decay', lastBubbleLvl, 40, 12, false) / 100)
        * growth('decayMulti', classMultiplierLvl, 2, 50, false)
        * growth('decayMulti', multiBubble, 1.4, 30, false)),
      cauldronLevel: Math.max(0.1, 1 - (Math.round(10 * growth('decay', cauldronCostLvl, 90, 100, false)) / 10) / 100),
      vialAndBubble: Math.max(0.05, 1 - vialAndBubbleBonus / 100),
      bargainTag: Math.max(0.1, Math.pow(0.75, bargainTags || 0)),
      smrt: Math.max(0.9, 1 - 0.1 * getAchievementStatus(account?.achievements, 108))
    }
  });
};

const isMaterial = (item) => Boolean(item?.rawName) && item.rawName !== 'Blank' && item.rawName !== 'ERROR';

// A bubble's next level: each material's cost against what you own, and the particles the bubble panel takes instead
// of the first material once one level of it costs 100M or more (Boron)
const bubbleCost = (bubble, { account, discounts }) => {
  const items = (bubble?.itemReq ?? []).map((item, itemIndex) => (isMaterial(item)
    ? { item, itemIndex, cost: materialCost(account, bubble, item, discounts) }
    : null)).filter(Boolean);
  if (!items.length) return null;
  const first = items.find(({ itemIndex }) => itemIndex === 0);
  const particles = first ? getBubbleParticleCost(account, bubble?.index, first.item.rawName, 0, first.cost) : 0;
  return <>
    <ItemCard.Section label={'Next level'}>
      {items.map(({ item, cost }) => <ItemCard.Cost key={item.rawName} icon={`data/${materialSprite(item.rawName)}.png`}
                                                    iconAlt={materialName(item)} need={cost}
                                                    have={ownedAmount(account, item.rawName)}
                                                    game={'CauldronStats.CauldronCosts'}/>)}
    </ItemCard.Section>
    {particles > 0 ? <ItemCard.Section label={'Or the first with particles'}>
      <ItemCard.Cost icon={'etc/Particle.png'} iconAlt={'Particles'} need={particles}
                     have={isSectionFailed(account, 'atoms') ? undefined : Math.floor(account?.atoms?.particles ?? 0)}
                     game={'CauldronStats.CauldronCosts'}/>
    </ItemCard.Section> : null}
  </>;
};

// Where a bubble's daily levels come from: its mark on the tile and the line in its details
const dailySource = (bubble, upgradeable) => {
  if (bubble.isZenithMarket) {
    return { mark: 'data/DivGod8.png', markAlt: 'Kattlekruk', text: `Kattlekruk: +${formatNum(bubble.dailyLevels)} levels a day` };
  }
  if (bubble.isGrindTime) {
    return {
      mark: 'data/Reefz1.png', markAlt: 'Grind Time',
      text: `Grind Time: +${formatNum(bubble.dailyLevels)} levels a day from Coral Reef`
    };
  }
  if (bubble.lithium) {
    return { mark: 'data/Atom2.png', markAlt: 'Lithium', text: 'Lithium: a 15% chance to level it each day (Atom Collider)' };
  }
  return {
    text: `No Bubble Left Behind: +${formatNum(upgradeable.minLevel)} to ${formatNum(upgradeable.maxLevel)} levels a day`
  };
};

// A bubble levelled daily: its level, its source as the mark, the source's levels and the next level's cost on a tap
const dailyTile = (bubble, index, { upgradeable, account, discounts }) => {
  const name = bubbleTitle(bubble.bubbleName);
  const { mark, markAlt, text } = dailySource(bubble, upgradeable);
  return <IconTile key={`${bubble.rawName}-${index}`} icon={`data/${bubble.rawName}.png`} alt={name}
                   value={formatNum(bubble.level)} mark={mark} markAlt={markAlt}
                   details={<Stack gap={1}>
                     <Stack gap={0.5}>
                       <Typography variant={'body2'}>{`${name}, Lv ${formatNum(bubble.level)}`}</Typography>
                       <Typography variant={'body2'} color={'text.secondary'}>{text}</Typography>
                     </Stack>
                     {bubbleCost(bubble, { account, discounts })}
                   </Stack>}/>;
};

// A search finds a bubble by its name, its sentence or the name of a material it costs; the rest are not drawn
const matchesSearch = (bubble, query) => !query || [bubbleTitle(bubble?.bubbleName), cleanUnderscore(bubble?.desc ?? ''),
  ...(bubble?.itemReq ?? []).filter(isMaterial).map(materialName)].some((text) => text.toLowerCase().includes(query));

// A bubble the game has not given a bonus yet ("It's just a normal bubble"): no bonus, cap or target of its own
const isPlaceholderBubble = (bubble) => bubble?.bubbleName === 'BUBBLE';

// One bubble's numbers, once for its tile, its details and its table row. A Prisma bubble's bonus and cap take the
// Prisma multi. The target is the level that reaches the efficiency threshold, while the bubble is under it; a failed
// section has no level to aim from and dims nothing. How far it is to its cap is the ratio of the two numbers as shown
const bubbleRow = (bubble, cauldronIndex, { account, prisma, failed, effThreshold, levelThreshold, dimPastEff, dimPastLevel }) => {
  const { level = 0, func = '', x1, x2 } = bubble;
  const isPrisma = !failed && isPrismaBubble(account, bubble.bubbleIndex);
  const multi = isPrisma ? prisma : 1;
  // A bubble not found yet gives nothing, though some curves start above 0 (bigBase at x1, decayMulti at 1)
  const bonus = level > 0 ? round(growth(func, level, x1, x2, false) * multi) : 0;
  const placeholder = isPlaceholderBubble(bubble);
  const capped = getMaxBonus(func, x1);
  const maxBonus = capped ? capped * multi : null;
  const needed = maxBonus && !failed ? (func.toLowerCase() === 'adddecay'
    ? findAddDecayThresholdLevel(func, x1, x2, multi, effThreshold, maxBonus)
    : effThreshold / (100 - effThreshold) * x2) : null;
  const missing = needed === null ? null : needed - level;
  const pastEff = func.toLowerCase().includes('decay') && (!maxBonus || (missing !== null && missing <= 0));
  const bonusText = gameBonusText(bonus, bubble, 'bubble');
  const maxText = maxBonus && !placeholder ? gameBonusText(maxBonus, bubble, 'bubble') : null;
  return {
    bubble,
    cauldronIndex,
    rawName: bubble.rawName,
    name: bubbleTitle(bubble.bubbleName),
    level,
    isPrisma,
    placeholder,
    bonusText,
    maxText,
    capPercent: maxText ? shownPercent(bonusText, maxText) : null,
    // Infinity at a 100% threshold: a decaying bonus never reaches its cap
    target: missing > 0 && !placeholder ? level + Math.ceil(missing) : null,
    pastThreshold: !failed && ((dimPastEff && pastEff) || (dimPastLevel && level > levelThreshold))
  };
};

const prismaGlow = (row) => (row.isPrisma ? `data/aUpgradesGlow${row.cauldronIndex}.png` : undefined);

// The bonus as the game rounds it for the sentence, with its digits grouped
const bonusAmount = (text) => formatNum(Number(text), 'exact');

// A bubble's details on a tap: its sentence filled as the game fills it, how far it is to its cap, the level that
// reaches the efficiency threshold, and the next level's cost. A bubble at Lv 0 is not found yet (a cauldron's
// unlocked bubbles stop at its first Lv 0 one), so it has no level to buy
const bubbleNote = (row, { account, discounts, prismaText, effThreshold, showTargets }) => {
  const { bubble, name, level, isPrisma, placeholder, bonusText, maxText, capPercent, target } = row;
  const threshold = formatNum(effThreshold, 'pct');
  // The sentence already holds the bonus where it fills one, so the line names only how far it is to the cap
  const sentenceHasBonus = (bubble.desc ?? '').includes('{');
  const capText = formatNum(capPercent, 'pct');
  return <Stack gap={1}>
    <Stack gap={0.5}>
      <Typography variant={'body2'}>{`${name}, Lv ${formatNum(level)}`}</Typography>
      {isPrisma && !placeholder ? <Typography variant={'body2'} color={'text.secondary'}>
        {prismaText ? `Prisma: ${prismaText} bonus` : 'Prisma'}</Typography> : null}
      <Typography variant={'body2'}>{cleanUnderscore((bubble.desc ?? '').replace(/{/g, bonusText))}</Typography>
      {level > 0 ? null : <StatusText status={'needs'}>Not found yet</StatusText>}
    </Stack>
    <ItemCard.Facts rows={[
      maxText ? ['Bonus', sentenceHasBonus ? `${capText} of ${bonusAmount(maxText)}`
        : `${bonusAmount(bonusText)} of ${bonusAmount(maxText)} (${capText})`] : null,
      showTargets && target !== null
        ? Number.isFinite(target) ? [`Reaches ${threshold} at`, `Lv ${formatNum(target)}`] : [`Reaches ${threshold}`, 'Never']
        : null
    ]}/>
    {level > 0 ? bubbleCost(bubble, { account, discounts }) : null}
  </Stack>;
};

// The table view: one row per bubble, banded by cauldron
const bubbleColumns = (showTargets) => [
  {
    key: 'name',
    label: 'Bubble',
    icon: (row) => <GameIcon src={`data/${row.rawName}.png`} frame={prismaGlow(row)} size={24} alt={''}/>,
    value: (row) => row.name
  },
  { key: 'level', label: 'Level', kind: 'amount', value: (row) => row.level },
  showTargets ? {
    key: 'target',
    label: 'Target',
    kind: 'amount',
    value: (row) => (Number.isFinite(row.target) ? row.target : null)
  } : null,
  { key: 'cap', label: 'Of cap', kind: 'pct', value: (row) => row.capPercent },
  { key: 'bonus', label: 'Bonus', kind: 'exact', value: (row) => (row.placeholder ? null : Number(row.bonusText)) }
].filter(Boolean);

const Bubbles = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const [settings, setSettings, resetSettings] = usePageSettings('bubbles', BUBBLE_SETTINGS);
  const [view, setView, resetView] = useToolbarState('bubbles', BUBBLES_TOOLBAR);
  const [toolbarBottom, setToolbarBottom] = useState(null);
  const pageTop = usePageTop();
  const failedIn = (sections) => sections.find((section) => isSectionFailed(account, section));
  const failedSection = failedIn(PAGE_SECTIONS);
  const alchemyFailed = isSectionFailed(account, 'alchemy');
  const nblbFailed = Boolean(failedIn(NBLB_SECTIONS));
  const krukFailed = Boolean(failedIn(KRUK_SECTIONS));
  const grindTimeFailed = Boolean(failedIn(GRIND_TIME_SECTIONS));
  const prismaFailed = Boolean(failedIn(PRISMA_SECTIONS));
  // A failed alchemy section's default is {}, whose bubble lists getGrindTimeBubbleDaily and getUpgradeableBubbles
  // read unguarded (the parser's fix is a leftover), so they run only on a parsed section
  const hasBubbles = Array.isArray(account?.alchemy?.bubblesFlat);
  // ...and the grid draws the catalog at zero (the parser's own with no save), with no cost, target or dim
  const alchemy = hasBubbles ? account?.alchemy : getAlchemy({}, [], {});
  const upgradeable = hasBubbles ? getUpgradeableBubbles(account, state?.characters) : NO_UPGRADEABLE;
  const grindTime = hasBubbles ? getGrindTimeBubbleDaily(account) : null;
  // Empty without Kattlekruk's major blessing (the parser's own gate)
  const krukBubbles = hasBubbles ? getPossibleZenithMarketBubbles(account, state?.characters) : [];
  const kruk = krukBubbles.length ? getKrukBubblesDaily(account) : null;
  const prismaMulti = getPrismaMulti(account);
  const future = futureBubbles(account?.alchemy?.cauldrons, settings?.futureFromMost);
  const effThreshold = settings?.effThreshold ?? BUBBLE_SETTINGS.effThreshold;
  const levelThreshold = settings?.levelThreshold ?? BUBBLE_SETTINGS.levelThreshold;
  const bargainTags = settings?.bargainTags ?? 0;
  const discounts = { classDiscount: settings?.classDiscount, bargainTags };

  const nblbText = upgradeable.upgradeableBubblesAmount
    ? `${formatNum(upgradeable.upgradeableBubblesAmount)} bubbles`
    : 'Off';
  const krukText = formatNum(kruk?.value ?? 0);
  const prismaText = `${formatGame(prismaMulti?.value ?? 1, 'ArcaneType.PrismaBonusMult')}x`;
  // What the costs are priced with, while a discount setting is on (a failed section prices nothing)
  const pricedWith = alchemyFailed ? '' : [settings?.classDiscount ? 'Class discount' : null,
    bargainTags > 0 ? `${formatNum(bargainTags)} bargain tag${bargainTags === 1 ? '' : 's'}` : null].filter(Boolean).join(', ');
  const daily = [...upgradeable.normal, ...upgradeable.atomBubbles, ...krukBubbles,
    ...(grindTime?.dailyLevels > 0 ? [grindTime] : [])];

  // The four cauldrons in the game's order, each bubble's numbers once; a search hides the bubbles it does not find
  const query = String(view?.search ?? '').trim().toLowerCase();
  const rowContext = {
    account, prisma: prismaMulti?.value ?? 1, failed: alchemyFailed, effThreshold, levelThreshold,
    dimPastEff: settings?.dimPastEff, dimPastLevel: settings?.dimPastLevel
  };
  const cauldrons = CAULDRON_INFO.map(({ name, displayName }, cauldronIndex) => {
    const rows = (alchemy?.bubbles?.[name] ?? []).filter((bubble) => bubble?.func)
      .map((bubble) => bubbleRow(bubble, cauldronIndex, rowContext));
    return {
      name,
      displayName,
      levels: rows.reduce((sum, { level }) => sum + level, 0),
      total: rows.length,
      shown: rows.filter(({ bubble }) => matchesSearch(bubble, query))
    };
  });
  const totalBubbles = cauldrons.reduce((sum, { total }) => sum + total, 0);
  const shownBubbles = cauldrons.reduce((sum, { shown }) => sum + shown.length, 0);
  const noteContext = {
    account, discounts, prismaText: prismaFailed ? null : prismaText, effThreshold,
    showTargets: settings?.showTargets ?? BUBBLE_SETTINGS.showTargets
  };

  return (
    <>
      <NextSeo
        title="Bubbles | Idleon Toolbox"
        description="Keep track of your bubbles level and requirements with a handy calculator"
      />
      {failedSection ? <MissingData name={SECTION_NAMES[failedSection]} failed/> : null}
      {/* A failed alchemy section has no costs, targets or cauldrons for the settings to change */}
      {alchemyFailed ? null : <PageSettings state={settings} defaults={BUBBLE_SETTINGS} onChange={setSettings}
                                            onReset={resetSettings}>
        <PageSettings.Toggle name={'classDiscount'} label={'Class discount'}
                             help={'Counts your class discount bubble in the Power, Quicc and High-IQ costs.'}/>
        <PageSettings.Number name={'bargainTags'} label={'Bargain tags'} min={0} max={8} integer
                             defaultValue={BUBBLE_SETTINGS.bargainTags}
                             help={'Each tag cuts bubble costs by 25%, stacking: 2 tags is 43.75% off.'}/>
        <PageSettings.Toggle name={'showTargets'} label={'Show target levels'}
                             help={'A bubble under the efficiency threshold shows the level that reaches it.'}/>
        <PageSettings.Number name={'effThreshold'} label={'Efficiency threshold'} min={0} max={100}
                             defaultValue={BUBBLE_SETTINGS.effThreshold}
                             help={'The share of its cap a bubble with a cap should reach, in percent.'}/>
        <PageSettings.Toggle name={'dimPastEff'} label={'Dim past the efficiency threshold'}
                             help={'Bubbles at or past the efficiency threshold are dimmed.'}/>
        <PageSettings.Number name={'levelThreshold'} label={'Level threshold'} min={0} integer
                             defaultValue={BUBBLE_SETTINGS.levelThreshold}
                             help={'A bubble past this level is past the level threshold.'}/>
        <PageSettings.Toggle name={'dimPastLevel'} label={'Dim past the level threshold'}
                             help={'Bubbles past the level threshold are dimmed.'}/>
        <PageSettings.Toggle name={'futureFromMost'} label={'Future bubbles from your most progressed cauldron'}
                             help={'Off: from your least progressed cauldron, the one you are waiting on.'}/>
      </PageSettings>}
      <PageSummary>
        <StatTile label={'No Bubble Left Behind'} value={nblbFailed ? '-' : nblbText}
                  sub={!nblbFailed && upgradeable.upgradeableBubblesAmount
                    ? `+${formatNum(upgradeable.minLevel)} to ${formatNum(upgradeable.maxLevel)} levels each`
                    : undefined}
                  breakdown={!nblbFailed && upgradeable.breakdown ? { ...upgradeable.breakdown, totalValue: nblbText } : undefined}
                  breakdownTitle={'No Bubble Left Behind'}/>
        {kruk || krukFailed ? <StatTile label={'Kattlekruk levels per day'} icon={'data/DivGod8.png'}
                                        value={krukFailed ? '-' : krukText}
                                        sub={krukFailed ? undefined : `${formatNum(krukBubbles.length)} bubbles`}
                                        breakdown={!krukFailed && kruk?.breakdown ? { ...kruk.breakdown, totalValue: krukText } : undefined}
                                        breakdownTitle={'Kattlekruk levels per day'}/> : null}
        {grindTime?.dailyLevels > 0 || grindTimeFailed ? <StatTile label={'Grind Time levels per day'} icon={'data/Reefz1.png'}
                                                                   value={grindTimeFailed ? '-' : formatNum(grindTime.dailyLevels)}
                                                                   sub={grindTimeFailed ? undefined : 'From Coral Reef'}/> : null}
        <StatTile label={'Future bubbles'} value={alchemyFailed ? '-' : future.text}
                  sub={alchemyFailed ? undefined : `Bubble ${formatNum(future.first)}`}
                  breakdown={alchemyFailed ? undefined : future.breakdown} breakdownTitle={'Future bubbles'}
                  breakdownNoun={'bubbles'}/>
        <StatTile label={'Prisma multi'} value={prismaFailed ? '-' : prismaText}
                  breakdown={!prismaFailed && prismaMulti?.breakdown ? { ...prismaMulti.breakdown, totalValue: prismaText } : undefined}
                  breakdownTitle={'Prisma multi'}/>
        <StatTile label={'Prisma fragments'}
                  value={alchemyFailed ? '-' : formatNum(Math.floor(account?.alchemy?.prismaFragments ?? 0))}/>
        <StatTile label={'Particle upgrades'} value={formatNum(account?.accountOptions?.[OPT.alternateParticles] ?? 0)}/>
        {pricedWith ? <StatTile label={'Priced with'} value={pricedWith}/> : null}
      </PageSummary>
      {daily.length ? <Panel title={'Upgraded daily'} meta={`${formatNum(daily.length)} bubbles`} sx={{ mb: 3 }}>
        <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
          <CardGrid size={'icon'}>
            {daily.map((bubble, index) => dailyTile(bubble, index, { upgradeable, account, discounts }))}
          </CardGrid>
        </Box>
      </Panel> : null}
      <Box>
        <Toolbar state={view} defaults={BUBBLES_TOOLBAR} onChange={setView} onReset={resetView}
                 total={totalBubbles} shown={shownBubbles} noun={'bubbles'} onStickyBottom={setToolbarBottom}>
          <Toolbar.Search placeholder={'Search bubbles'}/>
          <Toolbar.View options={[['tiles', 'Tiles'], ['table', 'Table']]}/>
        </Toolbar>
        {view?.view === 'table'
          // Nothing found draws no table, not a header over nothing
          ? shownBubbles ? <DataTable
            columns={bubbleColumns(noteContext.showTargets && !alchemyFailed)}
            bands={cauldrons.filter(({ shown }) => shown.length)
              .map(({ name, displayName, shown }) => ({ key: name, label: displayName, rows: shown }))}
            rowKey={'rawName'}
            rowLabel={(row) => row.name}
            muted={(row) => row.pastThreshold}
            surface={'card'}
            stickyTop={toolbarBottom ?? pageTop}
          /> : null
          : <CardGrid size={'l'}>
            {cauldrons.map(({ name, displayName, levels, shown }) => {
              // A cauldron with no bubble the search finds draws no Panel over nothing
              if (!shown.length) return null;
              return <Panel key={name} title={displayName} meta={`${formatNum(levels)} levels`}>
                {/* Five a row, the game's worlds of five; 8 px on a phone, so the five fit its Panel */}
                <Box sx={{ p: { xs: 1, sm: 1.5 } }}>
                  <CardGrid size={'icon'} columns={5}>
                    {shown.map((row) => <IconTile key={row.rawName} icon={`data/${row.rawName}.png`} alt={row.name}
                                                  value={formatNum(row.level)} frame={prismaGlow(row)}
                                                  status={alchemyFailed ? undefined
                                                    : row.level > 0 ? (row.pastThreshold ? 'dim' : undefined) : 'missing'}
                                                  details={alchemyFailed ? undefined : bubbleNote(row, noteContext)}/>)}
                  </CardGrid>
                </Box>
              </Panel>;
            })}
          </CardGrid>}
      </Box>
    </>
  );
};

export default Bubbles;
