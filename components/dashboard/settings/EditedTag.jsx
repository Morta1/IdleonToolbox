import React from 'react';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';

const tagSx = {
  display: 'inline-flex', alignItems: 'center', gap: 0.75, ml: 1, px: 0.875, py: 0.25,
  borderRadius: 1, fontSize: 11, fontWeight: 500, lineHeight: 1.4, verticalAlign: 2
};

// label null is for the legend, where the text beside the dot already says what it means.
export const EditedDot = ({ label = 'has edits' }) => <Box component="span" aria-hidden={label ? undefined : true}
                                                         sx={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }}>
  {label ? <Box component="span" sx={visuallyHidden}>{label}</Box> : null}
</Box>;

const EditedTag = () => <Box component="span" sx={{ ...tagSx, color: 'primary.light', bgcolor: 'action.selected' }}>
  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }}/>
  Edited
</Box>;

export default EditedTag;
