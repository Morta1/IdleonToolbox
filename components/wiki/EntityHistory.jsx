import React from 'react';
import { Stack, Typography } from '@mui/material';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';
import { CAVEAT, fieldLabel, formatValue } from '@utility/wiki/history';

// The panel asks the same question the list answers, so it cannot draw while the empty state shows.
export const entityHistoryShows = (node) => node?.history?.length > 0;

const EntityHistory = ({ node }) => {
  if (!entityHistoryShows(node)) return null;

  return <Stack sx={{ mt: 3 }} gap={0.5}>
    <Stack direction={'row'} gap={0.5} alignItems={'center'}>
      <Typography variant={'groupLabel'} component={'h3'} color={'text.secondary'}>
        Changes
      </Typography>
      <InfoButton label={'changes'}>{CAVEAT}</InfoButton>
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
        rebalanced at 2.3.511, the version its card first appeared, so the tag goes above those
        lines rather than replacing them. */}
      <Stack gap={0.25}>
        {event.t === 'added'
          ? <StatusText status={'info'} sx={{ alignSelf: 'flex-start' }}>Added</StatusText>
          : null}
        {(event.fields || []).map(({ field, from, to }) => <Typography
          key={field}
          variant={'body2'}
          color={'text.secondary'}
        >
          {fieldLabel(field)} went from {formatValue(from)} to {formatValue(to)}
        </Typography>)}
      </Stack>
    </Stack>)}
  </Stack>;
};

export default EntityHistory;
