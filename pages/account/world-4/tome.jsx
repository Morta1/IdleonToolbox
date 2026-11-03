import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Box, Stack } from '@mui/material';
import { cleanUnderscore, formatNum, getTabs, prefix } from '@utility/helpers';
import { useSpriteBounds } from '@utility/spriteBounds';
import { formatGame, tomeQuantity } from '@utility/gameNotation';
import Tabber from '../../../components/common/Tabber';
import { PAGES } from '@components/constants';
import TomeRankings, { isTomeEntryLocked } from '@components/account/Worlds/World4/TomeRankings';
import useRealDate from '@hooks/useRealDate';
import { MissingData, isSectionFailed } from '@components/common/styles';
import NumberField from '@components/common/NumberField';
import Timer from '@components/common/Timer';
import { segmentColors } from '@parsers/world-4/tome';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import Num from '@components/common/Num';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const RANKS = ['0.1%', '0.5%', '1%', '5%', '10%', '25%', '50%', '60%', '70%', '80%', '90%', '95%'];
const TOME_TOOLBAR = { search: '', hideMaxed: false, view: 'cards' };
const TIERS = ['bronze', 'silver', 'gold', 'blue'];

// The quantity an entry needs for a number of points, the inverse of its curve (points = ceil(percent * x3)); Infinity
// when the curve never reaches it, null when the entry has no curve
const requiredQuantity = (bonus, points) => {
  const { x1, x2, x3 } = bonus || {};
  if (!x1 || x2 === undefined || !x3 || !points || points <= 0) return null;
  const targetPercent = (points - 0.5) / x3;
  // Linear
  if (x2 === 2) return Math.ceil(targetPercent * x1);
  // Diminishing returns
  if (x2 === 4) {
    const base = Math.pow(targetPercent, 1 / 0.7);
    if (base >= 2) return Infinity;
    return Math.ceil((base * x1) / (2 - base));
  }
  // Reversed: lower is better
  if (x2 === 3) {
    const base = Math.pow(targetPercent, 1 / 5);
    if (base >= 1.2) return 0;
    return Math.ceil(Math.max(0, (1.2 * 6 * x1 - base * 7 * x1) / (1.2 - base)));
  }
  // Exponential
  if (x2 === 0) {
    const base = Math.pow(targetPercent, 1 / 0.7);
    if (base >= 1.7) return Infinity;
    return Math.ceil((base * x1) / (1.7 - base));
  }
  // Logarithmic
  if (x2 === 1) {
    const denom = 2 * targetPercent - 2.4;
    if (denom === 0) return Infinity;
    const logQ = -(targetPercent * x1) / denom;
    if (logQ <= 0) return Infinity;
    return Math.ceil(Math.pow(10, logQ));
  }
  return null;
};

// The rank's word art ("TOP 25%", a 102 x 17 canvas) beside its words at its own size, cropped to the letters it draws:
// StatTile's 24 px icon shrank it past reading, and pixel art never scales up (5e's Bell). Until the bounds arrive it
// draws its whole canvas and reads as pending, as a GameIcon does.
const RankBadge = ({ top }) => {
  const src = `data/TomeTop${top}.png`;
  const bounds = useSpriteBounds();
  const [, , x0, y0, x1, y1] = bounds?.[src] ?? [102, 17, 0, 0, 102, 17];
  return <Box component={'img'} src={`${prefix}${src}`} alt={''} data-fit={bounds ? undefined : 'pending'}
              sx={{ display: 'block', flexShrink: 0, width: x1 - x0, height: y1 - y0, objectFit: 'none',
                objectPosition: `${-x0}px ${-y0}px` }}/>;
};

// The tier the parser picked, read back off its colour; its word and the theme's colour for it
const tierOf = (color) => Object.keys(segmentColors).find((tier) => segmentColors[tier] === color) ?? 'bronze';
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
  const quantity = targetPoints > 0 && targetPoints <= maxPoints ? requiredQuantity(bonus, targetPoints) : null;
  const result = !targetPoints ? null
    : targetPoints > maxPoints ? `Past the max of ${formatGame(maxPoints, 'Summoning.TomePTS')}`
      : quantity === Infinity ? 'Out of reach'
        : quantity === null ? '-' : `Needs ${tomeQuantity(bonus, quantity)}`;
  return <Stack gap={1}>
    <NumberField label={'Target points'} value={targetPoints} min={0} help={false} sx={{ width: 160 }}
                 onChange={(next) => setTargetPoints(next)}/>
    {result ? <ItemCard.Facts rows={[['Quantity for target', result]]}/> : null}
  </Stack>;
};

