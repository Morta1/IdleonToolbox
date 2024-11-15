import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';

const Motherlode = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Mining eff req'} value={hole?.caverns?.motherlode?.miningEff}/>
      <CardTitleAndValue title={'Layer'} value={hole?.caverns?.motherlode?.layer}/>
      <CardTitleAndValue title={'Ores'} icon={'data/Motherlode_x1.png'}
                         imgStyle={{ width: 24, height: 24, objectFit: 'none' }}
                         value={`${hole?.caverns?.motherlode?.ores?.mined} / ${hole?.caverns?.motherlode?.ores?.required}`}/>
    </Stack>
  </>
};

export default Motherlode;
