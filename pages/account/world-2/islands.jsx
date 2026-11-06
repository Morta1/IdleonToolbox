import { NextSeo } from 'next-seo';
import { Fragment, useContext, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, isSectionFailed } from '@components/common/styles';
import AppDialog from '@components/common/Overlays/AppDialog';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import InfoButton from '@components/common/InfoButton';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import { getIslands } from '@parsers/world-2/islands';

const ESTIMATE = 'An estimate: part of it is rolled at random, so the real amount varies.';
const BOTTLE_ICON = 'data/Island1.png';
// A shop row's effect is a sprite path (a stamp, a talent book) or the bonus in words
const SPRITE = /^(data|etc)\//;

// Island trash, Shimmer and the other counts can come from the save as numeric strings. A balance or a price, so whole.
const count = (value) => formatNum(Number(value) || 0, 'whole');
// What the save holds: garbage, bottles, Shimmer and the Fractal hours
const balance = (value) => formatGame(Number(value) || 0, 'Save.IslandCount', { whole: true });

// The parser builds a level the save does not hold yet into its text as "undefined" (parsers/world-2/islands.ts:227 and
// :231, Rando's "5% Loot (" + level + ")", and :261, the Shimmer shop's "+{" replaced with its bonus), so a guest's shop
// reads 0, the level the game starts it at.
const fillMissing = (text) => String(text ?? '').replaceAll('undefined', '0');

// The Trash shop's garbage and bottle gains are levelled upgrades, never acquired once: the parser gives them a level
const isLevelled = (row) => Object.hasOwn(row, 'upgrades') && row.upgrades !== null;

const shopStatus = (row) => {
  if (typeof row.unlocked === 'boolean') {
    return row.unlocked ? <StatusText status={'done'}>Unlocked</StatusText>
      : <Box component={'span'} sx={{ color: 'text.secondary' }}>Locked</Box>;
  }
  if (!row.name || isLevelled(row)) return null;
  return row.acquired ? <StatusText status={'done'}>Acquired</StatusText>
    : <Box component={'span'} sx={{ color: 'text.secondary' }}>Not acquired</Box>;
};

// A levelled upgrade's count goes under its cost: beside it, the cost column pushed the table past a 384 phone
const shopCost = (row) => {
  const upgrades = Number(row.upgrades) || 0;
  if (upgrades <= 0) return count(row.cost);
  return <>
    {count(row.cost)}
    <Box component={'span'} sx={{ display: 'block', typography: 'caption', color: 'text.secondary' }}>
      {`${formatNum(upgrades)} upgrade${upgrades === 1 ? '' : 's'}`}
    </Box>
  </>;
};

const shopColumns = (rows) => [
  {
    key: 'bonus',
    label: 'Bonus',
    icon: (row) => (SPRITE.test(row.effect) ? <GameIcon src={`${row.effect}.png`} size={24} alt={''}/> : null),
    render: (row) => (SPRITE.test(row.effect) ? row.name : cleanUnderscore(fillMissing(row.effect)))
  },
  { key: 'cost', label: 'Cost', numeric: true, render: shopCost },
  rows.some((row) => shopStatus(row)) ? { key: 'status', label: 'Status', render: shopStatus } : null
].filter(Boolean);

// A currency's sprite in its Fact's label, beside its word
const currencyLabel = (icon, word) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
  <GameIcon src={icon} size={16} alt={''}/>
  {word}
</Box>;

