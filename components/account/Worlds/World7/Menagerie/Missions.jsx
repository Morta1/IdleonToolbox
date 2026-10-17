import React from 'react';
import { Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { commaNotation, notateNumber } from '@utility/helpers';
import UpgradeCard, { CardIcon, LabelValue } from '@components/common/UpgradeCard';
import ProgressBar from '@components/common/ProgressBar';
import Tooltip from '@components/Tooltip';
import { formatLumi, StatusText } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

// Missions 20 and 24 count digits: the game shows 10^requirement
const formatAmount = (value, isLogScale) => isLogScale
  ? notateNumber(Math.pow(10, value), 'Big')
  : formatLumi(value);

const Progress = ({ progress, requirement, isLogScale }) => {
  if (progress === null || progress === undefined) {
    return <Stack direction={'row'} alignItems={'center'} gap={.5}>
      <Typography variant={'body2'} color={'text.secondary'}>Progress: unknown</Typography>
      <Tooltip title={'This progress is not part of the uploaded save'}>
        <InfoIcon sx={{ fontSize: 16 }}/>
      </Tooltip>
    </Stack>;
  }
  const percent = requirement > 0 ? Math.min(100, progress / requirement * 100) : 100;
  return <Stack gap={.5}>
    <LabelValue label={'Progress'}>
      {formatAmount(progress, isLogScale)} / {formatAmount(requirement, isLogScale)}
    </LabelValue>
    <ProgressBar percent={percent}/>
  </Stack>;
};

const Missions = ({ missions, unlocked }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {missions?.map(({ index, name, description, claims, progress, requirement, isLogScale, canClaim, visible }) => {
      return <UpgradeCard key={`mission-${index}`}
                          width={320}
                          dimmed={!visible}
                          icon={<CardIcon src={`data/MenaIconY${index}.png`} size={38} alt={''}/>}
                          title={name}
                          subtitle={`Claimed ${commaNotation(claims ?? 0)} times`}
                          badges={unlocked && visible && canClaim
                            ? <StatusText status={'claimable'}/>
                            : !visible ? <StatusText status={'locked'}/> : null}>
        <Typography variant={'body2'}>{description}</Typography>
        <Progress progress={progress} requirement={requirement} isLogScale={isLogScale}/>
      </UpgradeCard>;
    })}
  </Stack>;
};

export default Missions;
