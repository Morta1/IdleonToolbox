import { Card, CardContent, Divider, Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { commaNotation, msToDate, notateNumber, prefix } from '@utility/helpers';

const TheWell = ({ hole }) => {
  const fillRate = hole?.caverns?.theWell?.fillRate < 1e9 ?
    commaNotation(hole?.caverns?.theWell?.fillRate)
    : notateNumber(hole?.caverns?.theWell?.fillRate, 'Big')

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Opal cost'} icon={'data/HoleWellFill1.png'}
                         imgStyle={{ width: 24, height: 24, objectFit: 'none' }}
                         value={hole?.caverns?.theWell?.opalCost}/>
      <CardTitleAndValue title={'Fill rate'} value={`${fillRate} / hr`}
                         icon={'data/HoleWellBucket0.png'} imgStyle={{ width: 24, height: 24, objectFit: 'cover' }}/>
      {hole?.caverns?.theWell?.buckets?.map((sediment, index) => <Card key={`bucket-${index}`}>
        <CardContent>
          <Bucket sediment={sediment === hole?.caverns?.theWell?.rockLayerIndex ? 0 : sediment + 1}/>
        </CardContent>
      </Card>)}
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theWell?.sediments?.map(({ current = 0, max = 0 } = {}, index) => {
        const isRockLayer = index === 0;
        const rocks = notateNumber(current * -1, 'TinyE') + ''
        const maxReq = isNaN(max) ? '' : `/${notateNumber(max, 'TinyE')}`;
        const timeToFull = (max - current) / (hole?.caverns?.theWell?.fillRate * hole?.caverns?.theWell?.buckets?.length) * 1000 * 3600;
        return <CardTitleAndValue key={`sediment-${index}`}
                                  cardSx={{ my: 0, width: 270, opacity: !max && !isRockLayer ? .5 : 1 }}
                                  title={isRockLayer ? 'Rocks' : !isRockLayer && max
                                    ? `Time to full: ${msToDate(timeToFull)}`
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
