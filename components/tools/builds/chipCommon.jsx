import React from 'react';
import { Typography } from '@mui/material';
import { cleanUnderscore, growth } from '@utility/helpers';
import { formatTalentName } from '@utility/builds/itemRefs';

// Shared chip + talent-tooltip primitives used by both the editor's inline
// mention chip (RichTextEditor.jsx) and the published-view renderer
// (ItemRefRenderer.jsx). Keeping these in one place prevents the two
// surfaces from drifting out of sync on style or tooltip content.

export const CHIP_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  verticalAlign: 'middle',
  padding: '1px 6px 1px 2px',
  borderRadius: 1,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  lineHeight: 1.3,
  cursor: 'help'
};

export const MISSING_CHIP_SX = {
  ...CHIP_SX,
  color: 'rgba(255,255,255,0.5)',
  fontStyle: 'italic',
  cursor: 'default'
};

// Tooltip body for a talent mention. Level defaults to 100 so the computed
// `growth()` values convey magnitude even though a mention doesn't carry a
// specific investment. Kept deliberately compact: name, tab context, scaled
// description.
export const TalentTooltipBody = ({ talent, level = 100 }) => {
  const { name, description, funcX, x1, x2, funcY, y1, y2, tabName } = talent;
  const mainStat = growth(funcX, level, x1, x2);
  const secondaryStat = growth(funcY, level, y1, y2);
  return (
    <>
      <Typography variant="h6">{formatTalentName(name)}</Typography>
      {tabName && (
        <Typography variant="caption" color="text.secondary" display="block">
          {cleanUnderscore(tabName)} tab
        </Typography>
      )}
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        {cleanUnderscore(
          cleanUnderscore(description || '')
            .replace('{', mainStat)
            .replace('}', secondaryStat)
        )}
      </Typography>
    </>
  );
};
