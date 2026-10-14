import React, { Fragment } from 'react';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber, prefix } from '@utility/helpers';
import ProgressBar from '@components/common/ProgressBar';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

const chapterGroupNames = {
  0: 'The fear within',
  1: 'Decay Surrounds',
  2: 'This is gospel',
  3: 'No escape',
  4: 'Sunken Plunder',
  5: 'Kelp Primeval',
  6: 'FILLER'
};

const milestoneCellSx = { textAlign: 'right', px: 1.25, py: 0.25 };

const MilestonesTooltip = ({ milestones, formatBonus, unit }) => (
  <Stack gap={0.75}>
    <Typography variant={'subtitle2'}>Levels to reach % of cap</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)' }}>
      {['Cap', 'Level', 'Bonus'].map((header) => (
        <Typography key={header} variant={'caption'} color={'text.secondary'} sx={milestoneCellSx}>{header}</Typography>
      ))}
      {milestones.map(({ percent, level, bonus, reached }) => {
        const rowSx = { ...milestoneCellSx, opacity: reached ? 0.5 : 1 };
        return (
          <Fragment key={percent}>
            <Typography variant={'body2'} sx={rowSx}>{percent}%</Typography>
            <Typography variant={'body2'} sx={rowSx}>{commaNotation(level)}</Typography>
            <Typography variant={'body2'} sx={rowSx}>{formatBonus(bonus)}{unit}</Typography>
          </Fragment>
        );
      })}
    </Box>
  </Stack>
);

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
              <img style={{ width: 32, height: 32 }} src={`${prefix}data/Spelunking${groupIndex}.png`} alt=""/>
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

                  const isDecay = chapter.maxBonus != null;

                  // Format max bonus with same notation the name uses
                  const hasMultiplierPlaceholder = chapter.name?.includes('}');
                  const formatBonus = (value) => notateNumber(value, hasMultiplierPlaceholder ? 'MultiplierInfo' : 'Small');
                  const formattedBonus = formatBonus(chapter.bonus);
                  const formattedMax = isDecay
                    ? formatBonus(chapter.maxBonus)
                    : null;

                  return (
                    <Fragment key={chapter.name || index}>
                      <Stack sx={{ opacity: chapter.level === 0 ? 0.5 : 1 }}>
                        <Stack direction={'row'} gap={1} alignItems={'center'}>
                          <Stack direction={'row'} alignItems={'center'} gap={1} flex={1}>
                            <Typography variant="subtitle1">
                              {chapterName}
                            </Typography>
                            <Typography variant="subtitle2" noWrap sx={{ ml: 'auto' }}>
                              Lv. {chapter.level}
                            </Typography>
                            {chapter.milestones ? (
                              <Tooltip title={<MilestonesTooltip milestones={chapter.milestones} formatBonus={formatBonus}
                                                                 unit={chapter.name?.match(/[{}](x|%)/)?.[1] ?? ''}/>}>
                                <InfoIcon sx={{ fontSize: 14 }} aria-label={'Levels to reach % of cap'}/>
                              </Tooltip>
                            ) : null}
                          </Stack>
                        </Stack>
                        {isDecay ? (
                          <ProgressBar
                            percent={chapter.progression}
                            tooltipTitle={`${formattedBonus} / ${formattedMax} cap`}
                          />
                        ) : (
                          <Typography variant={'body2'} sx={{ mt: 0.5 }}>+{chapter.scalingValue} per level</Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">Required pages: {commaNotation(chapter.requiredPages)}</Typography>
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
