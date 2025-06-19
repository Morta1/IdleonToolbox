import { Card, CardContent, Stack, Typography } from '@mui/material';
import { format, isValid } from 'date-fns';
import React from 'react';
import { notateNumber, prefix } from '@utility/helpers';

const Schedule = ({ killroy, schedule }) => {
  return (
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {schedule?.map(({ classes, date, monsters }, classesIndex) => {
        return <Card key={`schedule-${classesIndex}`} sx={{ width: 450 }}>
          <CardContent>
            <Typography sx={{ ml: 1, mb: 2 }}>{isValid(date)
              ? format(date, 'dd/MM/yyyy HH:mm:ss')
              : null}</Typography>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
              {classes.map(({ className, classIndex }, classIdIndex) => {
                const monsterFaceId = monsters?.[classIdIndex]?.MonsterFace;
                const kills = killroy.list.find(({ name }) => name === monsters?.[classIdIndex]?.Name)?.killRoyKills ?? 0;
                return <React.Fragment key={`schedule-${classesIndex}-classId-${classIdIndex}`}>
                  <Card variant={'outlined'}>
                    <CardContent>
                      <Stack direction={'row'} gap={1} sx={{ width: 100 }} alignItems={'center'}>
                        <Stack alignItems={'center'}>
                          <img style={{ width: 42, height: 42, objectFit: 'contain' }}
                               src={`${prefix}data/ClassIcons${classIndex}.png`}
                               alt=""/>
                          <Typography variant={'caption'}>{className}</Typography>
                        </Stack>
                        <Stack alignItems={'center'}>
                          <img style={{ width: 42, height: 42, objectFit: 'contain' }}
                               src={`${prefix}data/Mface${monsterFaceId}.png`}
                               alt=""/>
                          <Typography variant={'caption'}>{notateNumber(kills)}</Typography>
                        </Stack>
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
  );
};

export default Schedule;
