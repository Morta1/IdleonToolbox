import React from 'react';
import { Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { commaNotation, getBitIndex, notateNumber, prefix } from '@utility/helpers';
import UpgradeCard, { CardIcon, LabelValue } from '@components/common/UpgradeCard';
import ProgressBar from '@components/common/ProgressBar';
import Tooltip from '@components/Tooltip';
import { formatLumi, StatusText } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

// Missions 20 and 24 count digits: the game shows 10^requirement, and mission 24's Gaming Bits in bits notation
const formatAmount = (value, isLogScale, isBits) => {
  if (!isLogScale) return formatLumi(value);
  const amount = Math.pow(10, value);
  if (!isBits) return notateNumber(amount, 'Big');
  return <Stack component={'span'} direction={'row'} alignItems={'center'} gap={.5} sx={{ display: 'inline-flex' }}>
    {notateNumber(amount, 'bits')}
    <img src={`${prefix}etc/Bits_${getBitIndex(amount)}.png`} alt={'Bits'} width={16} height={16} style={{ objectFit: 'contain' }}/>
  </Stack>;
};

const Progress = ({ progress, requirement, isLogScale, isBits }) => {
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
      {formatAmount(progress, isLogScale, isBits)} / {formatAmount(requirement, isLogScale, isBits)}
    </LabelValue>
    <ProgressBar percent={percent}/>
  </Stack>;
};

const Missions = ({ missions, unlocked }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {missions?.map(({ index, name, description, claims, progress, requirement, isLogScale, isBits, canClaim, visible }) => {
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
        <Progress progress={progress} requirement={requirement} isLogScale={isLogScale} isBits={isBits}/>
      </UpgradeCard>;
    })}
  </Stack>;
};

export default Missions;
