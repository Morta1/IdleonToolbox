import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { KIND_PLURALS, KIND_SHORT_PLURALS } from '@utility/wiki/kind-labels.mjs';
import { KIND_ART } from './kind-art';
import { prefix } from '@utility/helpers';

// A system's kinds and a shortLabels group's loose kinds drop the words their heading already says.
export const kindLabel = (kind, { short = false } = {}) => (short && KIND_SHORT_PLURALS[kind]) || KIND_PLURALS[kind] || kind;

// One category row, shared by the rail and the home's index. The home passes `count`, a smaller art size
// and `compact`, which drops the text's vertical margin so its card stays dense.
export const KindLink = ({ kind, label, current, go, inset, count, artSize = 24, compact = false }) => <ListItemButton
  component={'a'}
  href={`/wiki/${kind}`}
  selected={kind === current}
  onClick={(event) => go(event, `/wiki/${kind}`)}
  sx={inset ? { pl: 4 } : null}>
  <ListItemIcon sx={{ minWidth: artSize + 10 }}>
    <img src={`${prefix}${KIND_ART[kind]}`} alt="" width={artSize} height={artSize}
         style={{ objectFit: 'contain' }}/>
  </ListItemIcon>
  <ListItemText primary={label || kindLabel(kind)} sx={{ minWidth: 0, ...(compact ? { my: 0 } : null) }}/>
  {count == null ? null : <Typography variant={'caption'} color={'text.secondary'} sx={{ flexShrink: 0, pl: 1 }}>
    {count.toLocaleString('en-US')}
  </Typography>}
</ListItemButton>;
