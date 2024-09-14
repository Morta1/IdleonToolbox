import { Card, CardContent, Stack, Typography } from '@mui/material';
import { format, isValid } from 'date-fns';
import React from 'react';
import { prefix } from '@utility/helpers';

const Schedule = ({ schedule }) => {
  return (
    <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
      {schedule?.map(({ classes, date, monsters }, classesIndex) => {
        return <Card key={`schedule-${classesIndex}`} sx={{ width: 330 }}>
          <CardContent>
            <Typography sx={{ ml: 1, mb: 2 }}>{isValid(date)
              ? format(date, 'dd/MM/yyyy HH:mm:ss')
              : null}</Typography>
            <Stack direction={'row'} gap={1}>
              {classes.map(({ className, classIndex }, classIdIndex) => {
                const monsterFaceId = monsters?.[classIdIndex];
                return <React.Fragment key={`schedule-${classesIndex}-classId-${classIdIndex}`}>
                  <Card variant={'outlined'}>
                    <CardContent>
                      <Stack alignItems={'center'}>
                        <Stack direction={'row'} alignItems={'center'}>
                          <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                          <img src={`${prefix}data/Mface${monsterFaceId}.png`} alt=""/>
                        </Stack>
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
  );
};

export default Schedule;
