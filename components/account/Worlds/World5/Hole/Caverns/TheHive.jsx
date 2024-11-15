import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';

const TheHive = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Catching eff req'} value={hole?.caverns?.theHive?.fishingEff}/>
      <CardTitleAndValue title={'Layer'} value={hole?.caverns?.theHive?.layer}/>
      <CardTitleAndValue title={'Bugs'} icon={'data/Bug14_x1.png'}
                         imgStyle={{ width: 24, height: 24 }}
                         value={`${hole?.caverns?.theHive?.bugs?.mined} / ${hole?.caverns?.theHive?.bugs?.required}`}/>
    </Stack>
  </>
};

export default TheHive;
