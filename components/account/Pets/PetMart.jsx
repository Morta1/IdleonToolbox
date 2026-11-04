import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { cleanUnderscore, formatNum, getNextPetMartRestock } from '@utility/helpers';
import { monsterSprite } from '@utility/spriteImages';
import Timer from '@components/common/Timer';
import { usePetMartHistory } from '@hooks/usePetMartHistory';
import useFormatDate from '@hooks/useFormatDate';
import { getPetMartRotationDate, getPetMartToday, mergePetMartHistory } from '@utility/petMartHistory';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import { effectText, petCrystalIcon } from '@components/account/Pets/PetCollection';

// The tournament's Pet Mart: two counters that each restock daily with five pets. The base counter
// sells the pet itself, the + counter sells the Pet Mart+ upgrade of a pet you already own. Both
// price in Pet Crystals, and a day's discount shows as a struck list price beside the real one.
// The full + price list lives in the Pets tab's Pet Mart+ view; this tab is today's stock and the
// log of past rotations.

// Rows shown before "Show older days".
const RECENT_DAYS = 14;

const priceLine = ({ list, price }, size = 16) => {
  const discounted = list > price;
  return <Stack direction={'row'} gap={0.5} alignItems={'center'} component={'span'}>
    {petCrystalIcon(size)}
    {discounted ? <Typography variant={'body2'} component={'span'} color={'text.secondary'} sx={{ textDecoration: 'line-through' }}>
      {formatNum(list)}
    </Typography> : null}
    <Typography variant={'body2'} component={'span'} color={discounted ? 'text.success' : 'text.primary'}>{formatNum(price ?? 0)}</Typography>
  </Stack>;
};

// The clock, read once per render after the data loader (the export is the loader): today's rotation, everything
// before it, and the first day the log has (today included, so the date shows from the first logged day on)
const readRotations = (data, petMart, lastUpdated) => {
  const now = Date.now();
  const history = data ? mergePetMartHistory(data.days, petMart, now) : [];
  const todayDate = getPetMartRotationDate(now);
  return {
    today: getPetMartToday(data?.days, petMart, lastUpdated, now),
    pastDays: history.filter((day) => day.date !== todayDate),
    loggingSince: history.at(-1)?.date
  };
};

