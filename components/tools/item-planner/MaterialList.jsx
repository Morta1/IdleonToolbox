import React, { useState } from 'react';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { openItemWikiPage } from '@utility/wiki/item-page';
import ShortAmount from '@components/common/ShortAmount';
import ItemTooltip, { ownerName } from './ItemTooltip';

const COMPACT_FROM = 12;

export const GroupTitle = ({ title, count }) => <Stack direction={'row'} alignItems={'baseline'} gap={1}
                                                       sx={{ px: { xs: 0, md: 1.5 } }}>
  <Typography variant={'groupLabel'} component={'h3'} color={'text.muted'}>{title}</Typography>
  {count ? <Typography variant={'caption'} color={'text.muted'}>{count}</Typography> : null}
</Stack>;



const rowStatus = ({ type, state, required, owned }) => {
  if (state === 'covered') return { status: 'done', text: 'Covered' };
  if (type === 'Equip') {
    return state === 'ready' ? { status: 'ready', text: 'Owned' } : { status: 'needs', text: 'Not crafted' };
  }
  return state === 'ready'
    ? { status: 'ready', text: 'Ready' }
    : { status: 'problem', text: <>Short&nbsp;<ShortAmount amount={required - owned}/></> };
};

const MaterialRow = ({ row, compact }) => {
  const { itemName, rawName, required, owned, owners, state } = row;
  const status = rowStatus(row);
  const percent = required > 0 ? Math.min(100, (owned / required) * 100) : 100;
  const wide = !compact;
  return <Box sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: '32px minmax(0, 1fr) auto',
      md: wide ? '40px minmax(0, 1fr) 190px 120px 150px' : '32px minmax(0, 1fr) auto'
    },
    alignItems: 'center',
    columnGap: { xs: 1.5, md: 2 },
    rowGap: 0.5,
    py: 1,
    px: { xs: 0, md: 1.5 },
    borderTop: 1,
    borderColor: 'divider'
  }}>
    <ItemTooltip rawName={rawName} owners={owners}>
      <Box component={'img'} src={`${prefix}data/${rawName}.png`} alt=""
           sx={{ width: { xs: 32, md: wide ? 40 : 32 }, height: { xs: 32, md: wide ? 40 : 32 }, objectFit: 'contain' }}/>
    </ItemTooltip>
    <Box sx={{ minWidth: 0 }}>
      <Link component={'button'} type={'button'} underline={'hover'} color={'primary'}
            onClick={() => openItemWikiPage(rawName)}
            sx={{ display: 'block', maxWidth: '100%', fontSize: 14, fontWeight: 500, textAlign: 'left',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {cleanUnderscore(itemName)}
      </Link>
      <Typography variant={'caption'} component={'div'} color={'text.muted'} sx={{ lineHeight: 1.5 }}>
        {owners?.length ? owners.map(ownerName).join(', ') : 'Not owned'}
      </Typography>
    </Box>
    <Typography variant={'body2'} color={'text.secondary'} sx={{
      gridColumn: { xs: '2 / 4', md: wide ? 'auto' : '2 / 4' },
      gridRow: { xs: 2, md: wide ? 'auto' : 2 },
      textAlign: { xs: 'left', md: wide ? 'right' : 'left' },
      fontVariantNumeric: 'tabular-nums'
    }}>
      <Box component={'span'} sx={{ color: 'text.primary', fontWeight: 500 }}><ShortAmount amount={owned}/></Box>
      {' / '}<ShortAmount amount={required}/>
    </Typography>
    <Box sx={{
      display: { xs: 'none', md: wide ? 'block' : 'none' },
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
    <Box sx={{ gridColumn: { xs: 3, md: 'auto' }, gridRow: { xs: 1, md: 'auto' }, justifySelf: 'end' }}>
      <StatusText status={status.status}>{status.text}</StatusText>
    </Box>
  </Box>;
};

export const MaterialRows = ({ rows }) => {
  const compact = rows.length > COMPACT_FROM;
  return <Box sx={{
    display: 'grid',
    gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: compact ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' },
    columnGap: 2
  }}>
    {rows.map((row) => <MaterialRow key={row.itemName} row={row} compact={compact}/>)}
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
        {rows.slice(0, 6).map(({ itemName, rawName }) => <Box key={itemName} component={'img'}
                                                               src={`${prefix}data/${rawName}.png`} alt=""
                                                               sx={{ width: 32, height: 32, objectFit: 'contain', opacity: 0.6 }}/>)}
      </Box>
      <Typography variant={'body2'} fontWeight={500} sx={{ flex: '1 1 220px' }}>
        {rows.length} more material{rows.length === 1 ? '' : 's'} only feed tiers you already own
      </Typography>
      <Button onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide them' : 'Show them'}
      </Button>
    </Box>
    {open ? <MaterialRows rows={rows}/> : null}
  </Stack>;
};
