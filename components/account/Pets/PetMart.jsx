import React, { useState } from 'react';
import { Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { cleanUnderscore, getNextPetMartRestock, numberWithCommas, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import Timer from '@components/common/Timer';
import { usePetMartHistory } from '@hooks/usePetMartHistory';
import { mergePetMartHistory } from '@utility/petMartHistory';

// The tournament's Pet Mart: two counters that each restock daily with five pets. The base counter
// sells the pet itself, the + counter sells the Pet Mart+ upgrade of a pet you already own. Both
// price in Pet Crystals, and a day's discount shows as a struck list price beside the real one.
// The full + price list lives in the Pets tab's Pet Mart+ view; this tab is today's stock and the
// log of past rotations.
const crystalStyle = { objectFit: 'contain', filter: 'hue-rotate(280deg)' };

const Price = ({ listPrice, price }) => {
  const discounted = listPrice > price;
  return <Stack direction={'row'} gap={0.5} alignItems={'center'}>
    <img width={16} height={16} style={crystalStyle} src={`${prefix}data/PremiumGem.png`} alt={'Pet Crystals'}/>
    {discounted && <Typography variant={'caption'} color={'text.secondary'} sx={{ textDecoration: 'line-through' }}>
      {numberWithCommas(listPrice)}
    </Typography>}
    <Typography variant={'body2'} color={discounted ? 'success.main' : 'text.primary'}>
      {numberWithCommas(price)}
    </Typography>
  </Stack>;
};

const OfferCard = ({ offer, companion, plus }) => {
  const name = companion?.name ?? offer.name;
  const owned = Boolean(companion?.acquired) && !companion?.viaToken && !companion?.simulated;
  // The green border means "you already have what this card sells": the pet on the base counter,
  // the upgrade on the + counter. Same cue as the Pets tab, read against the offer.
  const have = plus ? Boolean(companion?.upgraded) : owned;
  const effect = plus ? companion?.upgradedEffect : companion?.effect;
  // The + counter only upgrades a pet you own a real copy of: a token or a simulation is not one.
  const needsBasePet = plus && !have && !(companion?.copies > 0);

  // 240 wide so a counter's five offers sit on one row at 1920.
  return <Card sx={{
    width: 240,
    border: have ? '1px solid' : '',
    borderColor: have ? 'success.dark' : ''
  }}>
    <CardContent sx={{ '&:last-child': { padding: 1.5 }, height: '100%' }}>
      <Stack direction={'row'} gap={1.5}>
        <img width={42} height={42} style={{ objectFit: 'contain' }} src={monsterImage(name)} alt={name}/>
        <Stack gap={1} sx={{ minWidth: 0 }}>
          <Typography variant={'body1'}>{cleanUnderscore(name)}{plus ? '+' : ''}</Typography>
          {effect && <Typography variant={'body2'} color={'text.secondary'}>
            {cleanUnderscore(effect.replace(/{/g, '+'))}
          </Typography>}
          <Price listPrice={offer.listPrice} price={offer.price}/>
          {needsBasePet && <Typography variant={'body2'} color={'text.secondary'}>Needs the base pet</Typography>}
        </Stack>
      </Stack>
    </CardContent>
  </Card>;
};

const Counter = ({ title, offers, companions, plus }) => <Stack gap={1}>
  <Typography variant={'subtitle2'} color={'text.secondary'}>{title}</Typography>
  {offers?.length
    ? <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {offers.map((offer) => <OfferCard
        key={`${plus ? 'plus' : 'base'}-${offer.companionIndex}`}
        offer={offer}
        companion={companions?.[offer.companionIndex]}
        plus={plus}
      />)}
    </Stack>
    : <Typography variant={'body2'} color={'text.secondary'}>Nothing on offer today</Typography>}
</Stack>;

// Rows shown before "Show older days".
const RECENT_DAYS = 14;

const PastOffer = ({ offer, companions, plus }) => {
  const name = companions?.[offer.index]?.name;
  if (!name) return null;
  return <Stack direction={'row'} gap={0.75} alignItems={'center'}>
    <img width={22} height={22} style={{ objectFit: 'contain' }} src={monsterImage(name)} alt={name}/>
    <Typography variant={'body2'}>{cleanUnderscore(name)}{plus ? '+' : ''}</Typography>
    {offer.price != null && <Price listPrice={offer.list ?? offer.price} price={offer.price}/>}
  </Stack>;
};

const PastCounter = ({ label, offers, companions, plus }) => offers?.length ? <Stack direction={'row'} gap={1.5}>
  <Typography variant={'caption'} color={'text.secondary'} sx={{ width: 44, flexShrink: 0, pt: 0.25 }}>{label}</Typography>
  <Stack direction={'row'} gap={'4px 16px'} flexWrap={'wrap'}>
    {offers.map((offer) => <PastOffer key={offer.index} offer={offer} companions={companions} plus={plus}/>)}
  </Stack>
</Stack> : null;

// Every recorded rotation before today, newest first. The rows that came from the wiki only list
// the + counter's first appearances, so a divider marks where the full log begins.
const PastRotations = ({ days, companions }) => {
  const [showAll, setShowAll] = useState(false);
  if (!days.length) return null;
  const shown = showAll ? days : days.slice(0, RECENT_DAYS);
  const firstWiki = shown.findIndex((day) => day.source === 'wiki');
  const loggingSince = days.filter((day) => day.source === 'live').at(-1)?.date;

  return <Stack gap={1}>
    <Stack direction={'row'} alignItems={'baseline'} gap={2}>
      <Typography variant={'h6'}>Past Rotations</Typography>
      {loggingSince && <Typography variant={'caption'} color={'text.secondary'}>
        Logged daily since {format(parseISO(loggingSince), 'MMM d')}
      </Typography>}
    </Stack>
    {shown.map((day, i) => <React.Fragment key={`${day.source}-${day.date}-${day.shopDay}`}>
      {i === firstWiki && <Typography variant={'caption'} color={'text.secondary'} sx={{ pt: 1 }}>
        Earlier days: Pet Mart+ first appearances only
      </Typography>}
      <Divider/>
      <Stack direction={'row'} gap={2} sx={{ py: 0.5 }}>
        <Stack sx={{ width: 96, flexShrink: 0 }}>
          <Typography variant={'body2'}>{format(parseISO(day.date), 'MMM d, yyyy')}</Typography>
          {day.shopDay != null && <Typography variant={'caption'} color={'text.secondary'}>Shop day {day.shopDay}</Typography>}
        </Stack>
        <Stack gap={0.75}>
          <PastCounter label={'Mart+'} offers={day.plus} companions={companions} plus/>
          <PastCounter label={'Mart'} offers={day.base} companions={companions}/>
        </Stack>
      </Stack>
    </React.Fragment>)}
    {days.length > RECENT_DAYS && <Button size={'small'} sx={{ alignSelf: 'flex-start' }} onClick={() => setShowAll(!showAll)}>
      {showAll ? 'Show fewer days' : `Show ${days.length - RECENT_DAYS} older days`}
    </Button>}
  </Stack>;
};

const PetMart = ({ petMart, companions }) => {
  const { data: historyData } = usePetMartHistory();
  if (!petMart) return <MissingData name={'Pet Mart'}/>;
  const { shopDay, gems, offers = [], plusOffers = [] } = petMart;

  return <Stack gap={3}>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'New pets in'} value={<Timer
        type={'countdown'} date={getNextPetMartRestock()}
        placeholder={'Restocked'}/>}/>
      {gems?.offered && <CardTitleAndValue title={'Daily free gems'} icon={'data/PremiumGem.png'}
        imgStyle={{ width: 24, height: 24 }}
        value={gems.claimable ? `${numberWithCommas(gems.amount)} to claim` : 'Claimed'}/>}
    </Stack>
    <Stack direction={'row'} alignItems={'baseline'} gap={2}>
      <Typography variant={'h6'}>Current Rotation</Typography>
      <Typography variant={'caption'} color={'text.secondary'}>Shop day {shopDay}</Typography>
    </Stack>
    <Counter title={'Pet Mart+ (upgrades)'} offers={plusOffers} companions={companions} plus/>
    <Counter title={'Pet Mart (pets)'} offers={offers} companions={companions}/>
    {historyData && <PastRotations days={pastDays(historyData.days, petMart)} companions={companions}/>}
  </Stack>;
};

// Everything but the rotation on screen above.
const pastDays = (days, petMart) => mergePetMartHistory(days, petMart, Date.now())
  .filter((day) => day.shopDay == null || day.shopDay !== petMart?.shopDay);

export default PetMart;