const PetMart = ({ petMart, companions, lastUpdated, sectionFailed, companionsFailed, guest }) => {
  const { data, isPending, isError, refetch } = usePetMartHistory();
  const formatDate = useFormatDate();
  const [showAll, setShowAll] = useState(false);
  const savePetMart = sectionFailed ? null : petMart;
  const { today, pastDays, loggingSince } = readRotations(data, savePetMart, lastUpdated);
  const saveIsToday = today?.source === 'save';
  const waiting = !today && isPending;
  const gems = savePetMart?.gems;
  const shownDays = showAll ? pastDays : pastDays.slice(0, RECENT_DAYS);

  const offerCard = (offer, plus) => {
    const companion = companions?.[offer.index];
    const name = companion?.name ?? offer.name;
    const owned = !companionsFailed && Boolean(companion?.acquired) && !companion?.viaToken && !companion?.simulated;
    // "You already have what this card sells": the pet on the base counter, the upgrade on the + counter
    const have = !companionsFailed && (plus ? Boolean(companion?.upgraded) : owned);
    const effect = plus ? companion?.upgradedEffect : companion?.effect;
    // The + counter only upgrades a pet you own a real copy of: a token or a simulation is not one.
    const needsBasePet = !companionsFailed && plus && !have && !(companion?.copies > 0);
    return <ItemCard key={`${plus ? 'plus' : 'base'}-${offer.index}`} icon={name ? monsterSprite(name) : undefined}
                     title={`${cleanUnderscore(name)}${plus ? '+' : ''}`}
                     status={have ? 'done' : undefined} statusLabel={plus ? 'Upgraded' : 'Owned'}
                     footer={priceLine(offer)}>
      {effect ? <ItemCard.Desc text={effectText(effect)}/> : null}
      {needsBasePet ? <ItemCard.Facts rows={[['Needs', 'the base pet']]}/> : null}
    </ItemCard>;
  };

  const counter = (title, offers, plus) => <Stack gap={1}>
    <Typography variant={'groupLabel'} component={'h3'}>{title}</Typography>
    {offers?.length
      ? <CardGrid size={'s'}>{offers.map((offer) => offerCard(offer, plus))}</CardGrid>
      : <Typography variant={'body2'} color={'text.secondary'}>No offers today.</Typography>}
  </Stack>;

  const todayMissing = isError
    ? guest ? null : `Today's rotation isn't known: your save is from ${formatDate(lastUpdated, { showSeconds: false })}.`
    : "Today's rotation isn't logged yet: it shows here within the hour.";

  const pastCounter = (label, offers, plus) => (offers?.length ? <Stack direction={'row'} gap={1} alignItems={'baseline'}>
    <Typography variant={'body2'} color={'text.secondary'} sx={{ flexShrink: 0 }}>{label}</Typography>
    <Stack direction={'row'} columnGap={2} rowGap={0.5} flexWrap={'wrap'} sx={{ minWidth: 0 }}>
      {offers.map((offer) => {
        const name = companions?.[offer.index]?.name;
        if (!name) return null;
        // A name stays on one line; on a narrow row its price moves under it
        return <Stack key={offer.index} direction={'row'} columnGap={0.5} alignItems={'center'} flexWrap={'wrap'}>
          <GameIcon src={monsterSprite(name)} size={16} alt={''}/>
          <Typography variant={'body2'} color={'text.primary'} sx={{ whiteSpace: 'nowrap' }}>{cleanUnderscore(name)}{plus ? '+' : ''}</Typography>
          {offer.price != null ? priceLine({ list: offer.list ?? offer.price, price: offer.price }) : null}
        </Stack>;
      })}
    </Stack>
  </Stack> : null);

  return <Stack gap={3}>
    {isError ? <Notice tone={'error'} action={{ label: 'Retry', onClick: () => refetch() }}>
      Couldn&apos;t load the Pet Mart history.
    </Notice> : null}
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <StatTile label={'New pets in'} value={<Timer type={'countdown'} date={getNextPetMartRestock()} component={'span'}
                                                     placeholder={<StatusText status={'ready'}>Restocked</StatusText>}/>}/>
      {saveIsToday && gems?.offered ? <StatTile label={'Daily free gems'} icon={'data/PremiumGem.png'}
                                                value={gems.claimable ? `${formatNum(gems.amount)} to claim` : 'Claimed'}/> : null}
    </Stack>
    {/* No heading over nothing: a guest whose history failed has only the note above */}
    {today || waiting || todayMissing ? <Stack gap={2}>
      <Stack direction={'row'} alignItems={'baseline'} columnGap={2} flexWrap={'wrap'}>
        <Typography variant={'sectionTitle'} component={'h2'}>Today&apos;s rotation</Typography>
        {today?.shopDay != null ? <Typography variant={'caption'} color={'text.secondary'}>Shop day {today.shopDay}</Typography> : null}
      </Stack>
      {today ? <>
          {counter('Pet Mart+ upgrades', today.plus, true)}
          {counter('Pet Mart pets', today.base, false)}
        </>
        : waiting ? <Typography variant={'body2'} color={'text.secondary'}>Loading today&apos;s rotation</Typography>
          : <Typography variant={'body2'} color={'text.secondary'}>{todayMissing}</Typography>}
    </Stack> : null}
    {isError ? null : <Box>
      <Panel title={'Past rotations'} meta={loggingSince ? `Logged daily since ${format(parseISO(loggingSince), 'MMM d')}` : undefined}>
        {isPending ? <Panel.Row name={<Typography variant={'body2'} component={'span'} color={'text.secondary'}>Loading past rotations</Typography>}/>
          : !pastDays.length
            ? <Panel.Row name={<Typography variant={'body2'} component={'span'} color={'text.secondary'}>
              Past rotations show up here after the next restock.
            </Typography>}/>
            : shownDays.map((day) => <Panel.Row key={`${day.date}-${day.shopDay}`} name={format(parseISO(day.date), 'MMM d, yyyy')}
                                                sub={<Stack gap={0.5}>
                                                  {day.shopDay != null ? <Typography variant={'caption'} component={'div'} color={'text.secondary'}>Shop day {day.shopDay}</Typography> : null}
                                                  {pastCounter('Pet Mart+', day.plus, true)}
                                                  {pastCounter('Pet Mart', day.base, false)}
                                                </Stack>}/>)}
      </Panel>
      {pastDays.length > RECENT_DAYS ? <Button size={'small'} sx={{ mt: 1 }} onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Show fewer days' : `Show ${pastDays.length - RECENT_DAYS} older ${pastDays.length - RECENT_DAYS === 1 ? 'day' : 'days'}`}
      </Button> : null}
    </Box>}
  </Stack>;
};

export default PetMart;
