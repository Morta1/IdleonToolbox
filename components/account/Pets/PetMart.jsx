import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getNextPetMartRestock, numberWithCommas, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import Timer from '@components/common/Timer';

// The tournament's Pet Mart: two counters that each restock daily with five pets. The base counter
// sells the pet itself, the + counter sells the Pet Mart+ upgrade of a pet you already own. Both
// price in Pet Crystals, and a day's discount shows as a struck list price beside the real one.
// The full + price list lives in the Pets tab's Pet Mart+ view, so this tab is only today's stock.
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

const PetMart = ({ petMart, companions }) => {
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
      <Typography variant={'h6'} color={'success.light'}>Current Rotation</Typography>
      <Typography variant={'caption'} color={'text.secondary'}>Shop day {shopDay}</Typography>
    </Stack>
    <Counter title={'Pet Mart+ (upgrades)'} offers={plusOffers} companions={companions} plus/>
    <Counter title={'Pet Mart (pets)'} offers={offers} companions={companions}/>
  </Stack>;
};

export default PetMart;
