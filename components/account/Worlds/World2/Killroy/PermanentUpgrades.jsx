import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import React from 'react';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';
import ProgressBar from '@components/common/ProgressBar';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const BreakpointTooltip = ({ breakpoints }) => {
  return (
    <Stack gap={0.5}>
      <Typography variant="caption">Cap is never fully reached, breakpoints:</Typography>
      {breakpoints?.map(({ percent, level, bonusDisplay: breakpointBonus }) => (
        <Typography key={percent} variant="body2">
          {percent}%: Lv. {commaNotation(level)} ({breakpointBonus})
        </Typography>
      ))}
    </Stack>
  );
};

const Upgrades = ({ killroy }) => {
  return (
    <Stack direction={'row'} alignItems={'center'} flexWrap={'wrap'} gap={1}>
      {killroy?.permanentUpgrades?.map(({
                                          description,
                                          level,
                                          progress,
                                          bonusDisplay,
                                          capDisplay,
                                          breakpoints,
                                          nextBreakpoint
                                        }, index) => (
        <Card key={`upgrade-${index}`} sx={{ height: 195, width: 350 }}>
          <CardContent>
            <Stack direction={'row'} gap={2}>
              <img style={{ objectFit: 'contain' }} src={`${prefix}etc/Skull_Shop_Item_${index}.png`} alt="skull-shop-icon"/>
              <Stack flex={1} minWidth={0}>
                {level > 0 ? <Typography>Upgrades: {level}</Typography> : <>&nbsp;</>}
                {progress != null ? (
                  <ProgressBar
                    percent={progress}
                    tooltipTitle={`${bonusDisplay} / ${capDisplay} cap`}
                  />
                ) : null}
                {nextBreakpoint ? (
                  <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Next breakpoint: Lv. {commaNotation(nextBreakpoint.level)} ({nextBreakpoint.bonusDisplay})
                    </Typography>
                    <Tooltip title={<BreakpointTooltip breakpoints={breakpoints}/>}>
                      <IconInfoCircleFilled size={14} style={{ cursor: 'pointer', flexShrink: 0 }}/>
                    </Tooltip>
                  </Stack>
                ) : null}
                <Divider sx={{ my: 1 }}/>
                <Typography>{cleanUnderscore(description.replace('{', 1 + level / 100))}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default Upgrades;
