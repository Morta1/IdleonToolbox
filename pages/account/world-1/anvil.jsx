import React, { Fragment, useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, fillArrayToLength, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Timer from 'components/common/Timer';
import {
  calcTotals,
  getAnvilProductCatalog,
  getAnvilTotalsBreakdowns,
  getAnvilFutureProduction,
  getPlayerAnvil,
  getTimeTillCap
} from '@parsers/world-1/anvil';
import { items } from '@website-data';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Notice from '@components/common/Notice';
import { Duration } from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Panel from '@components/common/cards/Panel';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// The anvil is the characters' own, not a section: its speed reads these sections (the stamp, the statue, the star
// sign, the vault upgrade and the Hammer Hammer bubble). While one failed, every number made from the speed reads "-",
// and the note names the first failed in this order.
const SECTION_NAMES = {
  stamps: 'Stamps', statues: 'Statues', starSigns: 'Star Signs', upgradeVault: 'the Upgrade Vault',
  equippedBubbles: 'equipped bubbles', alchemy: 'Bubbles', companions: 'Companions'
};
const SPEED_SECTIONS = Object.keys(SECTION_NAMES);

const itemName = (rawName) => cleanUnderscore(items?.[rawName]?.displayName ?? rawName);

// One line of parts, each kept whole ("Points 300 / 320" never breaks inside its pair)
const metaLine = (parts) => parts.filter(Boolean).map((part, index) => <Fragment key={index}>
  {index ? ' · ' : null}<Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{part}</Box>
</Fragment>);

const catalogCard = ({ rawName, displayName, requiredAmount, levelReq, exp }) => <ItemCard
  key={rawName} icon={`data/${rawName}.png`} title={cleanUnderscore(displayName)}>
  <ItemCard.Facts rows={[['Smithing Lv', formatNum(levelReq ?? 0, 'whole')], ['Materials', formatNum(requiredAmount ?? 0, 'whole')],
    ['EXP per craft', formatNum(exp ?? 0)]]}/>
</ItemCard>;

const Anvil = () => {
  const { state } = useContext(AppContext);
  const anvil = state?.account?.anvil ?? [];
  const speedFailed = SPEED_SECTIONS.find((section) => isSectionFailed(state?.account, section));

  const totals = calcTotals(state?.account, state?.characters) ?? {};
  const totalsBreakdowns = getAnvilTotalsBreakdowns(state?.account, state?.characters);

  const productTile = ([rawName, perHour]) => {
    const name = itemName(rawName);
    const text = speedFailed ? '-' : formatNum(perHour, 'rate');
    const breakdown = speedFailed ? undefined : totalsBreakdowns?.[rawName];
    return <StatTile key={rawName} icon={`data/${rawName}.png`} label={name} value={text}
                     sub={speedFailed ? undefined : `${formatNum(perHour * 24)} per day`}
                     breakdown={breakdown ? { ...breakdown, totalValue: text } : undefined}
                     breakdownTitle={name} breakdownNoun={'characters'}/>;
  };

  const slotCard = (slot, slotIndex, stats, afkTime) => {
    if (!slot?.hammers) return <ItemCard key={`empty-${slotIndex}`} title={'Empty slot'} dimmed/>;
    const { rawName, hammers, requiredAmount, currentXP, displayName, exp } = slot;
    const future = getAnvilFutureProduction({ ...slot, stats, afkTime });
    const capacity = stats?.anvilCapacity;
    const percentOfCap = Math.round(future / capacity * 100);
    // The Summary's rate for this character and product: a slot makes no more an hour than its cap holds
    const perDay = 24 * Math.min((stats?.anvilSpeed ?? 0) * hammers / requiredAmount, capacity ?? 0);
    const timeTillCap = getTimeTillCap({ ...slot, stats, afkTime });
    const timeFromZero = getTimeTillCap({
      ...slot,
      stats,
      afkTime,
      currentAmount: 0,
      currentProgress: 0,
      fromZero: true
    });
    const capText = formatGame(capacity, 'AnvilProduceStats.Cap', { whole: true });
    const fullIn = percentOfCap >= 100
      ? <StatusText status={'ready'}>Full</StatusText>
      : <Timer type={'countdown'} component={'span'} date={new Date().getTime() + (timeTillCap * 1000)}
               lastUpdated={state?.lastUpdated} placeholder={<StatusText status={'ready'}>Full</StatusText>}/>;
    return <ItemCard key={`${rawName}-${slotIndex}`} icon={`data/${rawName}.png`}
                     title={cleanUnderscore(displayName ?? rawName)}
                     meta={`${formatNum(hammers)} ${hammers === 1 ? 'hammer' : 'hammers'}`}>
      {/* Without the speed, the amount made since the save is unknown: the cap alone, no bar */}
      {speedFailed ? null : <ItemCard.Progress label={'Cap'} value={formatGame(future, 'AnvilProduceStats.Cap', { whole: true })}
                                               max={capText}
                                               percent={Number.isFinite(percentOfCap) ? Math.min(100, percentOfCap) : 0}/>}
      <ItemCard.Facts rows={[
        speedFailed ? ['Cap', capText] : null,
        ['Full in', speedFailed ? '-' : fullIn],
        ['Full from empty', speedFailed ? '-' : <Duration seconds={timeFromZero}/>],
        ['Per day', speedFailed ? '-' : formatNum(perDay)],
        ['EXP per craft', formatNum(exp ?? 0)],
        ['EXP waiting', formatGame(currentXP ?? 0, 'Big', { whole: true })]
      ]}/>
    </ItemCard>;
  };

  const anvilPanel = (_, index) => {
    const character = state?.characters?.[index];
    const smithing = character?.skillsInfo?.smithing?.level ?? 0;
    const { stats, production } = getPlayerAnvil(character, state?.characters, state?.account);
    const { availablePoints = 0, pointsFromCoins = 0, pointsFromMats = 0 } = stats ?? {};
    const totalPoints = pointsFromCoins + pointsFromMats + smithing;
    const hammerBubble = character?.equippedBubbles?.find(({ bubbleName }) => bubbleName === 'HAMMER_HAMMER');
    const maxProducts = hammerBubble ? 3 : 2;
    const working = production?.filter(({ hammers }) => hammers > 0) ?? [];
    const numOfHammers = working.reduce((res, { hammers }) => res + hammers, 0);
    const slots = numOfHammers >= maxProducts ? working : fillArrayToLength(numOfHammers, working);
    const meta = metaLine([`Smithing ${formatNum(smithing, 'level')}`,
      `Points ${formatNum(totalPoints - availablePoints)} / ${formatNum(totalPoints)}`,
      availablePoints > 0 ? `${formatNum(availablePoints)} unspent` : null]);
    return <Panel key={`anvil-${index}`} icon={`data/ClassIcons${character?.classIndex}.png`}
                  title={character?.name ?? `Character ${index + 1}`} meta={meta}>
      {slots.length ? <Box sx={{ p: 2 }}>
        <CardGrid size={'s'}>
          {slots.map((slot, slotIndex) => slotCard(slot, slotIndex, stats, character?.afkTime))}
        </CardGrid>
      </Box> : null}
    </Panel>;
  };

  const products = Object.entries(totals);

  return <>
    <NextSeo
      title="Anvil | Idleon Toolbox"
      description="Monitor your characters' anvil production rates, craft queues, and smithing progress in Legends of Idleon"
    />
    {speedFailed ? <MissingData name={SECTION_NAMES[speedFailed]} failed/> : !anvil.length
      ? <Notice tone={'signin'} sx={{ mb: 2 }}>Each character&apos;s anvil shows here once you sign in.</Notice>
      : null}
    {products.length ? <PageSummary>{products.map(productTile)}</PageSummary> : null}
    {/* Two or three characters a row from md: a character runs two or three slots, so a full-width Panel was mostly
     empty */}
    {anvil.length ? <CardGrid size={'l'}>{anvil.map(anvilPanel)}</CardGrid> : <>
      <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.5 }}>Anvil products</Typography>
      <CardGrid size={'s'}>{getAnvilProductCatalog().map(catalogCard)}</CardGrid>
    </>}
  </>;
};

export default Anvil;
