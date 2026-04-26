import { Card, CardContent, Divider, Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, fillArrayToLength, msToDate, notateNumber, prefix } from '@utility/helpers';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';

const getTTF = (sediment, theWell) => {
  const ttf = fillArrayToLength(theWell?.buckets?.length);
  // bucketRates[0..N-1] is the per-bucket rate (golden bucket faster than normal). When N buckets are
  // working on a sediment, the cumulative rate is the sum of the first N bucketRates entries.
  const rates = theWell?.bucketRates ?? [];
  return ttf.map((_, index) => {
    const cumulativeRate = rates.slice(0, index + 1).reduce((sum, r) => sum + r, 0)
      || theWell?.fillRate * (index + 1);
    return (sediment?.max - sediment?.current) / cumulativeRate * 1000 * 3600;
  });
}

const formatRate = (r) => r < 1e9 ? commaNotation(r) : notateNumber(r, 'Big');

const TheWell = ({ hole }) => {
  const bucketRates = hole?.caverns?.theWell?.bucketRates ?? [];
  const goldenBucketsOwned = hole?.caverns?.theWell?.goldenBucketsOwned ?? 0;

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Opal cost'} icon={'data/HoleWellFill1.png'}
                         imgStyle={{ width: 24, height: 24, objectFit: 'none' }}
                         value={hole?.caverns?.theWell?.opalCost}/>
      {hole?.caverns?.theWell?.buckets?.map((sediment, index) => {
        const isGolden = index < goldenBucketsOwned;
        return <Card key={`bucket-${index}`}
                     sx={isGolden ? { filter: 'drop-shadow(0 0 4px rgba(255,200,0,0.9))' } : undefined}>
          <CardContent sx={{ textAlign: 'center', p: 1, '&:last-child': { pb: 1 } }}>
            <Bucket sediment={sediment === hole?.caverns?.theWell?.rockLayerIndex ? 0 : sediment + 1}/>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {formatRate(bucketRates[index] ?? 0)} / hr
            </div>
          </CardContent>
        </Card>;
      })}
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theWell?.sediments?.map((sediment, index) => {
        const { current = 0, max = 0 } = sediment || {};
        const isRockLayer = index === 0;
        const rocks = notateNumber(current * -1, 'TinyE') + ''
        const maxReq = isNaN(max) ? '' : `/${notateNumber(max, 'TinyE')}`;
        const ttfs = getTTF(sediment, hole?.caverns?.theWell);
        const timeToFull = (max - current) / (hole?.caverns?.theWell?.totalFillRate ?? (hole?.caverns?.theWell?.fillRate * hole?.caverns?.theWell?.buckets?.length)) * 1000 * 3600;
        return <CardTitleAndValue key={`sediment-${index}`}
                                  cardSx={{ my: 0, width: 270, opacity: !max && !isRockLayer ? .5 : 1 }}
                                  title={isRockLayer ? 'Rocks' : !isRockLayer && max
                                    ? <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                                      Time to full: {msToDate(timeToFull)}
                                      <Tooltip title={<Stack>
                                        {ttfs.map((ttf, index) => <div key={`ttf-${index}`}>{index + 1} Bucket{index > 0
                                          ? 's'
                                          : ''}: {msToDate(ttf)}</div>)}
                                      </Stack>}>
                                        <InfoIcon/>
                                      </Tooltip>
                                    </Stack>
                                    : 'Locked'}
                                  value={isRockLayer
                                    ? rocks
                                    : `${notateNumber(Math.max(0, current), 'TinyE')}${maxReq}`}
                                  icon={`data/HoleWellFill${index}.png`}
                                  imgStyle={{ width: 50, height: 50, objectFit: 'none' }}/>
      })}
    </Stack>
  </>
};

const Bucket = ({ sediment }) => {
  return <div>
    <img src={`${prefix}data/HoleWellFill${sediment}.png`}
         style={{ width: 50, height: 50, objectFit: 'none', position: 'absolute' }} alt={'sediment-top'}/>
    <img src={`${prefix}data/HoleWellBucket0.png`} style={{ width: 50, height: 50, objectFit: 'none' }} alt={'bucket'}/>
  </div>
}

export default TheWell;
