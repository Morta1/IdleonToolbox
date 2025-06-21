import { Divider, Stack, Typography } from '@mui/material';
import { commaNotation, notateNumber } from '@utility/helpers';
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
          {expRate?.breakdown?.map(({ title, name, value }, index) => title ? <Stack key={`${title}-${index}`}>
            {index > 0 ? <Divider sx={{ my: 1 }} /> : null}
            <Typography sx={{ fontWeight: 500 }}>{title}</Typography>
            <Divider sx={{ my: 1 }} />
          </Stack> : <TitleAndValue key={`${name}-${index}`}
            title={name}
            titleStyle={{ width: 150 }}
            value={value.toFixed(2).replace('.00', '')} />)}
        </Stack>}>
        <IconInfoCircleFilled size={18} />
      </Tooltip>
    </Stack>
  </CardTitleAndValue>
}

export const CardWithBreakdown = ({ title, breakdown, value, notation, skipNotation }) => {
  return <CardTitleAndValue title={title}>
    <Stack direction="row" alignItems={'center'} gap={1}>
      {value ? <Typography>{value}</Typography> : null}
      {breakdown ? <Tooltip
        title={<Stack>
          {breakdown?.map(({ title, name, value }, index) => title ? (
            <Stack key={`${title}-${index}`}>
              {index > 0 ? <Divider sx={{ my: 1 }} /> : null}
              <Typography sx={{ fontWeight: 500 }}>{title}</Typography>
              <Divider sx={{ my: 1 }} />
            </Stack>
          ) : (
            <TitleAndValue
              key={`${name}-${index}`}
              title={name}
              titleStyle={{ width: 180 }}
              value={skipNotation ? value : notation === 'MultiplierInfo' ? notateNumber(value, notation).replace('.00', '') : notation ? notateNumber(value, notation) : value}
            />
          ))}
        </Stack>}>
        <IconInfoCircleFilled size={18} />
      </Tooltip> : null}
    </Stack>
  </CardTitleAndValue>
}

