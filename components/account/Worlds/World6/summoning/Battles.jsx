import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import React, { useState } from 'react';
import { CardTitleAndValue } from '@components/common/styles';

const COLOR_MAP = {
  0: 'White',
  1: 'Green',
  2: 'Yellow',
  3: 'Blue',
  4: 'Purple',
  5: 'Red',
  6: 'Cyan'
}

const Battles = ({ battles, armyHealth, armyDamage }) => {
  const [hide, setHide] = useState(true);

  return <>
    <Stack direction={'row'} gap={2}>
      <CardTitleAndValue value={armyDamage < 1e7 ? commaNotation(armyDamage) : notateNumber(armyDamage)}
                         icon={'data/SumUpgIc3.png'} imgStyle={{ width: 25 }}/>
      <CardTitleAndValue value={armyHealth < 1e7 ? commaNotation(armyHealth) : notateNumber(armyHealth)}
                         icon={'data/SumUpgIc1.png'} imgStyle={{ width: 25 }}/>
      <FormControlLabel
        sx={{ width: 'fit-content' }}
        control={<Checkbox checked={hide} onChange={() => setHide(prev => !prev)}/>}
        label="Hide battles won"
      />
    </Stack>

    <Stack gap={2}>
      {battles?.map((colorBattles, colorBattleIndex) => {
        if (colorBattles.length === 0) return null;
        const wonBattles = colorBattles.reduce((sum, { won }) => sum + (won ? 1 : 0), 0);
        const wonAll = wonBattles >= colorBattles.length;
        if (hide && wonAll) return null;
        return <Stack key={'color-battle-' + colorBattleIndex}>
          <Typography variant={'h5'}>{COLOR_MAP[colorBattleIndex]} ({wonBattles}/{colorBattles?.length})</Typography>
          <Stack direction={'row'} flexWrap={'wrap'} gap={1} my={1}>
            {colorBattles.map(({
                                 enemyId,
                                 xOff,
                                 yOff,
                                 width,
                                 territoryName,
                                 bonusQty,
                                 difficulty,
                                 won,
                                 icon,
                                 bonus,
                                 bonusId
                               }, index) => {
              if (hide && won) return null;
              return <Card key={'upgrade-' + index} sx={{ width: 220, opacity: won ? .5 : 1 }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <img width={42} height={42} src={`${prefix}${icon}.png`} alt={''}/>
                  <Stack direction={'row'} gap={1}>
                    <Stack>
                      <Typography variant={'body1'}>{cleanUnderscore(territoryName)}</Typography>
                      <Typography mt={1} variant={'body2'}>{bonus?.bonus}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            })}
          </Stack>
        </Stack>
      })}
    </Stack>
  </>
};

export default Battles;
