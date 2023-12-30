import { Card, CardContent, Container, Stack, Typography, useMediaQuery } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

const AbilityTypes = {
  0: 'error.light',
  1: 'success.light',
  2: 'warning.light'
}

const Territory = ({ territories, spices }) => {
  const breakpoint = useMediaQuery('(max-width: 1500px)', { noSsr: true });

  return (
    <Container maxWidth={'xl'}>
      <Stack gap={2}>
        {territories?.map(({
                             territoryName,
                             battleName,
                             background,
                             team,
                             reqProgress,
                             currentProgress,
                             forageSpeed
                           }, index) => {
          if (battleName === 'Filler_Filler') return null;
          const spice = spices?.available?.[index];
          return <Stack key={battleName} direction={'row'} justifyContent={'center'}>
            <Card  sx={{ width: '100%' }}>
              <CardContent sx={{ position: 'relative' }}>
                <Stack direction={breakpoint ? 'column' : 'row'} flexWrap={'wrap'}
                       gap={breakpoint ? 2 : 0}
                       justifyContent={breakpoint ? 'flex-start' : 'space-between'}>
                  <Stack sx={{ width: 170 }} gap={2} direction={breakpoint ? 'row' : 'column'}>
                    <Stack sx={{ width: '100%', top: 5, left: 5 }}>
                      <Typography variant={'body1'}>{territoryName}</Typography>
                      <Typography variant={'body2'}>{cleanUnderscore(battleName)}</Typography>
                    </Stack>
                    <img style={{ borderRadius: '50%', width: 48, height: 48 }} src={`${prefix}data/${background}`}
                         alt={''}/>
                  </Stack>
                  <Stack direction={'row'} flexWrap={'wrap'}>
                    <CardTitleAndValue cardSx={{ my: 0, width: 150 }} variant={'outlined'} title={'Spice'}>
                      <Stack direction={'row'} gap={1}>
                        <img src={`${prefix}data/${spice?.rawName}.png`} alt={''}/>
                        <Stack>
                          <Typography variant={'caption'}>{spice?.toClaim ?? 0}</Typography>
                          <Typography variant={'caption'}>({spice?.amount
                            ? notateNumber(spice?.amount)
                            : 0})</Typography>
                        </Stack>
                      </Stack>
                    </CardTitleAndValue>
                    <CardTitleAndValue cardSx={{ my: 0, width: 150 }} variant={'outlined'} title={'Forage speed'}
                                       value={`${notateNumber(forageSpeed)}/HR`}/>
                    <CardTitleAndValue cardSx={{ my: 0, width: 150 }} variant={'outlined'} title={'Progress'}
                                       value={`${notateNumber(currentProgress)} / ${notateNumber(reqProgress)}`}/>
                  </Stack>
                  <Stack direction={'row'} flexWrap={'wrap'}>
                    {team?.map(({ name, realName, power, gene }, monsterIndex) => {
                      const slotFull = name !== 'none';
                      const color = AbilityTypes?.[gene?.abilityType];
                      return <Card sx={{ ml: monsterIndex === 0 && !breakpoint ? 'auto' : '' }}
                                   key={battleName + monsterIndex}
                                   variant={'outlined'}>
                        <CardContent sx={{
                          '&:last-child': { padding: 2 },
                          position: 'relative',
                          width: 120,
                          height: 110,
                          border: color && slotFull ? '2px solid' : '',
                          borderColor: color,
                          display: 'flex',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}>
                          {slotFull ? <>
                            <img
                              style={{
                                alignSelf: 'center',
                                flexShrink: 0,
                                width: 64,
                                height: 64,
                                objectFit: 'contain'
                              }}
                              src={`${prefix}afk_targets/${realName}.png`} alt={''}/>
                            <Stack sx={{ width: '100%' }} mt={1} direction={'row'} justifyContent={'space-between'}
                                   alignItems={'center'}>
                              <img style={{ width: 30, height: 30 }}
                                   src={`${prefix}data/GeneOver${gene?.index}.png`} alt={''}/>
                              <Typography>{notateNumber(power)}</Typography>
                            </Stack>
                          </> : <Stack alignItems={'center'} justifyContent={'center'}>None</Stack>}
                        </CardContent>
                      </Card>
                    })}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        })}
      </Stack>
    </Container>
  );
};

export default Territory;
