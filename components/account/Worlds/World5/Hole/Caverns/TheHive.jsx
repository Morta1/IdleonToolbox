import { Stack } from '@mui/material';
import { skillingTiles } from '@components/account/Worlds/World5/Hole/commons';

const TheHive = ({ hole }) => {
  const theHive = hole?.caverns?.theHive;
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
    {skillingTiles({
      hole, cavernIndex: 7, effLabel: 'Catching efficiency needed', eff: theHive?.fishingEff, layer: theHive?.layer,
      resource: 'Bugs', icon: 'data/Bug14_x1.png', done: theHive?.bugs?.mined, required: theHive?.bugs?.required
    })}
  </Stack>;
};

export default TheHive;
