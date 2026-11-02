import { useId, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';
import GameIcon from '@components/common/GameIcon';
import { numOrNode } from '@components/common/Num';
import { cardSurface } from './tokens';

const VALUE_SX = { fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
// Rows split by lines: every row but the first draws the line above it.
const ROWS_SX = { '& > * + *': { borderTop: 1, borderColor: 'divider' } };

// Panel (Cards board): a titled box around a list, a table, a chart or a form. The title lives in the
// 56 px header band, never as a heading above a card. A collapsed panel keeps its rows in the page
// (hidden), so the static export still carries them.
const Panel = ({ icon, iconAlt = '', title, meta, aside, collapsible, defaultOpen = true, children, sx }) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const shown = !collapsible || open;
  const name = typeof title === 'string' ? title : '';
  return <Box component={'section'} sx={[(theme) => cardSurface(theme), ...(Array.isArray(sx) ? sx : [sx])]}>
    <Stack direction={'row'} alignItems={'center'} gap={1.5}
           sx={{ minHeight: 56, py: 1, pl: 2, pr: 1.5, borderBottom: shown ? 1 : 0, borderColor: 'divider' }}>
      {typeof icon === 'string' ? <GameIcon src={icon} size={24} alt={iconAlt}/> : icon}
      <Stack sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant={'cardTitle'} component={'h2'}>{title}</Typography>
        {meta ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{meta}</Typography> : null}
      </Stack>
      {aside ? <Box sx={{ flexShrink: 0 }}>{aside}</Box> : null}
      {collapsible ? <IconButton size={'small'} aria-expanded={open} aria-controls={bodyId}
                                 aria-label={`${open ? 'Collapse' : 'Expand'} ${name}`.trim()}
                                 onClick={() => setOpen(!open)}>
        <IconChevronDown size={20} style={{ transform: open ? 'none' : 'rotate(-90deg)' }}/>
      </IconButton> : null}
    </Stack>
    <Box id={bodyId} hidden={!shown} sx={ROWS_SX}>{children}</Box>
  </Box>;
};

// Icon, name and one muted line on the left; the number on the right.
const Row = ({ icon, iconAlt = '', name, sub, value, valueSub, kind }) => <Stack direction={'row'} alignItems={'center'}
                                                                               gap={1.5} sx={{ px: 2, py: 1.25 }}>
  {typeof icon === 'string' ? <GameIcon src={icon} size={32} alt={iconAlt}/> : icon}
  <Stack sx={{ minWidth: 0, flex: 1 }}>
    <Typography variant={'body2'} component={'div'} sx={{ fontWeight: 500 }}>{name}</Typography>
    {sub ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{sub}</Typography> : null}
  </Stack>
  {value !== undefined || valueSub ? <Stack alignItems={'flex-end'} sx={{ flexShrink: 0 }}>
    <Typography variant={'body2'} component={'div'} sx={VALUE_SX}>{numOrNode(value, kind)}</Typography>
    {valueSub ? <Typography variant={'caption'} color={'text.secondary'} component={'div'}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{valueSub}</Typography> : null}
  </Stack> : null}
</Stack>;

// A banded group title over label and value rows, for info boxes (the wiki InfoBox's shape).
const Group = ({ label, children }) => <Box>
  <Typography variant={'groupLabel'} color={'text.secondary'} sx={{ px: 2, py: 0.75, bgcolor: 'background.default' }}>
    {label}
  </Typography>
  <Box sx={ROWS_SX}>{children}</Box>
</Box>;

// Label and value as divs, never the default p: either can be a whole element (InfoBox's hydration note).
const KV = ({ label, value, kind }) => <Stack direction={'row'} justifyContent={'space-between'} gap={2}
                                              sx={{ px: 2, py: 0.75 }}>
  <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{label}</Typography>
  <Typography variant={'body2'} component={'div'} sx={VALUE_SX}>{numOrNode(value, kind)}</Typography>
</Stack>;

Panel.Row = Row;
Panel.Group = Group;
Panel.KV = KV;

export default Panel;
