import { Stack } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';

const Evertree = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Chopping eff req'} value={hole?.caverns?.evertree?.choppingEff}/>
      <CardTitleAndValue title={'Layer'} value={hole?.caverns?.evertree?.layer}/>
      <CardTitleAndValue title={'Logs'} icon={'data/MotherlodeTREE_x1.png'}
                         imgStyle={{ width: 24, height: 24, objectFit: 'contain' }}
                         value={`${hole?.caverns?.evertree?.logs?.chopped} / ${hole?.caverns?.evertree?.logs?.required}`}/>
    </Stack>
  </>
};

export default Evertree;
