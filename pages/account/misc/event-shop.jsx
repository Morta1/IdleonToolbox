import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import { getEventShopRotation } from '@parsers/misc';
import useCheckbox from '@components/common/useCheckbox';
import { format } from 'date-fns';

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
  return `Last sold: ${event ?? 'previous rotation'}${months ? ` (${months})` : ''}, ${tier}`;
};

const EventShop = () => {
  const { state } = useContext(AppContext);
  const [HideOwnedCheckbox, hideOwned] = useCheckbox('Hide owned event shop bonuses');
  const { tiers, starsToFinish, offRotation } = getEventShopRotation(state?.account);
  const total = offRotation.length + tiers.reduce((sum, tier) => sum + tier.bonuses.length, 0);
  const owned = offRotation.filter(({ owned }) => owned).length + tiers.reduce((sum, tier) => sum + tier.owned, 0);
  const shownOffRotation = offRotation.filter(({ owned }) => !(hideOwned && owned));

  const renderBonus = ({ index, name, description, price, owned, lastSold }, { locked, offRotation } = {}) => <Card
    key={`event-bonus-${index}`} sx={{ opacity: locked ? 0.6 : 1 }}>
    <CardContent sx={{
      width: 350,
      minHeight: offRotation ? 240 : 215,
      border: owned ? '1px solid' : '',
      borderColor: owned ? 'success.light' : ''
    }}>
      <Stack direction="row" alignItems={'center'} gap={2}>
        <img src={`${prefix}data/EventShopBuy${index}.png`}
             alt={'event-' + index}/>
        <Typography variant={'body1'}>{cleanUnderscore(name)}</Typography>
      </Stack>
      <Divider sx={{ my: 1 }}/>
      <Typography variant={'body1'}>{cleanUnderscore(description)}</Typography>
      <Divider sx={{ my: 1 }}/>
      <Typography variant={'body1'}>Price: {price}</Typography>
      {offRotation ? <Typography variant={'body2'} color={'text.secondary'}>{lastSoldText(lastSold)}</Typography> : null}
    </CardContent>
  </Card>;

  return <>
    <NextSeo
      title="Event Shop | Idleon Toolbox"
      description="Track your event shop purchases, star currency, and bonus progression in Legends of Idleon"
    />
    <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Stars'}
                         imgStyle={{ width: 24, height: 24 }}
                         icon={'etc/Event_Currency.png'}
                         value={numberWithCommas(state?.account?.accountOptions?.[310] ?? 0)}/>
      <CardTitleAndValue title={'Total bonuses'}
                         value={`${owned} / ${total}`}/>
      <CardTitleAndValue title={'Stars to finish rotation'}
                         value={numberWithCommas(starsToFinish)}/>
      <CardTitleAndValue>
        <HideOwnedCheckbox/>
      </CardTitleAndValue>
    </Stack>
    <Divider sx={{ mb: 2 }}/>
    <Typography variant="h6">Current Rotation</Typography>
    {tiers.map(({ name, bonuses, owned, starsLeft, lockedBy }) => {
      const shown = bonuses.filter((bonus) => !(hideOwned && bonus.owned));
      const progress = lockedBy
        ? `Locked: ${lockedBy.owned} / ${lockedBy.total} ${lockedBy.name} owned`
        : `${owned} / ${bonuses.length} owned${starsLeft ? `, ${numberWithCommas(starsLeft)} stars left` : ''}`;
      return <Stack key={name} mt={2} gap={1}>
        <Typography variant={'subtitle2'}>
          {name}{lockedBy ? `: unlocks once every ${lockedBy.name} bonus is owned` : ''}
          <Typography component={'span'} variant={'body2'} color={'text.secondary'}> · {progress}</Typography>
        </Typography>
        {shown.length
          ? <Stack direction={'row'} gap={2} flexWrap={'wrap'}>{shown.map((bonus) => renderBonus(bonus, { locked: !!lockedBy }))}</Stack>
          : <Typography variant={'body2'} color={'text.secondary'}>All owned</Typography>}
      </Stack>
    })}
    {shownOffRotation.length ? <>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Off rotation</Typography>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        {shownOffRotation.map((bonus) => renderBonus(bonus, { offRotation: true }))}
      </Stack>
    </> : null}
  </>
};

export default EventShop;
