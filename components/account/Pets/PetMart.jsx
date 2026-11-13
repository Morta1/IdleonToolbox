import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getNextPetMartRestock, titleCaseName } from '@utility/helpers';
import { monsterSprite } from '@utility/spriteImages';
import Timer from '@components/common/Timer';
import { usePetMartHistory } from '@hooks/usePetMartHistory';
import useFormatDate from '@hooks/useFormatDate';
import { getPetMartRotationDate, getPetMartToday, mergePetMartHistory } from '@utility/petMartHistory';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import { effectText, petCrystalIcon } from '@components/account/Pets/PetCollection';
import PastRotations from '@components/account/Pets/PastRotations';
import PetPackCard from '@components/account/Pets/PetPackCard';
import { getPetMartGems } from '@parsers/world-7/tournament';

// The tournament's Pet Mart: two counters that each restock daily with five pets. The base counter
// sells the pet itself, the + counter sells the Pet Mart+ upgrade of a pet you already own. Both
// price in Pet Crystals, and a day's discount shows as a struck list price beside the real one.
// The full + price list lives in the Pets tab's Pet Mart+ view; this tab is today's stock and the
// log of past rotations.

// crystals: the save's Pet Crystals, undefined when unknown. The game marks an offer it can't sell you (crystals under the
// price it charges); like ItemCard.Cost, the price turns amber and "need X more" names the gap.
const priceLine = ({ list, price }, crystals, size = 16) => {
  const discounted = list > price;
  const short = typeof crystals === 'number' && crystals < (price ?? 0);
  return <Stack direction={'row'} columnGap={1} rowGap={0} alignItems={'center'} flexWrap={'wrap'} component={'span'}>
    <Stack direction={'row'} gap={0.5} alignItems={'center'} component={'span'}>
      {petCrystalIcon(size)}
      {discounted ? <Typography variant={'body2'} component={'span'} color={'text.secondary'} sx={{ textDecoration: 'line-through' }}>
        {formatNum(list, 'whole')}
      </Typography> : null}
      <Typography variant={'body2'} component={'span'} color={short ? 'text.warning' : discounted ? 'text.success' : 'text.primary'}>
        {formatNum(price ?? 0, 'whole')}
      </Typography>
    </Stack>
    {short ? <Typography variant={'body2'} component={'span'} color={'text.secondary'}>
      need {formatNum(price - crystals, 'whole')} more
    </Typography> : null}
  </Stack>;
};

