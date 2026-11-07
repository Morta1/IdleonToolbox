import React, { useState } from 'react';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import { IconHammer } from '@tabler/icons-react';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore } from 'utility/helpers';
import GameIcon from '@components/common/GameIcon';
import { openItemWikiPage } from '@utility/wiki/item-page';
import ShortAmount from '@components/common/ShortAmount';
import ItemTooltip, { ownerName } from './ItemTooltip';

const COMPACT_FROM = 12;
// The wide row's fixed columns take 460 px plus their gaps: under this much list a name would break one word a line, so
// the row keeps its compact form. The list's own width decides, not the window's.
const WIDE_ROW = '@container (min-width: 760px)';

export const GroupTitle = ({ title, count }) => <Stack direction={'row'} alignItems={'baseline'} gap={1}
                                                       sx={{ px: { xs: 0, md: 1.5 } }}>
  <Typography variant={'groupLabel'} component={'h3'} color={'text.muted'}>{title}</Typography>
  {count ? <Typography variant={'caption'} color={'text.muted'}>{count}</Typography> : null}
</Stack>;



const rowStatus = ({ type, state, required, owned }) => {
  if (state === 'covered') return { status: 'done', text: 'Covered' };
  if (type === 'Equip') {
    // Not crafted is a to-do, not a shortfall: the info tone, with the hammer it is done with.
    return state === 'ready' ? { status: 'ready', text: 'Owned' } : { status: 'info', icon: IconHammer, text: 'Not crafted' };
  }
  return state === 'ready'
    ? { status: 'ready', text: 'Ready' }
    : { status: 'problem', text: <>Short&nbsp;<ShortAmount amount={required - owned}/></> };
};

// unknown: a guest or a failed storage section, so nothing here can say what the player owns: the name and the
// requirement stay
const MaterialRow = ({ row, compact, unknown }) => {
  const { itemName, rawName, required, owned, owners, state } = row;
  const status = rowStatus(row);
  const percent = required > 0 ? Math.min(100, (owned / required) * 100) : 100;
  const wide = !compact;
  return <Box sx={{
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr) auto',
    ...(wide ? { [WIDE_ROW]: { gridTemplateColumns: '32px minmax(0, 1fr) 190px 120px 150px' } } : {}),
    alignItems: 'center',
    columnGap: { xs: 1.5, md: 2 },
    rowGap: 0.5,
    py: 1,
    px: { xs: 0, md: 1.5 },
    borderTop: 1,
    borderColor: 'divider'
  }}>
    <ItemTooltip rawName={rawName} owners={unknown ? undefined : owners}>
      <GameIcon src={`data/${rawName}.png`} size={32} alt={''}/>
    </ItemTooltip>
    <Box sx={{ minWidth: 0 }}>
      <Link component={'button'} type={'button'} color={'primary'}
            onClick={() => openItemWikiPage(rawName)}
            sx={{ display: 'block', maxWidth: '100%', fontSize: 14, fontWeight: 500, textAlign: 'left' }}>
        {cleanUnderscore(itemName)}
      </Link>
      {unknown ? null : <Typography variant={'caption'} component={'div'} color={'text.muted'} sx={{ lineHeight: 1.5 }}>
        {owners?.length ? owners.map(ownerName).join(', ') : 'Not owned'}
      </Typography>}
    </Box>
    <Typography variant={'body2'} color={'text.secondary'} sx={{
      gridColumn: '2 / 4',
      gridRow: 2,
      textAlign: 'left',
      fontVariantNumeric: 'tabular-nums',
      ...(wide ? { [WIDE_ROW]: { gridColumn: 'auto', gridRow: 'auto', textAlign: 'right' } } : {})
    }}>
      <Box component={'span'} sx={{ color: 'text.primary', fontWeight: 500 }}>{unknown ? '-' : <ShortAmount amount={owned}/>}</Box>
      {' / '}<ShortAmount amount={required}/>
    </Typography>
    <Box sx={{
      display: 'none',
      ...(wide && !unknown ? { [WIDE_ROW]: { display: 'block' } } : {}),
      height: 6,
      borderRadius: 999,
      bgcolor: 'action.hover',
      overflow: 'hidden'
    }}>
      <Box sx={{
        height: '100%',
        width: `${percent}%`,
        borderRadius: 999,
        bgcolor: state === 'short' ? 'error.main' : state === 'ready' || state === 'covered' ? 'success.main' : 'primary.main'
      }}/>
    </Box>
    <Box sx={{ gridColumn: 3, gridRow: 1, justifySelf: 'end', ...(wide ? { [WIDE_ROW]: { gridColumn: 'auto', gridRow: 'auto' } } : {}) }}>
      {unknown ? null : <StatusText status={status.status} icon={status.icon}>{status.text}</StatusText>}
    </Box>
  </Box>;
};

export const MaterialRows = ({ rows, unknown }) => {
  const compact = rows.length > COMPACT_FROM;
  return <Box sx={{ containerType: 'inline-size' }}>
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: compact ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' },
      columnGap: 2
    }}>
      {rows.map((row) => <MaterialRow key={row.itemName} row={row} compact={compact} unknown={unknown}/>)}
    </Box>
  </Box>;
};

export const CoveredMaterials = ({ rows }) => {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  return <Stack gap={1}>
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: { xs: 1, sm: 2 },
      p: 1.5,
      borderRadius: 2,
      bgcolor: 'action.hover'
    }}>
      <Box aria-hidden sx={{ display: 'flex', gap: 0.25 }}>
        {rows.slice(0, 6).map(({ itemName, rawName }) => <GameIcon key={itemName} src={`data/${rawName}.png`} size={32} alt={''} status={'missing'}/>)}
      </Box>
      <Typography variant={'value'} component={'div'} sx={{ flex: '1 1 220px' }}>
        {rows.length} more material{rows.length === 1 ? '' : 's'} only feed tiers you already own
      </Typography>
      <Button onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide them' : 'Show them'}
      </Button>
    </Box>
    {open ? <MaterialRows rows={rows}/> : null}
  </Stack>;
};
