import { Stack } from '@mui/material';
import { skillingTiles } from '@components/account/Worlds/World5/Hole/commons';

const TheBottomlessTrench = ({ hole }) => {
  const trench = hole?.caverns?.theBottomlessTrench;
  return <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
    {skillingTiles({
      hole, cavernIndex: 16, effLabel: 'Fishing efficiency needed', eff: trench?.fishingEff, layerLabel: 'Depth',
      layer: trench?.layer, resource: 'Fish', icon: 'data/MotherlodeFISH_x1.png', done: trench?.fish?.caught,
      required: trench?.fish?.required
    })}
  </Stack>;
};

export default TheBottomlessTrench;
