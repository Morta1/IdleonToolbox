import { Stack } from '@mui/material';
import { skillingTiles } from '@components/account/Worlds/World5/Hole/commons';

const Evertree = ({ hole }) => {
  const evertree = hole?.caverns?.evertree;
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
    {skillingTiles({
      hole, cavernIndex: 11, effLabel: 'Chopping efficiency needed', eff: evertree?.choppingEff, layer: evertree?.layer,
      resource: 'Logs', icon: 'data/MotherlodeTREE_x1.png', done: evertree?.logs?.chopped, required: evertree?.logs?.required
    })}
  </Stack>;
};

export default Evertree;
