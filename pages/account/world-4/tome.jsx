import React, { Fragment, useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, gameLines, getTabs } from '@utility/helpers';
import GameIcon from '@components/common/GameIcon';
import InfoButton from '@components/common/InfoButton';
import WithLastWord from '@components/common/WithLastWord';
import { formatGame, tomeQuantity } from '@utility/gameNotation';
import Tabber from '../../../components/common/Tabber';
import { PAGES } from '@components/constants';
import TomeRankings, { isTomeEntryLocked, RANKINGS_SETTINGS, RankingsSettings } from '@components/account/Worlds/World4/TomeRankings';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import useRealDate from '@hooks/useRealDate';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import NumberField from '@components/common/NumberField';
import Timer from '@components/common/Timer';
import { getTomeRankIndex, segmentColors, TOME_RANKS } from '@parsers/world-4/tome';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import BonusStrip from '@components/common/cards/BonusStrip';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import Num from '@components/common/Num';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { quantityForPoints } from '@components/account/Worlds/World4/tomeQuantity';
import useTabIndex from '@hooks/useTabIndex';
import { ink } from '../../../styles/theme/theme';

const TOME_TOOLBAR = { search: '', hideMaxed: false, details: false, sort: null };
const TIERS = ['bronze', 'silver', 'gold', 'blue'];

// The rank's word art ("TOP 25%") beside its words at its own size: StatTile's 24 px icon shrank it past reading, and
// pixel art never scales up (5e's Bell).
const RankBadge = ({ top }) => <GameIcon src={`data/TomeTop${top}.png`} fit={'bounds'} size={[102, 17]} alt={''}/>;

// The game's (Tap for more info) text. Only entries whose name carried the 膛 mark open it (extraction drops the mark
// and leaves its underscore); the first row's info is the Tome score panel's header, not a help text.
const helpText = ({ name, info }) => info && info !== 'filler' && /(_|\(Tap_for_more_info\))$/.test(name ?? '')
  ? gameLines(info).join('\n')
  : null;

// The tier the parser picked, read back off its colour (a locked entry has none); its word and the theme's colour for it
const tierOf = (color) => Object.keys(segmentColors).find((tier) => segmentColors[tier] === color) ?? null;
const tierName = (tier) => `${tier.capitalize()} tier`;
const tierColor = (tier) => (theme) => (theme.vars || theme).palette.identity.tomeTiers[tier];

// How far a quantity fills each of the bronze, silver and gold stretches of the tier bar
const tierFills = (bonus) => {
  const { quantity = 0, requiredQuantities } = bonus ?? {};
  const silver = requiredQuantities?.silver || null;
  const gold = requiredQuantities?.gold || null;
  const blue = requiredQuantities?.blue || null;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  // From low up to high, and on a reversed entry from high down to low
  const upTo = (low, high) => (high > low ? (quantity - low) / (high - low) : 1);
  const downTo = (high, low) => (high > low ? (high - quantity) / (high - low) : 1);
  if (bonus?.x2 === 3) {
    // Lower is better: bronze until silver's quantity, then silver down to gold's, then gold down to blue's
    return [
      silver !== null && quantity <= silver ? 1 : 0,
      silver !== null && gold !== null ? downTo(silver, gold) : 0,
      gold !== null && blue !== null ? downTo(gold, blue) : 0
    ].map(clamp);
  }
  return [
    silver !== null ? upTo(0, silver) : 0,
    silver !== null && (gold || blue) ? upTo(silver, gold || blue) : 0,
    blue !== null ? upTo(gold || silver, blue) : 0
  ].map(clamp);
};

// The calculator's own number: the points the player aims for, and the quantity that takes
const QuantityCalculator = ({ bonus, maxPoints }) => {
  const [targetPoints, setTargetPoints] = useState(null);
  const quantity = targetPoints > 0 && targetPoints <= maxPoints ? quantityForPoints(bonus, targetPoints) : null;
  const result = !targetPoints ? null
    : targetPoints > maxPoints ? `Past the max of ${formatGame(maxPoints, 'Summoning.TomePTS', { whole: true })}`
      : quantity === Infinity ? 'Out of reach'
        : quantity === null ? '-' : `Needs ${tomeQuantity(bonus, quantity, { whole: true })}`;
  return <Stack gap={1}>
    <NumberField label={'Target points'} value={targetPoints} min={0} help={false} sx={{ width: 160 }}
                 onChange={(next) => setTargetPoints(next)}/>
    {result ? <ItemCard.Facts rows={[['Quantity for target', result]]}/> : null}
  </Stack>;
};