// A counter's offers fill their rows evenly, never one card alone on the last: five to a row while a card keeps
// OFFER_MIN, then three over two, then one each. S cards' 240 px column left four and one alone on a desktop about 1,370
// to 1,630 px wide. The counter's box is the container.
const OFFER_MIN = 176;
const OFFER_GAP = 16;
const offerColumns = (count) => {
  const counts = Array.from({ length: count }, (_, step) => count - step).filter((columns) => columns === 1 || count % columns !== 1);
  const widthOf = (columns) => columns * OFFER_MIN + (columns - 1) * OFFER_GAP;
  const columnsOf = (columns) => ({ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` });
  // Widest first, so a narrower query overrides the one before it
  return {
    ...columnsOf(counts[0] ?? 1),
    ...Object.fromEntries(counts.slice(1).map((columns, step) => [`@container (max-width: ${widthOf(counts[step]) - 0.05}px)`, columnsOf(columns)]))
  };
};

// The clock, read once per render after the data loader (the export is the loader): today's rotation, everything
// before it, and the first day the log has (today included, so the date shows from the first logged day on)
const readRotations = (data, petMart, lastUpdated) => {
  const now = Date.now();
  const history = data ? mergePetMartHistory(data.days, petMart, now) : [];
  const todayDate = getPetMartRotationDate(now);
  return {
    today: getPetMartToday(data?.days, petMart, lastUpdated, now),
    todayDate,
    history,
    pastDays: history.filter((day) => day.date !== todayDate),
    loggingSince: history.at(-1)?.date
  };
};

const PetMart = ({ petMart, companions, pack, lastUpdated, sectionFailed, companionsFailed, guest }) => {
  const { data, isPending, isError, refetch } = usePetMartHistory();
  const formatDate = useFormatDate();
  const savePetMart = sectionFailed ? null : petMart;
  const { today, todayDate, history, pastDays, loggingSince } = readRotations(data, savePetMart, lastUpdated);
  const waiting = !today && isPending;
  // Worked out for today's shop day, so a save from before the restock still shows them: claimable while the save's last
  // claimed shop day is under today's
  const gems = savePetMart && today?.shopDay >= 1
    ? getPetMartGems(today.shopDay, savePetMart.gemsClaimedShopDay ?? 0, savePetMart.gemsMultiplier ?? 0)
    : null;
  const crystals = companionsFailed || guest || typeof savePetMart?.petCrystals !== 'number' ? undefined : savePetMart.petCrystals;

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
                     title={`${titleCaseName(cleanUnderscore(name))}${plus ? '+' : ''}`}
                     status={have ? 'done' : undefined} statusLabel={plus ? 'Upgraded' : 'Owned'}
                     footer={priceLine(offer, plus && have ? undefined : crystals)}>
      {effect ? <ItemCard.Desc text={effectText(effect)}/> : null}
      {needsBasePet ? <ItemCard.Facts rows={[['Needs', 'the base pet']]}/> : null}
    </ItemCard>;
  };

  const counter = (title, offers, plus) => <Stack gap={1}>
    <Typography variant={'groupLabel'} component={'h3'}>{title}</Typography>
    {offers?.length
      ? <Box sx={{ containerType: 'inline-size' }}>
        <CardGrid size={'s'} sx={offerColumns(offers.length)}>{offers.map((offer) => offerCard(offer, plus))}</CardGrid>
      </Box>
      : <Typography variant={'body2'} color={'text.secondary'}>No offers today.</Typography>}
  </Stack>;

  const todayMissing = isError
    ? guest ? null : `Today's rotation isn't known: your save is from ${formatDate(lastUpdated, { showSeconds: false })}.`
    : "Today's rotation isn't logged yet: it shows here within the hour.";

  return <Stack gap={3}>
    {isError ? <Notice tone={'error'} action={{ label: 'Retry', onClick: () => refetch() }}>
      Couldn&apos;t load the Pet Mart history.
    </Notice> : null}
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      <StatTile label={'New pets in'} value={<Timer type={'countdown'} date={getNextPetMartRestock()} component={'span'}
                                                     placeholder={<StatusText status={'ready'}>Restocked</StatusText>}/>}/>
      {/* Once claimed the game keeps the day's amount on show */}
      {gems?.offered ? <StatTile label={'Daily free gems'} icon={'data/PremiumGem.png'}
                                 value={`${formatNum(gems.amount, 'whole')} ${gems.claimable ? 'to claim' : 'claimed'}`}/> : null}
    </Stack>
    {/* No heading over nothing: a guest whose history failed has only the note above */}
    {today || waiting || todayMissing ? <Stack gap={2}>
      <Stack direction={'row'} alignItems={'baseline'} columnGap={2} flexWrap={'wrap'}>
        <Typography variant={'sectionTitle'} component={'h2'}>Today&apos;s rotation</Typography>
        {today?.shopDay != null ? <Typography variant={'caption'} color={'text.secondary'}>Shop day {today.shopDay}</Typography> : null}
      </Stack>
      {today ? <>
          {/* The game's left slot: a pet pack for real money, the first in its order whose pack and pet you don't own */}
          {pack ? <Stack gap={1}>
            <Typography variant={'groupLabel'} component={'h3'}>Pet pack</Typography>
            <CardGrid size={'s'}><PetPackCard pack={pack}/></CardGrid>
          </Stack> : null}
          {counter('Pet Mart+ upgrades', today.plus, true)}
          {counter('Pet Mart pets', today.base, false)}
        </>
        : waiting ? <Typography variant={'body2'} color={'text.secondary'}>Loading today&apos;s rotation</Typography>
          : <Typography variant={'body2'} color={'text.secondary'}>{todayMissing}</Typography>}
    </Stack> : null}
    {isError ? null : <PastRotations history={history} pastDays={pastDays} todayDate={todayDate} loggingSince={loggingSince}
                                     companions={companions} isPending={isPending}/>}
  </Stack>;
};

export default PetMart;