const Islands = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'islands');
  const islands = state?.account?.islands;
  // A failed section's {} default: the six islands at zero, the parser's own with no save, with no cost or state
  const list = (failed ? getIslands({}, [])?.list : islands?.list) ?? [];
  const bottles = Math.round(Number(islands?.bottles) || 0);
  const [dialog, setDialog] = useState({ open: false, data: null });
  const shop = (dialog?.data?.shop ?? []).map((row, index) => ({ ...row, key: `${index}` }));

  const tile = (value) => (failed ? '-' : count(value));

  const islandFacts = (island) => {
    const { unlocked, trash, currentTrial, bestDpsEver, shimmerCurrency, hoursAfk, unclaimedDays, maxDays, mobsWaiting } = island;
    if (!unlocked) return null;
    return <>
      <ItemCard.Facts rows={[
        Object.hasOwn(island, 'trash') ? [currencyLabel('etc/Trash_Currency.png', 'Garbage'), balance(Math.floor(Number(trash) || 0))] : null,
        currentTrial ? [currencyLabel('etc/Shimmer_Currency.png', 'Shimmer'), balance(shimmerCurrency)] : null,
        currentTrial ? ['Best DPS ever', cleanUnderscore(bestDpsEver)] : null,
        Object.hasOwn(island, 'unclaimedDays') ? ['Mobs waiting', count(mobsWaiting)] : null,
        Object.hasOwn(island, 'unclaimedDays') ? [<Fragment key={'days'}>Unclaimed days <InfoButton label={'Unclaimed days'}>
          {`One unclaimed day is added per daily reset, up to ${maxDays}. A capped island spawns only 15 mobs while 13 days spawns 27, so visit before it caps.`}
        </InfoButton></Fragment>, `${count(unclaimedDays)} / ${count(maxDays)}`] : null,
        Object.hasOwn(island, 'hoursAfk') ? ['Hours AFK', balance(hoursAfk)] : null
      ]}/>
      {/* The week's trial is a sentence: as a Fact's value it squeezed its label onto two lines */}
      {currentTrial ? <ItemCard.Section label={'Current trial'}>
        <Typography variant={'body2'}>{cleanUnderscore(currentTrial)}</Typography>
      </ItemCard.Section> : null}
    </>;
  };

  const islandCard = (island, index) => {
    const { name, description, unlocked, cost, learnMore } = island;
    if (failed) {
      return <ItemCard key={name} icon={`data/IslandSail${index}.png`} title={name}>
        <ItemCard.Desc text={description}/>
      </ItemCard>;
    }
    const shopButton = learnMore ? <Button variant={'text'} onClick={() => setDialog({ data: island, open: true })}
                                           sx={{ alignSelf: 'flex-start' }}>Shop</Button> : null;
    const footer = !unlocked || shopButton ? <>
      {!unlocked ? <ItemCard.Cost icon={BOTTLE_ICON} iconAlt={'Bottles'} need={cost} have={bottles}
                                  format={balance}/> : null}
      {shopButton}
    </> : null;
    return <ItemCard key={name} icon={`data/IslandSail${index}.png`} title={name} dimmed={!unlocked} footer={footer}>
      <ItemCard.Desc text={description}/>
      {islandFacts(island)}
    </ItemCard>;
  };

  return <>
    <NextSeo
      title="Islands | Idleon Toolbox"
      description="Track your island exploration progress, available upgrades, and trash island bonuses in Legends of Idleon"
    />
    {failed ? <MissingData name={'Islands'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Bottles'} value={failed ? '-' : balance(bottles)}/>
      <StatTile label={'Bottles per day'} value={tile(islands?.bottlesPerDay)}/>
      <StatTile label={'Trash per day'} value={tile(islands?.trashPerDay)} info={failed ? undefined : ESTIMATE}/>
      <StatTile label={'Unclaimed trash days'} value={tile(islands?.numberOfDaysAfk)}/>
      <StatTile label={'Garbage to collect'} value={tile(islands?.trashPerDaysAfk)}
                info={failed ? undefined : `${ESTIMATE} A single collection is capped at 100 garbage.`}/>
    </PageSummary>
    <CardGrid size={'m'}>{list.map(islandCard)}</CardGrid>
    <AppDialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} size="l"
               title={`${dialog?.data?.name ?? ''} shop`}>
      {shop.length ? <DataTable columns={shopColumns(shop)} rows={shop} rowKey={'key'} fits/> : null}
    </AppDialog>
  </>
};

export default Islands;
