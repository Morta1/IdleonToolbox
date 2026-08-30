import React from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import { CAVEAT, fieldLabel, formatValue } from '@utility/wiki/history';

const EntityHistory = ({ node }) => {
  if (!node?.history?.length) return null;

  return <Stack sx={{ mt: 3 }} gap={0.5}>
    <Stack direction={'row'} gap={0.5} alignItems={'center'}>
      <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'} letterSpacing={0.5}>
        Changes
      </Typography>
      <Tooltip title={CAVEAT}>
        <InfoIcon sx={{ fontSize: 14, cursor: 'pointer' }}/>
      </Tooltip>
    </Stack>
    {node.history.map((event) => <Stack
      key={event.v}
      direction={{ xs: 'column', sm: 'row' }}
      gap={{ xs: 0.25, sm: 1.5 }}
      sx={{ py: 0.5, borderTop: '1px solid', borderColor: 'action.hover' }}
    >
      <Typography variant={'body2'} sx={{ minWidth: 72, fontVariantNumeric: 'tabular-nums' }}>
        {event.v}
      </Typography>
      {/* An added event can carry fields too: a node merges two source collections, and the one
        that added the entity is often not the one that changed it. monster:caveD was renamed and
        rebalanced at 2.3.511, the version its card first appeared, so the chip goes above those
        lines rather than replacing them. */}
      <Stack gap={0.25}>
        {event.t === 'added'
          ? <Chip size={'small'} variant={'outlined'} label={'Added'} sx={{ alignSelf: 'flex-start' }}/>
          : null}
        {(event.fields || []).map(({ field, from, to }) => <Typography
          key={field}
          variant={'body2'}
          color={'text.secondary'}
        >
          {fieldLabel(field)}: {formatValue(from)} to {formatValue(to)}
        </Typography>)}
      </Stack>
    </Stack>)}
  </Stack>;
};

export default EntityHistory;
