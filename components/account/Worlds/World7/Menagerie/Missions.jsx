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

const Progress = ({ progress, requirement, increment, claims, isLogScale, isBits }) => {
  if (progress === null || progress === undefined) {
    return <Stack direction={'row'} alignItems={'center'} gap={.5}>
      <Typography variant={'body2'} color={'text.secondary'}>Progress: unknown</Typography>
      <Tooltip title={'This progress is not part of the uploaded save'}>
        <InfoIcon sx={{ fontSize: 16 }}/>
      </Tooltip>
    </Stack>;
  }
  // Progress is never spent, so after a claim the bar measures from the last threshold, not from zero
  const previous = claims > 0 && increment > 0 ? requirement - increment : 0;
  const step = requirement - previous;
  const percent = step > 0 ? Math.min(100, Math.max(0, (progress - previous) / step * 100)) : 100;
  return <Stack gap={.5}>
    <LabelValue label={'Progress'}>
      {formatAmount(progress, isLogScale, isBits)} / {formatAmount(requirement, isLogScale, isBits)}
    </LabelValue>
    <ProgressBar percent={percent}/>
  </Stack>;
};

const Missions = ({ missions, unlocked }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {missions?.map(({
      index, name, description, claims, progress, requirement, increment, claimable, isLogScale, isBits, canClaim, visible
    }) => {
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
        <Progress progress={progress} requirement={requirement} increment={increment} claims={claims} isLogScale={isLogScale} isBits={isBits}/>
        {claimable > 0
          ? <LabelValue label={visible ? 'Claimable now' : 'Claimable once unlocked'}>
            {commaNotation(claimable)} {claimable === 1 ? 'shell' : 'shells'}
          </LabelValue>
          : null}
        {increment > 0 ? <LabelValue label={'Requirement'}>
          +{isLogScale ? `${commaNotation(increment)} digits` : commaNotation(increment)} per claim
        </LabelValue> : null}
      </UpgradeCard>;
    })}
  </Stack>;
};

export default Missions;
