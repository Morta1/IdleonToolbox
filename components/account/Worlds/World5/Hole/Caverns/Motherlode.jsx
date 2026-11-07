import { Stack } from '@mui/material';
import { skillingTiles } from '@components/account/Worlds/World5/Hole/commons';

const Motherlode = ({ hole }) => {
  const motherlode = hole?.caverns?.motherlode;
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
    {skillingTiles({
      hole, cavernIndex: 1, effLabel: 'Mining efficiency needed', eff: motherlode?.miningEff, layer: motherlode?.layer,
      resource: 'Ores', icon: 'data/Motherlode_x1.png', done: motherlode?.ores?.mined, required: motherlode?.ores?.required
    })}
  </Stack>;
};

export default Motherlode;
