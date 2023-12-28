import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../../../utility/helpers';

const rarityColors = {
  Common: '#ffffff',
  Uncommon: '#378b37',
  Rare: '#2c2cae',
  Epic: '#7b3f7b',
  Legendary: '#e68533'
}

const rarity = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

const RngItems = ({ rngItems }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {rngItems?.map(({ name, bonus, increment, rarity, level, desc, levelText, baseValue, maxLevel }, index) => {
      const realBonus = baseValue + (increment * level);
      const baseCost = 1 + .7 * Math.pow(level, 1.5 + .05 * level)
      const costMulti = rarity.indexOf(rarity);
      const cost = Math.floor(baseCost * (1 + (costMulti + 1) * Math.pow(4, (costMulti + 2.348) / 2.348)))
      return <Card key={name} sx={{ width: 300, border: `1px solid ${rarityColors?.[rarity]}`, opacity: level === -1 ? .5 : 1 }}>
        <CardContent>
          <img src={`${prefix}data/DungItems${index}.png`} alt={''}/>
          <Typography>{cleanUnderscore(name)}</Typography>
          <Typography>{cleanUnderscore(desc.replace('{', notateNumber(realBonus, 'MultiplierInfo')))}</Typography>
          {<Typography mt={2}>Lv. {level > 0 ? level : 0} / {maxLevel}</Typography>}
          {level >0 && level < maxLevel ? <Typography mt={2}>Next lvl cost: {cost}</Typography> : null}
        </CardContent>
      </Card>
    })}
  </Stack>
};

export default RngItems;
