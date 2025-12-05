import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, growth, notateNumber, prefix } from '@utility/helpers';

const GuildBonuses = ({ bonuses }) => {
  const getCostToMax = ({ maxLevel, level, gpBaseCost, gpIncrease }) => {
    let total = 0;
    for (let i = level; i < maxLevel; i++) {
      total += gpBaseCost + i * gpIncrease;
    }
    return total;
  }

  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {bonuses?.map((bonusObject, index) => {
      const { name, level, gpIncrease, maxLevel, bonus, func, x1, x2, gpBaseCost } = bonusObject;
      const costToMax = getCostToMax(bonusObject);
      return <Card key={name + index} sx={{ width: 300 }}>
        <CardContent>
          <Stack gap={2}>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img src={`${prefix}data/Gbonus${index}.png`} alt={''}/>
              <Typography>{cleanUnderscore(name)}</Typography>
            </Stack>
            <Stack gap={1}>
              <Typography>level: {level} / {maxLevel}</Typography>
              <Typography>Cost: {notateNumber(gpBaseCost + level * gpIncrease)}</Typography>
              <Typography>Cost To Max: {notateNumber(costToMax)}</Typography>
              <Typography
                sx={{ fontSize: 16 }}>{cleanUnderscore(bonus.replace('{', growth(func, level, x1, x2)))}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    })}
  </Stack>
};

export default GuildBonuses;
