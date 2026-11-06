import React, { useState } from 'react';
import { Box, Button, Tab, Tabs } from '@mui/material';
import { IconChevronDown } from '@tabler/icons-react';
import { prefix } from '@utility/helpers';
import AppDialog from '@components/common/Overlays/AppDialog';
import { useSheet } from '@components/common/cards/SheetContext';

// Level 2 tabs (Tabs board): a part of a tab, at the top of its content. Up to PICKER_AFTER choices they
// are pills that wrap, never a second underline and never behind scroll arrows.
export const PICKER_AFTER = 8;

const sprite = (icon, sx) => (icon ? <Box component="img" src={`${prefix}${icon}.png`} alt="" sx={sx}/> : null);

// A sprite has its box before it loads, so the name beside it does not move when it lands on a slow connection.
export const SPRITE_BOX = { width: 24, height: 24, objectFit: 'contain' };

// Pills and picker cells never scroll, so their list does not clip: the focus ring draws outside a pill or a cell,
// apart from the open one's edge. The 4 px around the list leave it room at the ends.
const UNCLIPPED = {
  overflow: 'visible',
  '& .MuiTabs-scroller': { overflow: 'visible' },
  '& .MuiTabs-indicator': { display: 'none' }
};
const OUTER_RING = { '&.Mui-focusVisible': { outlineOffset: 2 } };

const PILLS = {
  ...UNCLIPPED,
  minHeight: 32,
  // Tighter on a phone, so a row of five (the tournament divisions) stays one row at 384 px.
  '& .MuiTabs-flexContainer': { flexWrap: 'wrap', gap: { xs: 0.5, sm: 0.75 } },
  mb: 3
};

// 32 px, the Controls board's size for section tabs. The open one wears a pressed filter's tint and a primary edge.
const PILL = {
  minWidth: 0, minHeight: 32, height: 32, px: { xs: 1.25, sm: 1.75 }, py: 0,
  borderRadius: '16px', border: 1, borderColor: 'divider',
  fontSize: 13,
  '&.Mui-selected': { bgcolor: 'primary.soft', borderColor: 'primary.main' },
  ...OUTER_RING
};

// Inside a sheet a sprite-only pill is a 32 px circle with a 20 px sprite, 4 px apart, and the row keeps no margin
// (the characters board's .pg).
const SHEET_PILLS = { ...PILLS, '& .MuiTabs-flexContainer': { flexWrap: 'wrap', gap: '4px' }, mb: 0 };
const SHEET_PILL = { ...PILL, minWidth: 32, width: 32, px: 0, '& .MuiTab-icon': { m: 0 } };
const SHEET_SPRITE = { width: 20, height: 20, objectFit: 'contain' };

// names: what a reader sees and hears. A sprite-only pill (iconsOnly) shows its sprite, or the caller's
// own node (components), and carries its name as aria-label.
export const SectionPills = ({ tabs, names, icons, iconsOnly, components, selectedTab, onSelect, label }) => {
  const small = Boolean(useSheet()) && iconsOnly;
  return <Tabs
    value={selectedTab}
    onChange={(event, index) => onSelect(index)}
    aria-label={label}
    sx={small ? SHEET_PILLS : PILLS}
  >
    {tabs.map((tab, index) => <Tab
      key={`${tab}-${index}`}
      iconPosition="start"
      icon={sprite(icons?.[index], small ? SHEET_SPRITE : SPRITE_BOX)}
      label={iconsOnly ? (components?.[index] ?? '') : (components?.[index] ?? names[index])}
      {...(iconsOnly ? { 'aria-label': names[index] } : {})}
      sx={small ? SHEET_PILL : iconsOnly ? { ...PILL, px: 1 } : PILL}
    />)}
  </Tabs>;
};

