import { Stack, Typography } from '@mui/material';
import { commaNotation } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';

export const ExpRateCard = ({ title, expRate }) => {
  return (
    <CardTitleAndValue title={title}>
      <Stack direction="row" alignItems={'center'} gap={1}>
        <Typography>{commaNotation(expRate?.value)} / hr</Typography>
        <Breakdown data={expRate?.breakdown}>
          <Stack alignContent={'center'}>
            <IconInfoCircleFilled size={18} />
          </Stack>
        </Breakdown>
      </Stack>
    </CardTitleAndValue>
  );
}

export const CardWithBreakdown = ({ title, breakdown, value, notation, skipNotation }) => {
  return <CardTitleAndValue title={title}>
    <Stack direction="row" alignItems={'center'} gap={1}>
      {value ? <Typography>{value}</Typography> : null}
      {breakdown ? <Breakdown data={breakdown} skipNotation={skipNotation}>
        <Stack alignContent={'center'}>
          <IconInfoCircleFilled size={18} />
        </Stack>
      </Breakdown> : null}
    </Stack>
  </CardTitleAndValue>
}

