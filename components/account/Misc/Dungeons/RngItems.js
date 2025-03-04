import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../../../utility/helpers';
import Tooltip from '@components/Tooltip';
import React from 'react';

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
    {rngItems?.map((item, index) => {
      const { name, increment, rarity, level, baseValue, maxLevel } = item;
      const realBonus = baseValue + (increment * level);
      const baseCost = 1 + .7 * Math.pow(level, 1.5 + .05 * level)
      const costMulti = rarity.indexOf(rarity);
      const cost = Math.floor(baseCost * (1 + (costMulti + 1) * Math.pow(4, (costMulti + 2.348) / 2.348)))
      return <Tooltip key={name} title={<AdditionalInfo {...item} cost={cost} realBonus={realBonus}/>}>
        <Card
          sx={{
            width: 120,
            border: `1px solid ${rarityColors?.[rarity]}`,
            opacity: level === -1 ? .5 : 1
          }}>
          <CardContent>
            <img src={`${prefix}data/DungItems${index}.png`} alt={''}/>
            <Typography color={level >= maxLevel ? 'success.light' : ''} mt={1}>Lv. {level > 0
              ? level
              : 0} / {maxLevel}</Typography>
          </CardContent>
        </Card>
      </Tooltip>
    })}
  </Stack>
};

const AdditionalInfo = ({ name, level, desc, realBonus, cost, maxLevel }) => {
  return <>
    <Typography fontSize={18} variant={'subtitle2'}>{cleanUnderscore(name)}</Typography>
    <Typography>{cleanUnderscore(desc.replace('{', notateNumber(realBonus, 'MultiplierInfo')))}</Typography>
    {level >= 0 && level < maxLevel
      ? <Typography mt={2}>Next lvl cost: {cost}</Typography>
      : null}
  </>
}

export default RngItems;
