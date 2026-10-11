import { Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { Breakdown } from '@components/common/Breakdown/Breakdown';

// A titled card whose value carries an info icon that opens the breakdown drawer
export const CardWithBreakdown = ({ title, breakdown, value, skipNotation }) => {
  return <CardTitleAndValue title={title}>
    <Stack direction="row" alignItems={'center'} gap={1}>
      {value ? <Typography component={'div'}>{value}</Typography> : null}
      {breakdown ? <Breakdown data={breakdown} skipNotation={skipNotation}>
        <Stack alignContent={'center'}>
          <IconInfoCircleFilled size={18}/>
        </Stack>
      </Breakdown> : null}
    </Stack>
  </CardTitleAndValue>
}
