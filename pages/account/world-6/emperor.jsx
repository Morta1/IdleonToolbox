import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const Emperor = () => {
  const { state } = useContext(AppContext);
  const {
    bossHp,
    highestEmperorShowdown,
    bonuses,
    nextLevelBonus,
    attempts,
    maxAttempts,
    dailyAttempts
  } = state?.account?.emperor || {};

  return <>
    <Stack direction={'row'} gap={2} alignItems={'center'}>
      <CardTitleAndValue title={'Highest showdown'} value={highestEmperorShowdown || '0'}/>
      <CardTitleAndValue title={'Daily Attempts'} value={dailyAttempts} icon={'data/GemP45.png'}
                         imgStyle={{ width: 24 }}/>
      <CardTitleAndValue title={'Attempts'} value={`${attempts} / ${maxAttempts}`} icon={'data/GemP45.png'}
                         imgStyle={{ width: 24 }}/>
      <CardTitleAndValue title={'Boss HP'}>
        <Stack direction="row" gap={1} alignItems={'center'}>
          <Typography>{notateNumber(bossHp?.[0])}</Typography>
          <Tooltip title={<Stack>
            {bossHp?.map((hp, index) => {
              if (index === 0 && hp) return null;
              return <Typography
                key={'hp-' + index}>Lv: {highestEmperorShowdown + index}: {notateNumber(hp)}</Typography>
            })}
          </Stack>}>
            <IconInfoCircleFilled size={18}/>
          </Tooltip>
        </Stack>
      </CardTitleAndValue>
      {nextLevelBonus
        ? <CardTitleAndValue title={'Next level bonus'}
                             value={cleanUnderscore(nextLevelBonus.name.replace('{', commaNotation(nextLevelBonus?.value))
                               .replace('}', nextLevelBonus?.value / 100)
                               .replace('$', Math.floor((nextLevelBonus?.value + 4) / (nextLevelBonus?.value + 100) * 1000) / 10))}/>
        : null}
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {bonuses?.map(({ bonus, indexes, value, icon }, index) => {
        return <Card key={'upgrade-' + index} sx={{ width: 350 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              {icon ? <img src={`${prefix}${icon}.png`} style={{ width: 32, height: 32 }}/> : <Box
                sx={{ width: 32, height: 32, border: '1px solid grey' }}/>}
              <Typography>{cleanUnderscore(bonus)}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }}/>
            <Typography variant={'body2'}>Per level: {cleanUnderscore(value)}</Typography>
            <Divider sx={{ my: 1 }}/>
            <Typography variant={'body2'}>Unlocks at levels:</Typography>
            <Stack direction={'row'} gap={1}>
              {indexes.map((indexBonus, index) => {
                return <Typography variant={'body2'}
                                   color={indexBonus < highestEmperorShowdown ? 'success.light' : 'inherit'}
                                   key={bonus + 'indexBonus-' + indexBonus}>{indexBonus + 1}{index < indexes.length - 1
                  ? ','
                  : ''}</Typography>
              })}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Emperor;
