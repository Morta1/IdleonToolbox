import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';

const TheBottomlessTrench = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Fishing eff req'} value={hole?.caverns?.theBottomlessTrench?.fishingEff}/>
      <CardTitleAndValue title={'Depth'} value={hole?.caverns?.theBottomlessTrench?.layer}/>
      <CardTitleAndValue title={'Fish'} icon={'data/MotherlodeFISH_x1.png'}
                         imgStyle={{ width: 24, height: 24, objectFit: 'contain' }}
                         value={`${hole?.caverns?.theBottomlessTrench?.fish?.caught} / ${hole?.caverns?.theBottomlessTrench?.fish?.required}`}/>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[16] || 0}/>
    </Stack>
  </>
};

export default TheBottomlessTrench;
