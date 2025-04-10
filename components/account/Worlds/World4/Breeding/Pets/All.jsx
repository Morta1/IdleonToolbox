import React, { useContext } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { GeneIcon, MonsterIcon } from '@components/account/Worlds/World4/Breeding/Pets/styles';
import Tooltip from '@components/Tooltip';
import { AppContext } from '@components/common/context/AppProvider';

const All = ({ pets }) => {
  const { state } = useContext(AppContext);

  return <>
    <Stack gap={1}>
      {pets?.map((list, worldIndex) => {
        return <React.Fragment key={`world-${worldIndex}`}>
          <Stack direction={'row'} alignItems={'center'} gap={2}>
            <Typography variant={'h4'}>World {worldIndex + 1}</Typography>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <img style={{ width: 32, height: 32 }} src={`${prefix}data/Genetic${worldIndex}.png`}
                   alt={'cells' + worldIndex}/>
              <Typography
                variant={'body2'}>{notateNumber(state?.account?.breeding?.genetics?.[worldIndex])}</Typography>
            </Stack>
          </Stack>
          <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
            {list?.map(({
                          monsterName,
                          monsterRawName,
                          icon,
                          gene,
                          unlocked,
                          level
                        }) => {
              const missingIcon = (icon === 'Mface23' || icon === 'Mface21' || icon === 'Mface31') && monsterRawName !== 'shovelR';
              return <Card key={`${monsterName}-${worldIndex}`} variant="outlined"
                           sx={{ opacity: unlocked ? 1 : .6 }}>
                <CardContent>
                  <Stack direction={'row'} alignItems={'center'} gap={1} justifyContent={'space-between'}>
                    <Stack justifyContent={'center'} alignItems={'center'}>
                      <MonsterIcon
                        src={missingIcon ? `${prefix}afk_targets/${monsterName}.png` : `${prefix}data/${icon}.png`}
                        missingIcon={missingIcon}
                        alt=""/>
                      <Typography variant={'body2'}>Lv. {level}</Typography>
                    </Stack>
                    <Tooltip title={<GeneTooltip gene={gene}/>}>
                      <GeneIcon src={`${prefix}data/GeneReady${gene?.index}.png`} alt=""/>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            })}
          </Stack>
        </React.Fragment>
      })}
    </Stack>
  </>
};

const GeneTooltip = ({ gene }) => {
  return <>
    <Stack sx={{ mt: 2 }}>
      <Typography variant={'caption'} sx={{ color: 'error.light' }}>Combat Ability:</Typography>
      <Typography>{cleanUnderscore(gene?.combatAbility)}</Typography>
    </Stack>
    <Stack sx={{ mt: 1 }}>
      <Typography variant={'caption'} sx={{ color: 'success.light' }}>Bonus Ability:</Typography>
      <Typography>{cleanUnderscore(gene?.bonusAbility)}</Typography>
    </Stack>
  </>

}

export default All;