import { Card, CardContent, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import React, { useState } from 'react';
import { CardTitleAndValue } from '@components/common/styles';
import { getEndlessBattles } from '@parsers/world-6/summoning';

const COLOR_MAP = {
  0: 'White',
  1: 'Green',
  2: 'Yellow',
  3: 'Blue',
  4: 'Purple',
  5: 'Red',
  6: 'Cyan',
  9: 'Endless'
}

const Battles = ({ battles, armyHealth, armyDamage, highestEndlessLevel, winnerBonuses }) => {
  const [hide, setHide] = useState(true);
  battles[9] = getEndlessBattles(200, highestEndlessLevel, winnerBonuses);
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
                  <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                    <img width={42} height={42} src={`${prefix}${icon}.png`} alt={''}/>
                    {colorBattleIndex === 9 ? <Typography variant={'caption'}>{index + 1}</Typography> : null}
                  </Stack>
                  <Divider sx={{ my: 2 }}></Divider>
                  <Stack direction={'row'} gap={1}>
                  <Stack>
                      <Typography variant={'body1'}>{cleanUnderscore(territoryName)}</Typography>
                      <Typography mt={1} variant={'body2'}>{bonus?.bonus}</Typography>
                      {difficulty?.name ? <>
                        <Divider sx={{ my: 2 }}></Divider>
                        <Typography variant={'subtitle1'}>{cleanUnderscore(difficulty?.name)}</Typography>
                        <Typography variant={'body2'}>{cleanUnderscore(difficulty?.sentence)}</Typography>
                      </> : null}
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
