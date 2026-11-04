import { Stack, Typography } from '@mui/material';
import { formatDuration } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

// The bucket and its sediment fill share one 62 x 128 canvas, so the game's picture is the fill drawn over the bucket. The
// rope above the bucket makes the art tall and thin: 56 px keeps its fill readable. The game draws a golden bucket in
// gold (HoleWellBucket1) and the others in wood (HoleWellBucket0)
const bucketIcon = (golden) => `data/HoleWellBucket${golden ? 1 : 0}.png`;

// Seconds to fill a sediment's bar with the first N buckets on it: their rates add up (a golden bucket fills faster)
const fillTimes = (sediment, theWell) => (theWell?.buckets ?? []).map((_, index) => {
  const rate = (theWell?.bucketRates ?? []).slice(0, index + 1).reduce((sum, value) => sum + value, 0)
    || (theWell?.fillRate ?? 0) * (index + 1);
  return rate > 0 ? ((sediment?.max ?? 0) - (sediment?.current ?? 0)) / rate * 3600 : Infinity;
});
const sedimentText = (value) => formatGame(Math.max(0, value ?? 0), 'Holes.SedimentMax');
// A sediment by its place in the parser's list: the rock layer first, then the sediments by their sprite
const sedimentName = (index) => (index === 0 ? 'Rocks' : `Sediment ${index}`);

const TheWell = ({ hole }) => {
  const theWell = hole?.caverns?.theWell;
  const rates = theWell?.bucketRates ?? [];
  const golden = theWell?.goldenBucketsOwned ?? 0;
  const buckets = theWell?.buckets ?? [];

  // Decision 5 (b): a bucket keeps the game's picture, its fill over the bucket, with its name and sediment beside it
  const bucketCard = (sediment, index) => {
    const fill = sediment === theWell?.rockLayerIndex ? 0 : sediment + 1;
    const isGolden = index < golden;
    return <ItemCard key={`bucket-${index}`}
                     icon={<GameIcon src={`data/HoleWellFill${fill}.png`} frame={bucketIcon(isGolden)} size={56} alt={''}/>}
                     title={`${isGolden ? 'Golden bucket' : 'Bucket'} ${index + 1}`} meta={sedimentName(fill)}>
      <ItemCard.Facts rows={[['Fill rate', `${formatGame(rates[index] ?? 0, 'Holes.BucketFillRate')}/hr`]]}/>
    </ItemCard>;
  };

  const sedimentCard = (sediment, index) => {
    const { current = 0, max = 0 } = sediment ?? {};
    const isRocks = index === 0;
    const locked = !isRocks && !max;
    const totalRate = theWell?.totalFillRate ?? (theWell?.fillRate ?? 0) * buckets.length;
    const fullIn = totalRate > 0 ? (max - current) / totalRate * 3600 : Infinity;
    // Info 5: the time with each count of buckets, a list inside a hover note before
    const byBuckets = createBreakdown(`${sedimentName(index)} full in`, formatDuration(fullIn), flatLines(fillTimes(sediment, theWell)
      .map((seconds, count) => ({
        name: `${count + 1} ${count ? 'buckets' : 'bucket'}`, value: Number.isFinite(seconds) ? seconds : 0,
        formatted: Number.isFinite(seconds) ? formatDuration(seconds) : '-'
      }))), { combine: 'list' });
    return <ItemCard key={`sediment-${index}`} icon={`data/HoleWellFill${index}.png`} title={sedimentName(index)}
                     status={locked ? 'locked' : undefined}>
      {isRocks ? <ItemCard.Facts rows={[['Left', formatGame(Math.abs(current), 'Holes.SedimentMax')]]}/> : null}
      {!isRocks && !locked ? <>
        <ItemCard.Progress label={'Filled'} value={sedimentText(current)} max={sedimentText(max)}
                           percent={max > 0 ? Math.min(100, (current / max) * 100) : 0}/>
        {/* No rate (no bucket on it yet): nothing to time */}
        <ItemCard.Facts rows={[['Full in', Number.isFinite(fullIn)
          ? <Breakdown key={'full'} asValue data={byBuckets}>{formatDuration(fullIn)}</Breakdown> : '-']]}/>
      </> : null}
    </ItemCard>;
  };

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Opal cost'} icon={'data/HoleWellFill1.png'} value={theWell?.opalCost ?? 0}/>
      {opalsFoundTile(hole, 0)}
      <StatTile label={'Total bar expansions'} value={getHoleLeaderboardTotals(hole).barExpansions} kind={'amount'}/>
    </Stack>
    <Stack gap={3}>
      {buckets.length ? <Stack gap={1}>
        <Typography variant={'sectionTitle'} component={'h2'}>Buckets</Typography>
        <CardGrid size={'s'}>{buckets.map(bucketCard)}</CardGrid>
      </Stack> : null}
      {theWell?.sediments?.length ? <Stack gap={1}>
        <Typography variant={'sectionTitle'} component={'h2'}>Sediments</Typography>
        <CardGrid size={'s'}>{theWell.sediments.map(sedimentCard)}</CardGrid>
      </Stack> : null}
    </Stack>
  </>;
};

export default TheWell;
