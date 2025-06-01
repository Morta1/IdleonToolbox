import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const Upgrades = ({ upgrades }) => {
  return (
    (<Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {upgrades?.map(({ rawName, level, name, description, modifier }, index) => {
        const bonus = description?.includes('{')
          ? level * modifier
          : notateNumber(1 + level * modifier / 100, 'MultiplierInfo')
        return name !== 'Name' ? <Card key={'upgrade-' + index} sx={{ width: 320 }}>
          <CardContent>
            <Stack direction={'row'} gap={1}>
              <img width={32} src={`${prefix}data/NjUpgI${index + 1}.png`} alt={''}/>
              <Typography>{cleanUnderscore(name)} (Lv. {level})</Typography>
            </Stack>
            <Typography>{cleanUnderscore(description.replace(/}|{/g, bonus))}</Typography>
          </CardContent>
        </Card> : null;
      })}
    </Stack>)
  );
};

export default Upgrades;
