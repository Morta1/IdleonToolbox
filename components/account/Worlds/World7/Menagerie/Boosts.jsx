import React from 'react';
import { Stack, Typography } from '@mui/material';
import { commaNotation } from '@utility/helpers';
import UpgradeCard, { CardIcon, IconValueRow, LabelValue } from '@components/common/UpgradeCard';
import { CardTitleAndValue } from '@components/common/styles';
import { formatLumi, LUMI_ICON, StatusText } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const DOUBLER_CARDS = [
  { key: 'blackStars', title: 'Black Stars' },
  { key: 'organicLabels', title: 'Organic Labels' },
  { key: 'minehead', title: 'Minehead Doublers' },
  { key: 'sushi', title: 'Sushi Station Doublers' },
  { key: 'jellyOperator', title: 'Jelly Operator Doublers' },
  { key: 'omnijade', title: 'Omnijade' }
];

const Boosts = ({ boosts, doublers }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      {DOUBLER_CARDS.map(({ key, title }) => {
        const { owned = 0, left = 0 } = doublers?.[key] ?? {};
        const used = owned - Math.max(0, left);
        return <CardTitleAndValue key={key} title={title} value={`${commaNotation(used)} / ${commaNotation(owned)}`}/>;
      })}
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {boosts?.map(({ index, description, level, perLevel, cost, affordable, visible }) => {
        return <UpgradeCard key={`boost-${index}`}
                            width={320}
                            dimmed={!visible}
                            icon={<CardIcon src={`data/MenaIconP${index}.png`} width={42} height={55} alt={''}/>}
                            title={description}
                            subtitle={`Lv. ${commaNotation(level ?? 0)}`}
                            badges={!visible ? <StatusText status={'locked'}/> : null}
                            footer={<IconValueRow src={LUMI_ICON} alt={'Lumi'} iconSize={24}>
                              <Typography component={'span'} variant={'body2'} color={affordable ? 'text.primary' : 'error'}>
                                {formatLumi(cost)}
                              </Typography>
                            </IconValueRow>}>
          <LabelValue label={'Per LV'}>{commaNotation(perLevel ?? 0)}</LabelValue>
        </UpgradeCard>;
      })}
    </Stack>
  </>;
};

export default Boosts;
