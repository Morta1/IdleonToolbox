import { useId, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';
import GameIcon from '@components/common/GameIcon';
import { numOrNode } from '@components/common/Num';
import { useSheet } from './SheetContext';
import { cardSurface } from './tokens';

const VALUE_SX = { fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
// Rows split by lines: every row but the first draws the line above it.
const ROWS_SX = { '& > * + *': { borderTop: 1, borderColor: 'divider' } };

// A section of a sheet (the characters board's .sec): no surface, a line above. The section is the container its grids
// query, so their column counts follow the column it sits in, not the window (CardGrid).
const sectionSx = (side) => ({
  minWidth: 0, boxSizing: 'border-box', containerType: 'inline-size', borderTop: 1, borderColor: 'divider',
  ...(side ? { pt: '12px', px: '12px', pb: '14px' } : { pt: '14px', px: 2, pb: 2 })
});
// A row's line inside a sheet is the faintest role: the board's 7% has no token of its own.
const SHEET_LINE = { borderTop: 1, borderColor: 'background.tint', '&:first-child': { borderTop: 0 } };
// Every value lines up, with or without a breakdown: a row with no glyph keeps the glyph's room at its end.
const SHEET_VALUE_SX = {
  ...VALUE_SX, whiteSpace: 'nowrap', pr: '22px',
  '&:has([aria-haspopup="dialog"])': { pr: '2px' },
  '& [aria-haspopup="dialog"] > [aria-hidden]': { ml: '6px' }
};

const SheetSection = ({ side, title, meta, aside, children, sx }) => <Box component={'section'} sx={[sectionSx(side), ...(Array.isArray(sx) ? sx : [sx])]}>
  <Stack direction={'row'} alignItems={'baseline'} justifyContent={'space-between'} gap={1.5} sx={{ mb: 1 }}>
    <Typography variant={'cardTitle'} component={'h3'} sx={{ minWidth: 0 }}>{title}</Typography>
    {meta ? <Typography color={'text.secondary'} component={'div'} sx={{ fontSize: 13, lineHeight: '18px', whiteSpace: 'nowrap' }}>{meta}</Typography> : null}
    {aside ? <Box sx={{ flexShrink: 0 }}>{aside}</Box> : null}
  </Stack>
  {children}
</Box>;

// Panel (Cards board): a titled box around a list, a table, a chart or a form. The title lives in the
// 56 px header band, never as a heading above a card. A collapsed panel keeps its rows in the page
// (hidden), so the static export still carries them. asideOwnRow: on a phone the aside takes its own row under the title,
// so a long meta never wraps beside it.
const Panel = ({ icon, iconAlt = '', title, meta, aside, asideOwnRow, collapsible, defaultOpen = true, children, sx }) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const sheet = useSheet();
  if (sheet) return <SheetSection side={sheet.side} title={title} meta={meta} aside={aside} sx={sx}>{children}</SheetSection>;
  const shown = !collapsible || open;
  const name = typeof title === 'string' ? title : '';
  return <Box component={'section'} sx={[(theme) => cardSurface(theme), ...(Array.isArray(sx) ? sx : [sx])]}>
    <Stack direction={'row'} alignItems={'center'} gap={1.5} flexWrap={asideOwnRow ? { xs: 'wrap', sm: 'nowrap' } : undefined}
           sx={{ minHeight: 56, py: 1, pl: 2, pr: 1.5, borderBottom: shown ? 1 : 0, borderColor: 'divider' }}>
      {typeof icon === 'string' ? <GameIcon src={icon} size={24} alt={iconAlt}/> : icon}
      <Stack sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant={'cardTitle'} component={'h2'}>{title}</Typography>
        {meta ? <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{meta}</Typography> : null}
      </Stack>
      {aside ? <Box sx={{ flexShrink: 0, ...(asideOwnRow ? { flexBasis: { xs: '100%', sm: 'auto' } } : {}) }}>{aside}</Box> : null}
      {collapsible ? <IconButton size={'small'} aria-expanded={open} aria-controls={bodyId}
                                 aria-label={`${open ? 'Collapse' : 'Expand'} ${name}`.trim()}
                                 onClick={() => setOpen(!open)}>
        <IconChevronDown size={20} style={{ transform: open ? 'none' : 'rotate(-90deg)' }}/>
      </IconButton> : null}
    </Stack>
    <Box id={bodyId} hidden={!shown} sx={ROWS_SX}>{children}</Box>
  </Box>;
};

// Icon, name and one muted line on the left; the number on the right. sx is for a row in a narrow column.
const Row = ({ icon, iconAlt = '', name, sub, value, valueSub, kind, sx }) => {
  const sheet = useSheet();
  return <Stack direction={'row'} alignItems={sheet ? 'flex-start' : 'center'} gap={sheet ? 1.25 : 1.5}
                sx={[sheet ? { ...SHEET_LINE, py: '6px', '&:first-child': { borderTop: 0, pt: 0 } } : { px: 2, py: 1.25 }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {typeof icon === 'string' ? <GameIcon src={icon} size={sheet ? 28 : 32} alt={iconAlt}/> : icon}
    <Stack sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant={'body2'} component={'div'} sx={{ fontWeight: 500 }}>{name}</Typography>
      {sub ? <Typography variant={'body2'} color={'text.secondary'} component={'div'} sx={sheet ? { fontSize: 13, lineHeight: '18px' } : undefined}>{sub}</Typography> : null}
    </Stack>
    {value !== undefined || valueSub ? <Stack alignItems={'flex-end'} sx={{ flexShrink: 0 }}>
      <Typography variant={'body2'} component={'div'} sx={VALUE_SX}>{numOrNode(value, kind)}</Typography>
      {valueSub ? <Typography variant={'caption'} color={'text.secondary'} component={'div'}
                              sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{valueSub}</Typography> : null}
    </Stack> : null}
  </Stack>;
};

// A banded group title over label and value rows, for info boxes (the wiki InfoBox's shape).
const Group = ({ label, children }) => {
  const sheet = useSheet();
  if (sheet) {
    return <Box sx={{ '& + &': { mt: '10px' } }}>
      <Typography variant={'groupLabel'} color={'text.secondary'} sx={{ lineHeight: '18px', letterSpacing: '1px', mb: '4px' }}>{label}</Typography>
      <Box>{children}</Box>
    </Box>;
  }
  return <Box>
    <Typography variant={'groupLabel'} color={'text.secondary'} sx={{ px: 2, py: 0.75, bgcolor: 'background.default' }}>
      {label}
    </Typography>
    <Box sx={ROWS_SX}>{children}</Box>
  </Box>;
};

// Label and value as divs, never the default p: either can be a whole element (InfoBox's hydration note).
const KV = ({ label, value, kind }) => {
  const sheet = useSheet();
  return <Stack direction={'row'} justifyContent={'space-between'} alignItems={sheet ? 'center' : undefined} gap={sheet ? 1 : 2}
                sx={sheet ? { ...SHEET_LINE, minHeight: 26, boxSizing: 'content-box' } : { px: 2, py: 0.75 }}>
    <Typography variant={'body2'} color={'text.secondary'} component={'div'} sx={sheet ? { whiteSpace: 'nowrap' } : undefined}>{label}</Typography>
    <Typography variant={'body2'} component={'div'} sx={sheet ? SHEET_VALUE_SX : VALUE_SX}>{numOrNode(value, kind)}</Typography>
  </Stack>;
};

Panel.Row = Row;
Panel.Group = Group;
Panel.KV = KV;

export default Panel;
