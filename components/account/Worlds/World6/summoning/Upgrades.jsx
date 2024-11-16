import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const COLOR_MAP = {
  0: 'White',
  1: 'Green',
  2: 'Yellow',
  3: 'Blue',
  4: 'Purple',
  5: 'Red',
  6: 'Cyan'
}
const Upgrades = ({ upgrades }) => {
  return <Stack>
    {Object.entries(upgrades || {})?.map(([colorIndex, colorUpgrades]) => {
      return COLOR_MAP[colorIndex] ? <Stack key={'color-upgrade-' + colorIndex}>
        <Typography variant={'h5'}>{COLOR_MAP[colorIndex]}</Typography>
        <Stack direction={'row'} flexWrap={'wrap'} gap={1} my={1}>
          {colorUpgrades.map(({ level, value, maxLvl, name, bonus, totalBonus, bonusQty, totalCost, originalIndex }, index) => {
            const unlocked = (level > 0) || (colorIndex === '0' && originalIndex === 2);
            return <Card key={'upgrade-' + index} sx={{ width: 220, opacity: unlocked ? 1 : .5 }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Stack direction={'row'} gap={1}>
                  <img width={42} height={42} src={`${prefix}data/SumUpgIc${originalIndex}.png`} alt={''}/>
                  <Stack>
                    <Typography>{cleanUnderscore(name)}</Typography>
                    <Typography variant={'caption'}>Lv. {level} / {maxLvl}</Typography>
                  </Stack>
                </Stack>
                <Typography>{cleanUnderscore(bonus.replace('{', value).replace('}', totalBonus))}</Typography>
                <Typography mt={'auto'} variant={'caption'}>Cost: {totalCost ? notateNumber(totalCost) : 0}</Typography>
                {originalIndex}
              </CardContent>
            </Card>
          })}
        </Stack>
      </Stack> : null
    })}
  </Stack>
};

export default Upgrades;
