import {
  Box,
  Container,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import React, { Fragment, useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import styled from '@emotion/styled';
import {
  cleanUnderscore,
  commaNotation,
  formatNum,
  growth,
  notateNumber,
  prefix,
  round
} from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import HtmlTooltip from 'components/Tooltip';
import { NextSeo } from 'next-seo';
import {
  findAddDecayThresholdLevel,
  getAlchemy,
  getBubbleEffectPercent,
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
  LIQUID_INFO,
  liquidsIndex
} from '@parsers/world-2/alchemy';
import { useLocalStorage } from '@mantine/hooks';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { IconChartCohort, IconList } from '@tabler/icons-react';
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

const BUBBLE_SETTINGS = {
  classDiscount: false, bargainTags: 0, showTargets: true, effThreshold: 75, dimPastEff: false, levelThreshold: 100,
  dimPastLevel: false, futureFromMost: false
};

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

const Bubbles = () => {
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { state } = useContext(AppContext);
  const account = state?.account;
  const [viewMode, setViewMode] = useLocalStorage({
    key: `bubbles:viewMode`,
    defaultValue: 'list'
  });
  const batchLayout = viewMode === 'batch';
  const [searchText, setSearchText] = useLocalStorage({
    key: 'bubbles:searchText',
    defaultValue: ''
  });
  const [settings, setSettings, resetSettings] = usePageSettings('bubbles', BUBBLE_SETTINGS);
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

  const accumulatedCost = (index, level, baseCost, rawName, cauldron) => {
    const cost = materialCost(account, { index, level, cauldron }, { rawName, baseCost }, discounts);
    return { singleLevelCost: cost, total: cost };
  };

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

  const findBubble = (bubble) => {
    const lowerQuery = searchText.toLowerCase();
    if (cleanUnderscore(bubble.bubbleName)?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (cleanUnderscore(bubble.desc)?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (Array.isArray(bubble.itemReq)) {
      for (const item of bubble.itemReq) {
        const index = parseInt(item?.name?.replace(/[^0-9]/g, ''), 10) - 1;
        const mappedName = liquidsIndex[index];
        if (cleanUnderscore(mappedName)?.toLowerCase().includes(lowerQuery)) {
          return true;
        }
      }
    }

    return false;
  }

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
      <Container sx={{ mt: 2, mb: 3 }}>
        <Stack direction={'row'} gap={1} alignItems={'center'} justifyContent={'flex-end'} flexWrap={'wrap'}>
          <TextField
            value={searchText}
            size={'small'}
            placeholder={'Search bubbles'}
            onChange={({ target }) => { setSearchText(target.value); }}
          />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            sx={{ alignItems: 'center' }}
            onChange={(_, val) => val && setViewMode(val)}
          >
            <HtmlTooltip title={'Batch view'}><ToggleButton
                                                        value="batch"><IconChartCohort/></ToggleButton></HtmlTooltip>
            <HtmlTooltip title={'List view'}><ToggleButton
                                                       value="list"><IconList/></ToggleButton></HtmlTooltip>
          </ToggleButtonGroup>
        </Stack>
      </Container>
      <Container>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${batchLayout ? `calc(50% - ${5 * 8}px)` : '25%'}, 1fr))`,
          gap: batchLayout ? 5 : 0,
          mt: batchLayout ? 3 : 0
        }}>
          {Object.entries(alchemy?.bubbles || {})?.map(([cauldron, bubbles], cauldronIndex) => {
            return <Stack direction={batchLayout ? 'row' : 'column'} alignItems={'center'} flexWrap={'wrap'}
                          key={cauldron + '' + cauldronIndex}>
              {bubbles?.map((bubble, index) => {
                // if (index > 29) return null;
                const { level, itemReq, rawName, bubbleName, func, x1, x2, cauldron, bubbleIndex } = bubble;
                if (!func) return null;
                const isPrisma = isPrismaBubble(state?.account, bubbleIndex);
                const prismaMulti = isPrisma
                  ? getPrismaMulti(state?.account)?.value
                  : 1;
                const goalBonus = round(growth(func, level, x1, x2, false) * (isPrisma ? prismaMulti : 1));
                const bubbleMaxBonus = isPrisma ? getMaxBonus(func, x1) * prismaMulti : getMaxBonus(func, x1);
                const effectHardCapPercent = getBubbleEffectPercent(state?.account, bubble);

                let thresholdObj;
                if (bubbleMaxBonus && !alchemyFailed) {
                  if (func.toLowerCase() === 'adddecay') {
                    const thresholdLevelNeeded = findAddDecayThresholdLevel(
                      func,
                      x1,
                      x2,
                      prismaMulti,
                      effThreshold,
                      bubbleMaxBonus
                    );

                    thresholdObj = {
                      thresholdMissingLevels: thresholdLevelNeeded - level,
                      thresholdBonus:
                        round(growth(func, thresholdLevelNeeded, x1, x2, false) * prismaMulti),
                      effectHardCapPercent: effThreshold
                    };
                  }
                  else {
                    const thresholdLevelNeeded = effThreshold / (100 - effThreshold) * x2;

                    thresholdObj = {
                      thresholdMissingLevels: thresholdLevelNeeded - level,
                      thresholdBonus:
                        round(growth(func, thresholdLevelNeeded, x1, x2, false) * prismaMulti),
                      effectHardCapPercent:
                        thresholdLevelNeeded / (thresholdLevelNeeded + x2) * 100
                    };
                  }
                }
                const targetLevel = level + Math.ceil(thresholdObj?.thresholdMissingLevels ?? 0);
                const isBeyondEffThreshold = func.toLowerCase().includes('decay') && (!bubbleMaxBonus || thresholdObj?.thresholdMissingLevels <= 0);
                const isBeyondLevelThreshold = !alchemyFailed && levelThreshold && level > levelThreshold;
                const matchSearch = searchText ? findBubble(bubble) : true;
                const isHidden = settings?.dimPastEff && !alchemyFailed && isBeyondEffThreshold || settings?.dimPastLevel && isBeyondLevelThreshold || !matchSearch;
                return <Fragment key={rawName + '' + bubbleName + '' + index}>
                  <Stack direction={'row'} alignItems={'center'} justifyContent={'space-around'} gap={2}>
                    <Stack direction={isSm || batchLayout ? 'column' : 'row'}
                           alignItems={'center'}
                           gap={batchLayout ? 0 : 1}
                           sx={{
                             opacity: isHidden ? .2 : 1,
                             width: isSm ? 'inherit' : batchLayout ? 55 : settings?.showTargets ? 150 : 100,
                             minHeight: settings?.showTargets && batchLayout ? 110 : isSm || batchLayout ? settings?.showTargets
                               ? 120
                               : 100 : 'inherit'
                           }}
                    >
                      <HtmlTooltip
                        maxWidth={450}
                        title={<AdditionalInfo tooltip bubbleMaxBonus={bubbleMaxBonus}
                                               goalBonus={goalBonus}
                                               cauldron={cauldron}
                                               effectHardCapPercent={effectHardCapPercent}
                                               itemReq={alchemyFailed ? [] : itemReq}
                                               thresholdObj={thresholdObj}
                                               accumulatedCost={accumulatedCost}
                                               account={state?.account}
                                               level={level}
                                               index={index}
                                               bubble={bubble}
                                               isPrisma={isPrisma}
                        />}>
                        <Stack sx={{ position: 'relative' }}>
                          {isPrisma ? <img style={{ position: 'absolute', width: 48, height: 48 }}
                                           src={`${prefix}data/aUpgradesGlow${cauldronIndex}.png`} alt=""/> : null}
                          <BubbleIcon width={48} height={48}
                                      level={level}
                                      src={`${prefix}data/${rawName}.png`}
                                      alt={rawName}/>
                        </Stack>

                      </HtmlTooltip>
                      <Stack alignItems={batchLayout || isSm ? 'center' : 'flex-start'}>
                        <Stack direction={batchLayout || isSm ? 'column' : 'row'} alignItems={'center'}>
                          <Typography color={thresholdObj?.thresholdMissingLevels > 0 ? 'text.error' : ''}
                                      sx={{ mr: !batchLayout ? .5 : 0 }}
                                      variant={'caption'}>{commaNotation(level)}</Typography>
                          {settings?.showTargets && thresholdObj?.thresholdMissingLevels > 0
                            ? <Typography component={!batchLayout && isSm ? 'div' : 'span'}
                                          color={'text.error'}
                                          variant={'caption'}
                                          sx={{ whiteSpace: 'nowrap' }}> / {targetLevel >= 1e5
                              ? notateNumber(targetLevel, 'Big')
                              : commaNotation(targetLevel)}</Typography>
                            : null}
                        </Stack>
                        {(bubbleMaxBonus) ? <Typography
                            fontSize={'0.70rem'}
                            variant={'caption'}>({formatNum(effectHardCapPercent, 'pct')})</Typography> :
                          isSm ? <Typography>&nbsp;</Typography> : null}
                      </Stack>
                    </Stack>
                  </Stack>
                  {
                    !isSm && (index + 1 < bubbles.length - 1) && (index + 1) % 5 === 0
                      ?
                      <Divider sx={{ my: 1 }} flexItem/>
                      : null
                  }
                </Fragment>
              })}
            </Stack>
          })}
        </Box>
      </Container>
    </>
  );
};

const AdditionalInfo = ({
                          tooltip,
                          bubbleMaxBonus,
                          goalBonus,
                          effectHardCapPercent,
                          itemReq,
                          thresholdObj,
                          accumulatedCost,
                          index,
                          level,
                          cauldron,
                          account,
                          bubble,
                          isPrisma
                        }) => {
  return <Box>
    {tooltip ? <BubbleTooltip {...{ ...bubble, goalBonus, isPrisma }} /> : null}
    <Stack gap={2} direction={'row'}>
      <Stack gap={bubbleMaxBonus && thresholdObj?.thresholdMissingLevels > 0 ? 0 : 2} justifyContent={'center'}
             alignItems={'center'}>
        <BonusIcon src={`${prefix}data/SignStar1b.png`} alt="Sign Star1b"/>
        <Typography variant={(bubbleMaxBonus) && thresholdObj?.thresholdMissingLevels > 0
          ? 'caption'
          : ''}>{formatNum(goalBonus, 'amount', { precise: true })} {(bubbleMaxBonus)
          ? `(${notateNumber(effectHardCapPercent)}%)`
          : ''}</Typography>
      </Stack>
      {
        itemReq?.map(({ rawName, name, baseCost }, itemIndex) => {
          let updatedName = name;
          if (rawName === 'Blank' || rawName === 'ERROR') return null;
          const {
            singleLevelCost,
            total
          } = accumulatedCost(index, level, baseCost, rawName, cauldron);
          const x1Extension = ['sail', 'bits', 'w6item', 'w7item', 'liquid'];
          const itemName = x1Extension.find((str) => rawName.toLowerCase().includes(str))
            ? `${rawName}_x1`
            : rawName;
          const atomCost = getBubbleParticleCost(account, index, rawName, itemIndex, singleLevelCost);
          let amount;
          if (rawName.includes('Liquid')) {
            const liquids = { 'Liquid1': 0, 'Liquid2': 1, 'Liquid3': 2, 'Liquid4': 3 };
            amount = account?.alchemy?.liquids?.[liquids?.[rawName]];
            const index = parseInt(name?.replace(/[^0-9]/g, ''), 10) - 1;
            updatedName = liquidsIndex[index];
          }
          else if (rawName.includes('Bits')) {
            amount = account?.gaming?.bits;
          }
          else if (rawName.includes('Sail')) {
            amount = account?.sailing?.lootPile?.find(({ rawName: lootPileName }) => lootPileName === rawName.replace('SailTr', 'SailT'))?.amount;
          }
          else if (rawName.includes('W6item')) {
            const crops = { 'W6item1': 4, 'W6item2': 30, 'W6item3': 46, 'W6item4': 72, 'W6item5': 99 };
            const essences = { 'W6item6': 0, 'W6item7': 1, 'W6item8': 2, 'W6item9': 3, 'W6item10': 4 };
            if (crops?.[rawName]) {
              amount = account?.farming?.crop?.[crops?.[rawName]];
            }
            else if (essences.hasOwnProperty(rawName)) {
              amount = account?.summoning?.essences?.[essences?.[rawName]];
            }
          }
          else if (rawName.includes('W7item')) {
            const discoveryIndexes = { 'W7item0': 0, 'W7item1': 1, 'W7item2': 2, 'W7item3': 3 };
            const flatDiscoveries = account?.spelunking?.discoveries?.flat() || [];
            amount = flatDiscoveries?.[discoveryIndexes?.[rawName]]?.amount;
          }
          else {
            amount = account?.storage?.list?.find(({ rawName: storageRawName }) => (storageRawName === rawName))?.amount;
          }
          return <Stack direction={'row'} key={`${rawName}-${name}-${itemIndex}`} gap={3}>
            {atomCost ? <Stack gap={2} alignItems={'center'}>
                <Tooltip title={<Typography
                  color={account?.atoms?.particles > atomCost
                    ? 'text.success'
                    : ''}>{Math.floor(account?.atoms?.particles)} / {atomCost}</Typography>}>
                  <ItemIcon src={`${prefix}etc/Particle.png`} alt="Particle"/>
                </Tooltip>
                <HtmlTooltip title={atomCost}>
                  <Typography>{notateNumber(atomCost, 'Big')}</Typography>
                </HtmlTooltip></Stack>
              : null}
            <Stack gap={2} justifyContent={'center'}
                   alignItems={'center'}>
              <HtmlTooltip title={cleanUnderscore(updatedName)}>
                <ItemIcon src={`${prefix}data/${itemName}.png`}
                          alt={itemName}/>
              </HtmlTooltip>
              <Typography color={amount >= total
                ? 'text.success'
                : ''}>{notateNumber(total, 'Big')}</Typography>
            </Stack>
          </Stack>
        })
      }
    </Stack>
    {bubbleMaxBonus ? <>
      <Divider sx={{ my: 1 }}/>
      <Typography variant="body2">
        {`${formatNum(goalBonus, 'amount', { precise: true })} is ${notateNumber(effectHardCapPercent)}% of possible hard cap effect of ${formatNum(bubbleMaxBonus, 'amount', { precise: true })}`}
      </Typography>
    </> : null}
  </Box>
}

const BonusIcon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`
const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
`;

const BubbleIcon = styled.img`
  opacity: ${({ level }) => level === 0 ? .5 : 1};
  border-radius: 50%;
`;

const BubbleTooltip = ({ goalBonus, bubbleName, desc }) => {
  return <>
    <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(bubbleName.toLowerCase().capitalizeAll())}</Typography>
    <Divider sx={{ my: 1 }}/>
    <Typography variant={'body1'}>{cleanUnderscore(desc.replace(/{/g, Math.ceil(goalBonus)))}</Typography>
    <Divider sx={{ my: 1 }}/>
  </>;
}

export default Bubbles;