// The Details pill's rows: an entry's tier thresholds, its tier bar, its points against the max, and the calculator
const detailsSection = (bonus, tier) => {
  const { requiredQuantities, points = 0, maxPoints = 0, x2 } = bonus ?? {};
  // A locked entry has no tier, so its bar draws empty
  const fills = tier ? tierFills(bonus) : [0, 0, 0];
  const maxQuantity = maxPoints ? quantityForPoints(bonus, maxPoints) : null;
  return <>
    <ItemCard.Section label={'Tiers'}>
      <ItemCard.Facts rows={[
        ...Object.entries(requiredQuantities ?? {}).map(([key, value]) => [key.capitalize(), tomeQuantity(bonus, value, { whole: true })]),
        x2 === 3 ? ['Direction', 'Lower is better'] : null
      ]}/>
      <Stack direction={'row'} gap={0.5} aria-hidden>
        {fills.map((fill, index) => <Box key={TIERS[index]} sx={{
          position: 'relative', flex: 1, height: 8, overflow: 'hidden', bgcolor: ink(0.08),
          borderRadius: index === 0 ? '4px 0 0 4px' : index === 2 ? '0 4px 4px 0' : 0
        }}>
          <Box sx={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, bgcolor: tierColor(tier) }}/>
        </Box>)}
      </Stack>
    </ItemCard.Section>
    {maxPoints ? <ItemCard.Section>
      <ItemCard.Progress label={'Points'} percent={Math.min(100, 100 * points / maxPoints)}
                         value={<Num value={points} game={'Summoning.TomePTS'} whole/>}
                         max={<Num value={maxPoints} game={'Summoning.TomePTS'} whole/>}/>
      <ItemCard.Facts rows={[maxQuantity === null ? null
        : ['Max at', maxQuantity === Infinity ? 'Out of reach' : tomeQuantity(bonus, maxQuantity, { whole: true })]]}/>
    </ItemCard.Section> : null}
    {maxPoints ? <ItemCard.Section label={'Calculator'}>
      <QuantityCalculator bonus={bonus} maxPoints={maxPoints}/>
    </ItemCard.Section> : null}
  </>;
};

