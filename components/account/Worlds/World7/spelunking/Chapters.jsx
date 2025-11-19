import React, { Fragment } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

const chapterGroupNames = {
  0: 'The fear within',
  1: 'Decay Surrounds',
  2: 'This is gospel',
  3: 'No escape'
};

const Chapters = ({ chapters }) => {
  if (!chapters || !Array.isArray(chapters)) {
    return <div>No chapters available</div>;
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
      {chapters.map((chapterGroup, groupIndex) => {
        if (!chapterGroup || !Array.isArray(chapterGroup) || chapterGroup.length === 0) {
          return null;
        }

        return (
          <Stack key={groupIndex}>
            <Stack direction={'row'} gap={1} alignItems={'center'} mb={1}>
              <img style={{ width: 32, height: 32 }} src={`${prefix}data/Spelunking${groupIndex}.png`} />
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <Typography variant="h6">{chapterGroupNames[groupIndex]}</Typography>
              </Stack>
            </Stack>
            <Card variant={'outlined'} sx={{ height: '100%' }}>
              <CardContent>
                {chapterGroup.map((chapter, index) => {
                  // Format bonus values for replacements
                  const smallBonus = notateNumber(chapter.bonus, 'Small');
                  const multiplierBonus = notateNumber(chapter.bonus, 'MultiplierInfo');

                  // Replace placeholders in chapter name
                  let chapterName = cleanUnderscore(chapter.name).replace('|', ' ');
                  chapterName = chapterName.replace(/{/g, smallBonus);
                  chapterName = chapterName.replace(/}/g, multiplierBonus);

                  return (
                    <Fragment key={chapter.name || index}>
                      <Stack direction={'row'} gap={1} alignItems={'center'} sx={{ opacity: chapter.level === 0 ? 0.5 : 1 }}>
                        <Stack direction={'row'} alignItems={'center'} gap={1} flex={1}>
                          <Typography variant="subtitle1">
                            {chapterName}
                          </Typography>
                          <Typography variant="subtitle2">
                            Lv. {chapter.level}
                            {chapter.x6 > 0 && ` / ${chapter.x6}`}
                          </Typography>
                        </Stack>
                      </Stack>
                    
                      {chapterGroup.length - 1 !== index && <Divider sx={{ my: 2 }} />}
                    </Fragment>
                  );
                })}
              </CardContent>
            </Card>
          </Stack>
        );
      })}
    </Box>
  );
};

export default Chapters;

