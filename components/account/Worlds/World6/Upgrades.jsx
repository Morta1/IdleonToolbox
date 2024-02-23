import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
    {upgrades?.map(({ rawName, level, name, description, modifier }, index) => {
      return name !== 'Name' ? <Card key={'upgrade-' + index} sx={{ width: 220 }}>
        <CardContent>
          <Stack direction={'row'} gap={1}>
            <img width={32} src={`${prefix}data/NjUpgI${index}.png`} alt={''}/>
            <Typography>{cleanUnderscore(name)}</Typography>
          </Stack>
          <Typography>{cleanUnderscore(description.replace(/{/g, level * modifier))}</Typography>
        </CardContent>
      </Card> : null
    })}
  </Stack>
};

export default Upgrades;