// The Details view: an entry's tier thresholds, its tier bar, its points against the max, and the calculator
const detailsSection = (bonus, tier) => {
  const { requiredQuantities, points = 0, maxPoints = 0, x2 } = bonus ?? {};
  // A locked entry has no tier, so its bar draws empty
  const fills = tier ? tierFills(bonus) : [0, 0, 0];
  const maxQuantity = maxPoints ? requiredQuantity(bonus, maxPoints) : null;
  return <>
    <ItemCard.Section label={'Tiers'}>
      <ItemCard.Facts rows={[
        ...Object.entries(requiredQuantities ?? {}).map(([key, value]) => [key.capitalize(), tomeQuantity(bonus, value)]),
        x2 === 3 ? ['Direction', 'Lower is better'] : null
      ]}/>
      <Stack direction={'row'} gap={0.5} aria-hidden>
        {fills.map((fill, index) => <Box key={TIERS[index]} sx={{
          position: 'relative', flex: 1, height: 8, overflow: 'hidden', bgcolor: 'action.hover',
          borderRadius: index === 0 ? '4px 0 0 4px' : index === 2 ? '0 4px 4px 0' : 0
        }}>
          <Box sx={{ position: 'absolute', inset: 0, width: `${fill * 100}%`, bgcolor: tierColor(tier) }}/>
        </Box>)}
      </Stack>
    </ItemCard.Section>
    {maxPoints ? <ItemCard.Section>
      <ItemCard.Progress label={'Points'} percent={Math.min(100, 100 * points / maxPoints)}
                         value={<Num value={points} game={'Summoning.TomePTS'}/>}
                         max={<Num value={maxPoints} game={'Summoning.TomePTS'}/>}/>
      <ItemCard.Facts rows={[maxQuantity === null ? null
        : ['Max at', maxQuantity === Infinity ? 'Out of reach' : tomeQuantity(bonus, maxQuantity)]]}/>
      <QuantityCalculator bonus={bonus} maxPoints={maxPoints}/>
    </ItemCard.Section> : null}
  </>;
};

