import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import Panel from '@components/common/cards/Panel';

// The panel width from which the rail sits beside the relations: a 480 px column, the 24 px gap and the 340 px box.
export const ROW_FROM = 480 + 24 + 340;

// A group is label/value rows, one full-width block, or both, with an optional sentence under them.
export const visibleGroups = (groups) => (groups || []).filter((group) => group?.content || group?.rows?.length > 0);

// The infobox idleon.wiki keeps top right, one Panel per group. Its width follows the panel's own container: a 340 px box
// under a window's md rule overflowed its column at 900 to 1011, where the rail still sits under the relations.
const InfoBox = ({ groups }) => {
  const visible = visibleGroups(groups);
  if (visible.length === 0) return null;

  // No margin of its own: the panel stacks these in one rail and owns the spacing between them.
  return <Stack gap={2} sx={{ width: '100%', minWidth: 0, flexShrink: 0, [`@container (min-width: ${ROW_FROM}px)`]: { width: 340 } }}>
    {visible.map(({ title, rows, content, note }) => <Panel key={title} title={title}>
      {content ? <Box sx={{ px: 2, py: 1.25 }}>{content}</Box> : null}
      {(rows || []).map(({ label, value }, index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
      {note ? <Typography variant={'caption'} component={'div'} color={'text.secondary'} sx={{ px: 2, py: 1 }}>{note}</Typography> : null}
    </Panel>)}
  </Stack>;
};

export default InfoBox;
