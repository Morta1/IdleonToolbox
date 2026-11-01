import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { prefix } from '@utility/helpers';

// Level 2 tabs (Tabs board): a part of a tab, at the top of its content. Up to PICKER_AFTER choices they
// are pills that wrap, never a second underline and never behind scroll arrows.
export const PICKER_AFTER = 8;

const sprite = (icon, sx) => (icon ? <Box component="img" src={`${prefix}${icon}.png`} alt="" sx={sx}/> : null);

// A sprite has its box before it loads, so the name beside it does not move when it lands on a slow connection.
export const SPRITE_BOX = { width: 24, height: 24, objectFit: 'contain' };

const PILLS = {
  minHeight: 32,
  mb: 3,
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTabs-flexContainer': { flexWrap: 'wrap', gap: 0.75 }
};

// 32 px, the Controls board's size for section tabs. The open one wears a pressed filter's tint.
const PILL = {
  minWidth: 0, minHeight: 32, height: 32, px: 1.75, py: 0,
  borderRadius: '16px', border: 1, borderColor: 'divider',
  fontSize: 13, fontWeight: 500,
  '&.Mui-selected': { bgcolor: 'primary.soft', borderColor: 'primary.edge' }
};

// names: what a reader sees and hears. A sprite-only pill (iconsOnly) shows its sprite, or the caller's
// own node (components), and carries its name as aria-label.
export const SectionPills = ({ tabs, names, icons, iconsOnly, components, selectedTab, onSelect, label }) => <Tabs
  value={selectedTab}
  onChange={(event, index) => onSelect(index)}
  aria-label={label}
  sx={PILLS}
>
  {tabs.map((tab, index) => <Tab
    key={`${tab}-${index}`}
    iconPosition="start"
    icon={sprite(icons?.[index], SPRITE_BOX)}
    label={iconsOnly ? (components?.[index] ?? '') : (components?.[index] ?? names[index])}
    {...(iconsOnly ? { 'aria-label': names[index] } : {})}
    sx={iconsOnly ? { ...PILL, px: 1 } : PILL}
  />)}
</Tabs>;