// A picker cell: the Tabs board's 56 px tile, its sprite in a 64 by 40 box (the cavern banners are about 60 by
// 38, with the name drawn in), drawn at its own size unless that is bigger. The open one: a primary edge, a
// ring inside it and the pressed tint.
const CELL_SPRITE = { width: 64, height: 40, objectFit: 'scale-down' };
const CELL = {
  minWidth: 0, maxWidth: 'none', minHeight: 56, height: 56, p: 0.5,
  borderRadius: '8px', border: 1, borderColor: 'divider', bgcolor: 'background.paper',
  '&.Mui-selected': {
    borderColor: 'primary.main',
    bgcolor: 'primary.soft',
    boxShadow: (theme) => `inset 0 0 0 1px ${(theme.vars || theme).palette.primary.main}`
  },
  ...OUTER_RING
};

// MUI's tab list moves along one line; in a grid ArrowUp and ArrowDown move a whole row.
const moveByRow = (event) => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  const list = event.currentTarget.querySelector('.MuiTabs-flexContainer');
  const cells = [...(list?.querySelectorAll('[role="tab"]') ?? [])];
  const from = cells.indexOf(document.activeElement);
  if (from < 0) return;
  const columns = getComputedStyle(list).gridTemplateColumns.split(' ').length;
  const to = from + (event.key === 'ArrowDown' ? columns : -columns);
  if (to < 0 || to >= cells.length) return;
  event.preventDefault();
  cells[to].focus();
};

// Each cell picks itself, the open one too: MUI Tabs skips onChange for the selected tab, which left the phone's
// sheet open when the player tapped the cavern already shown.
const PickerGrid = ({ tabs, names, icons, selectedTab, onPick, label, columns }) => <Tabs
  value={selectedTab}
  aria-label={label}
  onKeyDown={moveByRow}
  sx={{ ...UNCLIPPED, minHeight: 0, '& .MuiTabs-flexContainer': { display: 'grid', gap: 1, gridTemplateColumns: columns } }}
>
  {tabs.map((tab, index) => <Tab
    key={`${tab}-${index}`}
    icon={sprite(icons?.[index], CELL_SPRITE)}
    // A sprite draws the name; aria-label carries it for a screen reader. Without a sprite the name shows.
    {...(icons?.[index] ? { 'aria-label': names[index] } : { label: names[index] })}
    onClick={() => onPick(index)}
    sx={CELL}
  />)}
</Tabs>;

// Past PICKER_AFTER choices: all of them on screen at once, wrapping, no arrows. On a phone a select shows
// the open one and opens the same grid in a sheet (AppDialog's phone form). Both forms are in the markup
// and CSS picks one, so a phone does not reflow after hydration; MUI skips its layout check on a hidden
// Tabs, so the hidden grid logs nothing.
export const SectionPicker = ({ tabs, names, icons, selectedTab, onSelect, label }) => {
  const [open, setOpen] = useState(false);
  return <Box sx={{ mb: 3 }}>
    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
      <PickerGrid tabs={tabs} names={names} icons={icons} selectedTab={selectedTab} label={label}
                  onPick={(index) => index !== selectedTab && onSelect(index)}
                  // Two even rows on a wide screen (18 caverns: 9 and 9); narrower, as many 80 px cells as fit.
                  columns={{ sm: 'repeat(auto-fill, minmax(80px, 1fr))', lg: `repeat(${Math.ceil(tabs.length / 2)}, minmax(0, 1fr))` }}/>
    </Box>
    <Button
      variant="outlined"
      fullWidth
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`${label}: ${names[selectedTab]}`}
      onClick={() => setOpen(true)}
      endIcon={<IconChevronDown size={18}/>}
      sx={{
        display: { xs: 'flex', sm: 'none' }, justifyContent: 'flex-start', gap: 1.25, px: 1.5,
        color: 'text.primary', borderColor: 'action.disabled',
        '& .MuiButton-endIcon': { ml: 'auto', color: 'text.secondary' }
      }}
    >
      {sprite(icons?.[selectedTab], { width: 52, height: 30, objectFit: 'scale-down' })}
      {names[selectedTab]}
    </Button>
    <AppDialog open={open} onClose={() => setOpen(false)} title={label}>
      <PickerGrid tabs={tabs} names={names} icons={icons} selectedTab={selectedTab} label={label}
                  columns="repeat(4, minmax(0, 1fr))"
                  onPick={(index) => {
                    setOpen(false);
                    if (index !== selectedTab) onSelect(index);
                  }}/>
    </AppDialog>
  </Box>;
};
