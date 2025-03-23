import { Stack, Typography } from '@mui/material';
import { commaNotation } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import React from 'react';

export const ExpRateCard = ({ title, expRate }) => {
  return <CardTitleAndValue title={title}>
    <Stack direction="row" alignItems={'center'} gap={1}>
      <Typography>{commaNotation(expRate?.value)} / hr</Typography>
      <Tooltip
        title={<Stack>
          {expRate?.breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                                              title={name}
                                                                              titleStyle={{ width: 120 }}
                                                                              value={value.toFixed(2).replace('.00', '')}/>)}

        </Stack>}>
        <IconInfoCircleFilled size={18}/>
      </Tooltip>
    </Stack>
  </CardTitleAndValue>
}

export const CardWithBreakdown = ({ title, breakdown, value }) => {
  return <CardTitleAndValue title={title}>
    <Stack direction="row" alignItems={'center'} gap={1}>
      {value ? <Typography>{value}</Typography> : null}
      {breakdown ? <Tooltip
        title={<Stack>
          {breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                                     title={name}
                                                                     titleStyle={{ width: 120 }}
                                                                     value={value.replace('.00', '')}/>)}

        </Stack>}>
        <IconInfoCircleFilled size={18}/>
      </Tooltip> : null}
    </Stack>
  </CardTitleAndValue>
}