const Tome = () => {
  const { state } = useContext(AppContext);
  const getRealDateInMs = useRealDate();
  const tome = state?.account?.tome ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'tome');
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('tome', TOME_TOOLBAR);

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
  // The cut-offs sort from the top 0.1% down: the account's tier is the first it reaches
  const rankIndex = tops.findIndex((score) => (tome?.totalPoints ?? 0) >= score);
  const rankText = rankIndex >= 0 ? `Top ${RANKS[rankIndex]}` : '-';
  const cutOffs = tops.length ? createBreakdown('Rank', rankText, flatLines(tops.map((score, index) => ({
    name: `Top ${RANKS[index]}`, value: score, formatted: `${formatGame(score, 'Summoning.TomePTS')} points`
  }))), { combine: 'list' }) : undefined;
  const resets = createBreakdown('Nametag reward reset', getRealDateInMs(nextResetTime), flatLines(nextResetTimes.map((time, index) => ({
    name: index ? `Reset ${index + 1}` : 'Next reset', value: time, formatted: getRealDateInMs(time)
  }))), { combine: 'list' });

  const accountLevel = state?.account?.accountLevel ?? 0;
  const search = String(toolbar?.search ?? '').trim().toLowerCase();
  const entries = (tome?.tome ?? []).map((bonus, position) => ({ bonus, position }));
  const shown = entries
    .filter(({ bonus }) => !search || cleanUnderscore(bonus?.name).toLowerCase().includes(search))
    .filter(({ bonus }) => !toolbar?.hideMaxed || isTomeEntryLocked(bonus, accountLevel)
      || !(bonus?.maxPoints && bonus?.points >= bonus?.maxPoints));

  return <>
    <NextSeo
      title="Tome | Idleon Toolbox"
      description="Track your Tome upgrade bonuses, highscores, and progression rewards in Legends of Idleon World 4"
    />
    {sectionFailed ? <MissingData name={'the Tome'} failed/> : null}
    <PageSummary>
      <StatTile label={'Total points'} value={sectionFailed ? '-' : formatGame(tome?.totalPoints ?? 0, 'Summoning.TomePTS')}/>
      <StatTile label={'Rank'} value={tome?.top >= 0 && !sectionFailed
        ? <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>{rankText}<RankBadge top={tome.top}/></Box>
        : rankText}
                breakdown={cutOffs} breakdownTitle={'Rank'} breakdownNoun={'cut-offs'}/>
      {/* An absolute date: the countdown is not shifted by the save's upload time */}
      <StatTile label={'Nametag reward reset'} value={<Timer type={'countdown'} date={nextResetTime}/>}
                breakdown={resets} breakdownTitle={'Nametag reward reset'} breakdownNoun={'resets'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'tome')}>
      <>
        <CardGrid size={'l'} sx={{ mb: 3 }}>
          {tome?.bonuses?.length ? <Panel title={'Tome bonuses'}>
            {tome.bonuses.map(({ name, bonus, isMulti, icon }, index) => <Panel.Row
              key={name} icon={icon || `etc/Tome_${index}.png`} name={cleanUnderscore(name).trim()}
              value={isMulti ? `${formatGame(1 + bonus / 100, 'Summoning.TomeBonus')}x` : formatNum(bonus ?? 0, 'pct')}/>)}
          </Panel> : null}
          {state?.account?.spelunking?.loreBonuses?.length ? <Panel title={'Lore bonuses'}>
            {state.account.spelunking.loreBonuses.filter((upgrade) => upgrade?.name !== 'filler').map((upgrade) => <Panel.Row
              key={upgrade?.name} icon={`etc/Tome_${upgrade?.index + 6}.png`} name={cleanUnderscore(upgrade?.name)}
              value={upgrade?.isMulti ? formatNum(1 + (upgrade?.bonus ?? 0) / 100, 'mult') : formatNum(upgrade?.bonus ?? 0, 'pct')}/>)}
          </Panel> : null}
        </CardGrid>
        <Box>
          <Toolbar state={toolbar} defaults={TOME_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                   total={entries.length} shown={shown.length} noun={'entries'}>
            <Toolbar.Search placeholder={'Search the Tome'}/>
            <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
            <Toolbar.View options={[['cards', 'Cards'], ['details', 'Details']]}/>
          </Toolbar>
          <CardGrid size={'m'}>
            {shown.map(({ bonus, position }) => {
              const { name, color, tomeLvReq, quantity, maxPoints, index } = bonus;
              const locked = isTomeEntryLocked(bonus, accountLevel);
              // A locked entry counts nothing toward the total (the parser's sum skips it): 0 points and no tier
              const points = locked ? 0 : bonus.points;
              const tier = locked ? null : tierOf(color);
              const pointsText = `${formatGame(points ?? 0, 'Summoning.TomePTS')} / ${formatGame(maxPoints ?? 0, 'Summoning.TomePTS')}`;
              return <ItemCard key={'tome-bonus' + index} title={cleanUnderscore(name?.replace('(Tap_for_more_info)', ''))}
                               dimmed={locked} status={locked ? 'locked' : maxPoints && points >= maxPoints ? 'maxed' : undefined}
                               meta={locked ? `Unlocks at account Lv ${formatGame(tomeLvReq, 'Summoning.TomeLvReq')}`
                                 : position === 19 ? 'Uses your active character' : undefined}>
                <ItemCard.Facts rows={[
                  ['Quantity', tomeQuantity(bonus, quantity)],
                  ['Points', tier ? <Box key={'pts'} component={'span'} sx={{ color: tierColor(tier) }}>
                    {`${pointsText} · ${tierName(tier)}`}</Box> : pointsText]
                ]}/>
                {toolbar?.view === 'details' ? detailsSection({ ...bonus, points }, tier) : null}
              </ItemCard>
            })}
          </CardGrid>
        </Box>
      </>
      <TomeRankings/>
    </Tabber>
  </>
};

export default Tome;
