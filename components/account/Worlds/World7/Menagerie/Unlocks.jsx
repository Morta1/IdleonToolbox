import React from 'react';
import { Stack, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { commaNotation } from '@utility/helpers';
import UpgradeCard, { CardIcon, IconValueRow, LabelValue } from '@components/common/UpgradeCard';
import Tooltip from '@components/Tooltip';
import { formatLumi, LUMI_ICON, RankRequired, StatusText } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const NIGHTMARINER_UNLOCK = 13;

const UnlockTitle = ({ name, tooltip }) => {
  if (!tooltip) return name;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    {name}
    <Tooltip title={tooltip}>
      <InfoIcon sx={{ fontSize: 16 }}/>
    </Tooltip>
  </span>;
};

const Unlocks = ({ unlocks, menagerie }) => {
  return <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {unlocks?.map(({ index, name, tooltip, cost, owned, affordable, visible, rankRequired }) => {
      return <UpgradeCard key={`unlock-${index}`}
                          width={320}
                          dimmed={!visible && !owned}
                          icon={<CardIcon src={`data/MenaIconO${index}.png`} width={44} height={55} alt={''}/>}
                          title={<UnlockTitle name={name} tooltip={tooltip}/>}
                          badges={owned
                            ? <StatusText status={'owned'}/>
                            : !visible ? <StatusText status={'locked'}/> : null}
                          footer={!owned ? <IconValueRow src={LUMI_ICON} alt={'Lumi'} iconSize={24}>
                            <Typography component={'span'} variant={'body2'} color={affordable ? 'text.primary' : 'error'}>
                              {formatLumi(cost)}
                            </Typography>
                          </IconValueRow> : null}>
        {!visible && !owned ? <RankRequired rank={rankRequired}/> : null}
        {index === NIGHTMARINER_UNLOCK && owned
          ? <LabelValue label={'Nightmariner LVs over 600'}>
            {commaNotation(menagerie?.nightmariner?.totalLevels ?? 0)}
          </LabelValue>
          : null}
      </UpgradeCard>;
    })}
  </Stack>;
};

export default Unlocks;