const Tome = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['world 4'].categories, 'tome');
  const [tabIndex] = useTabIndex(tabs);
  const getRealDateInMs = useRealDate();
  const tome = state?.account?.tome ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'tome');
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('tome', TOME_TOOLBAR);
  // The Rankings tab's settings, kept under the tab's own key
  const [rankSettings, setRankSettings, resetRankSettings] = usePageSettings('tome-rankings', RANKINGS_SETTINGS);

  // Calculate countdown to next tome nametag reset and next 10 resets (stable across re-renders)
  const [{ nextResetTime, nextResetTimes }] = useState(() => {
    const PERIOD_SECONDS = 2628000; // ~30 days 10 hours
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const currentPeriod = Math.floor(currentUnixTime / PERIOD_SECONDS);
    const nextPeriod = currentPeriod + 1;
    const resets = [];
    for (let i = 0; i < 10; i++) {
      resets.push((nextPeriod + i) * PERIOD_SECONDS * 1000);
    }
    return { nextResetTime: resets[0], nextResetTimes: resets };
  });

  const tops = tome?.tops ?? [];
  const rankIndex = getTomeRankIndex(tome);
  const rankText = rankIndex >= 0 ? `Top ${TOME_RANKS[rankIndex]}` : '-';
  const cutOffs = tops.length ? createBreakdown('Rank', rankText, flatLines(tops.map((score, index) => ({
    name: `Top ${TOME_RANKS[index]}`, value: score, formatted: `${formatGame(score, 'Summoning.TomePTS', { whole: true })} points`
  }))), { combine: 'list' }) : undefined;
  const resets = createBreakdown('Nametag reward reset', getRealDateInMs(nextResetTime), flatLines(nextResetTimes.map((time, index) => ({
    name: index ? `Reset ${index + 1}` : 'Next reset', value: time, formatted: getRealDateInMs(time)
  }))), { combine: 'list' });

  const accountLevel = state?.account?.accountLevel ?? 0;
  const search = String(toolbar?.search ?? '').trim().toLowerCase();
  const entries = (tome?.tome ?? []).map((bonus, position) => ({ bonus, position }));
  // Points still to earn; a locked entry earns nothing yet, so it sorts after every open one
  const pointsLeft = (bonus) => (isTomeEntryLocked(bonus, accountLevel) ? -1
    : Math.max(0, (bonus?.maxPoints ?? 0) - (bonus?.points ?? 0)));
  const sortSign = toolbar?.sort?.order === 'asc' ? 1 : -1;
  const filtered = entries
    .filter(({ bonus }) => !search || cleanUnderscore(bonus?.name).toLowerCase().includes(search))
    .filter(({ bonus }) => !toolbar?.hideMaxed || isTomeEntryLocked(bonus, accountLevel)
      || !(bonus?.maxPoints && bonus?.points >= bonus?.maxPoints));
  const shown = toolbar?.sort?.key === 'left'
    ? filtered.toSorted((a, b) => (pointsLeft(a.bonus) < 0) - (pointsLeft(b.bonus) < 0)
      || sortSign * (pointsLeft(a.bonus) - pointsLeft(b.bonus)))
    : filtered;
  // The next better cut-off and the points to it (the lowest one while below every cut-off)
  const nextRankIndex = rankIndex < 0 ? tops.length - 1 : rankIndex - 1;
  const toNextRank = nextRankIndex >= 0 && tops[nextRankIndex] != null
    ? Math.max(0, tops[nextRankIndex] - (tome?.totalPoints ?? 0)) : null;

  return <>
    <NextSeo
      title="Tome | Idleon Toolbox"
      description="Track your Tome upgrade bonuses, highscores, and progression rewards in Legends of Idleon World 4"
    />
    {sectionFailed ? null : <PageSettings state={rankSettings} defaults={RANKINGS_SETTINGS} onChange={setRankSettings}
                                          onReset={resetRankSettings}>
      <RankingsSettings/>
    </PageSettings>}
    {sectionFailed ? <MissingData name={'the Tome'} failed atZero={!isParseFailed(state?.account) && tabs[tabIndex] === 'Overview'}/> : null}
    <PageSummary>
      <StatTile label={'Total points'} value={sectionFailed ? '-' : formatGame(tome?.totalPoints ?? 0, 'Summoning.TomePTS', { whole: true })}/>
      <StatTile label={'Rank'} value={tome?.top >= 0 && !sectionFailed
        ? <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>{rankText}<RankBadge top={tome.top}/></Box>
        : rankText}
                sub={!sectionFailed && toNextRank != null
                  ? `${formatGame(toNextRank, 'Summoning.TomePTS', { whole: true })} to Top ${TOME_RANKS[nextRankIndex]}` : undefined}
                breakdown={cutOffs} breakdownTitle={'Rank'} breakdownNoun={'cut-offs'}/>
      {/* An absolute date: the countdown is not shifted by the save's upload time */}
      <StatTile label={'Nametag reward reset'} value={<Timer type={'countdown'} date={nextResetTime}/>}
                breakdown={resets} breakdownTitle={'Nametag reward reset'} breakdownNoun={'resets'}/>
    </PageSummary>
    <Tabber tabs={tabs}>
      <>
        {/* The bonuses as tiles in rows, as Slab's: two panels of one bonus a row took most of a screen beside an empty half */}
        <Stack gap={2} sx={{ mb: 3 }}>
          {tome?.bonuses?.length ? <BonusStrip title={'Tome bonuses'}>
            {tome.bonuses.map(({ name, bonus, isMulti, icon }, index) => <StatTile
              key={name} icon={icon || `etc/Tome_${index}.png`} label={cleanUnderscore(name).trim()}
              value={isMulti ? `${formatGame(1 + bonus / 100, 'Summoning.TomeBonus')}x` : formatNum(bonus ?? 0, 'pct')}/>)}
          </BonusStrip> : null}
          {state?.account?.spelunking?.loreBonuses?.length ? <BonusStrip title={'Lore bonuses'}>
            {state.account.spelunking.loreBonuses.filter((upgrade) => upgrade?.name !== 'filler').map((upgrade) => <StatTile
              key={upgrade?.name} icon={`etc/Tome_${upgrade?.index + 6}.png`} label={cleanUnderscore(upgrade?.name)}
              value={upgrade?.isMulti ? `${formatGame(1 + (upgrade?.bonus ?? 0) / 100, 'Thingies.LoreEpiBon')}x` : formatNum(upgrade?.bonus ?? 0, 'pct')}/>)}
          </BonusStrip> : null}
        </Stack>
        <Box>
          {sectionFailed ? null : <Toolbar state={toolbar} defaults={TOME_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                   total={entries.length} shown={shown.length} noun={'entries'}>
            <Toolbar.Search placeholder={'Search the Tome'}/>
            <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
            <Toolbar.Filter name={'details'} label={'Details'} display/>
            <Toolbar.Sort options={[['left', 'Points left', 'desc']]}/>
          </Toolbar>}
          {/* An entry has no sprite to tile, so it keeps a card, five to a row on a 1920 window where four were. The
              title names what the Tome counts, so the quantity reads under it as the game lists it, with the tier:
              "1,633 / 2,175 · Blue tier" broke the narrower card's points row. A maxed entry's tier is the top one, and
              its Maxed says so. */}
          <CardGrid size={'s'} details={!sectionFailed && toolbar?.details}>
            {shown.map(({ bonus, position }) => {
              const { name, color, tomeLvReq, quantity, maxPoints, index } = bonus;
              const locked = isTomeEntryLocked(bonus, accountLevel);
              const { points } = bonus;
              const maxed = !locked && maxPoints && points >= maxPoints;
              const tier = tierOf(color);
              const pointsText = `${formatGame(points ?? 0, 'Summoning.TomePTS', { whole: true })} / ${formatGame(maxPoints ?? 0, 'Summoning.TomePTS', { whole: true })}`;
              // A locked entry counts nothing, so its line says when it opens instead of its quantity
              const meta = [
                locked ? `Unlocks at account Lv ${formatGame(tomeLvReq, 'Summoning.TomeLvReq', { whole: true })}` : tomeQuantity(bonus, quantity),
                tier && !maxed ? <Box component={'span'} sx={{ color: tierColor(tier) }}>{tierName(tier)}</Box> : null,
                position === 19 ? 'Uses your active character' : null
              ].filter(Boolean);
              const title = cleanUnderscore(name?.replace('(Tap_for_more_info)', '')).trim();
              const help = helpText(bonus);
              return <ItemCard key={'tome-bonus' + index}
                               title={help ? <WithLastWord text={title}>
                                 <InfoButton label={title} sx={{ ml: 0.5 }}>
                                   <Typography variant={'body2'} component={'span'} sx={{ whiteSpace: 'pre-line' }}>{help}</Typography>
                                 </InfoButton>
                               </WithLastWord> : title}
                               dimmed={locked} status={locked ? 'locked' : maxed ? 'maxed' : undefined}
                               meta={meta.map((part, partIndex) => <Fragment key={partIndex}>{partIndex ? ' · ' : null}{part}</Fragment>)}
                               more={detailsSection({ ...bonus, points }, tier)}>
                <ItemCard.Facts rows={[
                  ['Points', tier ? <Box key={'pts'} component={'span'} sx={{ color: tierColor(tier) }}>{pointsText}</Box> : pointsText]
                ]}/>
              </ItemCard>
            })}
          </CardGrid>
        </Box>
      </>
      <TomeRankings sectionFailed={sectionFailed}/>
    </Tabber>
  </>
};

export default Tome;
