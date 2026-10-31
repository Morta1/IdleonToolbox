import React from 'react';
import { Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { commaNotation, getBitIndex, notateNumber, prefix } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import Tooltip from '@components/Tooltip';
import { formatLumi } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

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
  return <ItemCard.Progress label={'Progress'} percent={percent}
                            value={formatAmount(progress, isLogScale, isBits)}
                            max={formatAmount(requirement, isLogScale, isBits)}/>;
};

const Missions = ({ missions, unlocked }) => {
  return <CardGrid size={'m'}>
    {missions?.map(({
      index, name, description, claims, progress, requirement, increment, claimable, isLogScale, isBits, canClaim, visible
    }) => {
      return <ItemCard key={`mission-${index}`}
                       icon={`data/MenaIconY${index}.png`}
                       title={name}
                       meta={`Claimed ${commaNotation(claims ?? 0)} times`}
                       status={visible ? undefined : 'locked'}
                       aside={unlocked && visible && canClaim ? <StatusText status={'ready'}>Claimable</StatusText> : null}>
        <ItemCard.Desc>{description}</ItemCard.Desc>
        <Progress progress={progress} requirement={requirement} increment={increment} claims={claims} isLogScale={isLogScale} isBits={isBits}/>
        <ItemCard.Facts rows={[
          claimable > 0
            ? [visible ? 'Claimable now' : 'Claimable once unlocked', `${commaNotation(claimable)} ${claimable === 1 ? 'shell' : 'shells'}`]
            : null,
          increment > 0
            ? ['Requirement', `+${isLogScale ? `${commaNotation(increment)} digits` : commaNotation(increment)} per claim`]
            : null
        ]}/>
      </ItemCard>;
    })}
  </CardGrid>;
};

export default Missions;
