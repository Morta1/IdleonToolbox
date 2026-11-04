import React from 'react';
import Box from '@mui/material/Box';
import { visuallyHidden } from '@mui/utils';
import StatusText from '@components/common/StatusText';

// label null is for the legend, where the text beside the dot already says what it means.
export const EditedDot = ({ label = 'has edits' }) => <Box component="span" aria-hidden={label ? undefined : true}
                                                         sx={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }}>
  {label ? <Box component="span" sx={visuallyHidden}>{label}</Box> : null}
</Box>;

const EditedTag = () => <StatusText status={'info'} sx={{ ml: 1 }}>Edited</StatusText>;

export default EditedTag;
