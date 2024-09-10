import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { notateNumber, prefix } from '@utility/helpers';
import { getKillroySchedule } from '@parsers/misc';
import Tabber from '@components/common/Tabber';
import { format, isValid } from 'date-fns';

const MyComponent = () => {
  const { state } = useContext(AppContext);
  const { killroy } = state?.account || { deathNote: {} };
  const schedule = getKillroySchedule(state?.account, state?.account?.serverVars);
  return <>
    <NextSeo
      title="Killroy | Idleon Toolbox"
      description="Keep track of kill roy kills progression"
    />
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      <CardTitleAndValue title={'Total Kills'} value={notateNumber(killroy.totalKills)}/>
      <CardTitleAndValue title={'Total Damage Multi'} value={`${killroy.totalDamageMulti}x`}/>
    </Stack>
    <Tabber tabs={['Monsters', 'Schedule']}>
      <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
        {killroy?.list?.map(({ rawName, world, killRoyKills, icon }, index) => {
          return <Card key={rawName + index}>
            <CardContent>
              <Stack alignItems={'center'} gap={1}>
                <img src={`${prefix}data/${icon}.png`} alt=""/>
                <Typography>{notateNumber(killRoyKills ?? 0, 'Big')}</Typography>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
      <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
        {schedule?.map(({ classes, date }, classesIndex) => {
          return <Card key={`schedule-${classesIndex}`} sx={{ width: 300 }}>
            <CardContent>
              <Typography sx={{ ml: 1, mb: 2 }}>{isValid(date)
                ? format(date, 'dd/MM/yyyy HH:mm:ss')
                : null}</Typography>
              <Stack direction={'row'} gap={1}>
                {classes.map(({ className, classIndex }, classIdIndex) => {
                  return <React.Fragment key={`schedule-${classesIndex}-classId-${classIdIndex}`}>
                    <Card variant={'outlined'}>
                      <CardContent>
                        <Stack alignItems={'center'}>
                          <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                          <Typography>{className}</Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </React.Fragment>
                })}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </Tabber>

  </>
};

export default MyComponent;
