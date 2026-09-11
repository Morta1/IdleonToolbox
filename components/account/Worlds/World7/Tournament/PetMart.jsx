import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { CardTitleAndValue } from '@components/common/styles';

// The tournament's Pet Mart: two counters that each restock daily with five pets. The base counter
// sells the pet itself, the + counter sells the Pet Mart+ upgrade of a pet you already own. Both
// price in Pet Crystals, and a day's discount shows as a struck list price beside the real one.
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
  // the upgrade on the + counter. Same cue as the Pets page, read against the offer.
  const have = plus ? Boolean(companion?.upgraded) : owned;
  const effect = plus ? companion?.upgradedEffect : companion?.effect;

  return <Card sx={{
    width: 300,
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

// Every pet with a + price that today's counter is not selling, so the whole price list is one
// page away from the rotation, the way the Exotic Market pairs Current and Off Rotation.
const OffRotationCard = ({ companion }) => {
  const have = Boolean(companion?.upgraded);
  return <Card sx={{
    width: 110,
    border: have ? '1px solid' : '',
    borderColor: have ? 'success.dark' : ''
  }}>
    <CardContent sx={{ '&:last-child': { padding: 1 } }}>
      <Stack alignItems={'center'} gap={0.5}>
        <img width={42} height={42} style={{ objectFit: 'contain' }} src={monsterImage(companion.name)} alt={companion.name}/>
        <Typography variant={'body2'} textAlign={'center'} fontSize={11}>{cleanUnderscore(companion.name)}+</Typography>
        <Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <img width={14} height={14} style={crystalStyle} src={`${prefix}data/PremiumGem.png`} alt={'Pet Crystals'}/>
          <Typography variant={'caption'}>{numberWithCommas(companion.upgradeCost)}</Typography>
        </Stack>
      </Stack>
    </CardContent>
  </Card>;
};

const PetMart = ({ petMart, companions }) => {
  if (!petMart) return null;
  const { shopDay, petCrystals = 0, offers = [], plusOffers = [] } = petMart;
  const onRotation = new Set(plusOffers.map((offer) => offer.companionIndex));
  const offRotation = (companions ?? [])
    .map((companion, index) => ({ ...companion, index }))
    .filter((companion) => companion.name && companion.upgradeCost > 0 && !onRotation.has(companion.index))
    .sort((a, b) => (b.upgradeCost ?? 0) - (a.upgradeCost ?? 0));

  return <Stack gap={4}>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Pet Crystals'} value={numberWithCommas(petCrystals)} icon={'data/PremiumGem.png'}
                         imgStyle={{ filter: 'hue-rotate(280deg)', width: 24, height: 24 }}/>
    </Stack>
    <Stack gap={3}>
      <Stack direction={'row'} alignItems={'baseline'} gap={2}>
        <Typography variant={'h6'} color={'success.light'}>Current Rotation</Typography>
        <Typography variant={'caption'} color={'text.secondary'}>Shop day {shopDay}</Typography>
      </Stack>
      <Counter title={'Pet Mart+ (upgrades)'} offers={plusOffers} companions={companions} plus/>
      <Counter title={'Pet Mart (pets)'} offers={offers} companions={companions}/>
    </Stack>
    <Stack gap={2}>
      <Typography variant={'h6'}>Off Rotation</Typography>
      <Stack direction={'row'} gap={1.5} flexWrap={'wrap'}>
        {offRotation.map((companion) => <OffRotationCard key={companion.index} companion={companion}/>)}
      </Stack>
    </Stack>
  </Stack>;
};

export default PetMart;
