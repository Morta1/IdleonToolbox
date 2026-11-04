import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData } from '@components/common/styles';
import { getEventShopRotation } from '@parsers/misc';
import { format } from 'date-fns';
import { OPT } from '@parsers/accountOptions';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const EVENT_SHOP_TOOLBAR = { hideOwned: false };
// A pair never breaks inside itself in a line of words that wraps
const pair = (a, b) => `${formatNum(a)} / ${formatNum(b)}`;

// 'YYYY-MM-DD' -> 'Aug 2026', read as a calendar date so the month never shifts with the timezone
const monthOf = (date) => {
  const [year, month] = date.split('-').map(Number);
  return format(new Date(year, month - 1, 1), 'MMM yyyy');
};

const lastSoldText = (lastSold) => {
  if (!lastSold) return 'Not sold yet';
  const { event, from, to, tier } = lastSold;
  const sameYear = to?.slice(0, 4) === from?.slice(0, 4);
  const months = from ? to && monthOf(to) !== monthOf(from)
    ? `${sameYear ? monthOf(from).split(' ')[0] : monthOf(from)} to ${monthOf(to)}`
    : monthOf(from) : null;
  return `${event ?? 'Previous rotation'}${months ? ` (${months})` : ''}, ${tier}`;
};

const EventShop = () => {
  const { state } = useContext(AppContext);
  // The shop reads the save's own options, not a section: only a whole-parse failure leaves it nothing to read
  const parseFailed = state?.account?.failedSections?.includes('*');
  const [view, setView, resetView] = useToolbarState('event-shop', EVENT_SHOP_TOOLBAR);
  const hideOwned = !parseFailed && view.hideOwned;
  const { tiers, starsToFinish, offRotation } = getEventShopRotation(parseFailed ? {} : state?.account);
  const stars = state?.account?.accountOptions?.[OPT.eventShopCurrency] ?? 0;
  const total = offRotation.length + tiers.reduce((sum, tier) => sum + tier.bonuses.length, 0);
  const owned = offRotation.filter(({ owned }) => owned).length + tiers.reduce((sum, tier) => sum + tier.owned, 0);
  const visible = (bonus) => !(hideOwned && bonus.owned);
  const shownOffRotation = offRotation.filter(visible);
  const shownCount = shownOffRotation.length + tiers.reduce((sum, tier) => sum + tier.bonuses.filter(visible).length, 0);

  const bonusCard = ({ index, name, description, price, owned: isOwned, lastSold }, { locked, offRotation: off } = {}) => {
    const ownedNow = !parseFailed && isOwned;
    return <ItemCard key={`event-bonus-${index}`} icon={`data/EventShopBuy${index}.png`} title={titleCaseName(cleanUnderscore(name))}
                     dimmed={locked} status={ownedNow ? 'done' : undefined} statusLabel={'Owned'}
                     footer={ownedNow ? null : <ItemCard.Cost icon={'etc/Event_Currency.png'} iconAlt={'Stars'} need={price}
                                                              have={parseFailed ? undefined : stars}
                                                              format={(value) => formatNum(value, 'whole')}/>}>
      <ItemCard.Desc text={cleanUnderscore(description ?? '')}/>
      {off ? <ItemCard.Facts rows={[['Last sold', lastSoldText(lastSold)]]}/> : null}
    </ItemCard>;
  };

  return <>
    <NextSeo
      title="Event Shop | Idleon Toolbox"
      description="Track your event shop purchases, star currency, and bonus progression in Legends of Idleon"
    />
    {parseFailed ? <MissingData name={'your save'} failed/> : null}
    <PageSummary>
      <StatTile label={'Stars'} icon={'etc/Event_Currency.png'} value={parseFailed ? '-' : formatNum(stars)}/>
      <StatTile label={'Bonuses owned'} value={parseFailed ? '-' : `${formatNum(owned)} / ${formatNum(total)}`}/>
      <StatTile label={'Stars to finish the rotation'} value={parseFailed ? '-' : formatNum(starsToFinish ?? 0)}/>
    </PageSummary>
    <Box>
      {parseFailed ? null : <Toolbar state={view} defaults={EVENT_SHOP_TOOLBAR} onChange={setView} onReset={resetView}
                                     total={total} shown={shownCount} noun={'bonuses'}>
        <Toolbar.Filter name={'hideOwned'} label={'Hide owned'}/>
      </Toolbar>}
      <Typography variant={'sectionTitle'} component={'h2'}>Current rotation</Typography>
      {tiers.map(({ name, bonuses, owned: tierOwned, starsLeft, lockedBy }) => {
        const shown = bonuses.filter(visible);
        const progress = parseFailed ? null : lockedBy
          ? `Unlocks once every ${lockedBy.name} bonus is owned (${pair(lockedBy.owned, lockedBy.total)})`
          : `${pair(tierOwned, bonuses.length)} owned${starsLeft ? `, ${formatNum(starsLeft)} stars left` : ''}`;
        return <Stack key={name} mt={2} gap={1}>
          <Stack direction={'row'} alignItems={'baseline'} columnGap={1} flexWrap={'wrap'}>
            <Typography variant={'groupLabel'} component={'h3'}>{name}</Typography>
            {progress ? <Typography variant={'body2'} color={'text.secondary'}>{progress}</Typography> : null}
          </Stack>
          {shown.length
            ? <CardGrid size={'m'}>{shown.map((bonus) => bonusCard(bonus, { locked: !parseFailed && !!lockedBy }))}</CardGrid>
            : <StatusText status={'done'}>All owned</StatusText>}
        </Stack>;
      })}
      {shownOffRotation.length ? <>
        <Typography variant={'sectionTitle'} component={'h2'} sx={{ mt: 3, mb: 2 }}>Off rotation</Typography>
        <CardGrid size={'m'}>{shownOffRotation.map((bonus) => bonusCard(bonus, { offRotation: true }))}</CardGrid>
      </> : null}
    </Box>
  </>
};

export default EventShop;
