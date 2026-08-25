import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

// The bordered, banded table both the item and the card panel use, matching the shape idleon.wiki
// puts in its top-right infobox. A group is either label/value rows or one full-width block.
const InfoBox = ({ groups }) => {
  const visible = (groups || []).filter((group) => group?.content || group?.rows?.length > 0);
  if (visible.length === 0) return null;

  // No margin of its own: the panel stacks these in one rail and owns the spacing between them.
  return <Box sx={{
    width: { xs: '100%', md: 340 },
    flexShrink: 0,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    overflow: 'hidden'
  }}>
    {visible.map(({ title, rows, content }) => <Box key={title}>
      <Typography
        variant={'caption'}
        component={'div'}
        textAlign={'center'}
        fontWeight={600}
        textTransform={'uppercase'}
        letterSpacing={0.5}
        sx={{ bgcolor: 'action.selected', py: 0.5 }}
      >
        {title}
      </Typography>
      {content ? <Box sx={{ px: 1.5, py: 1 }}>{content}</Box> : null}
      {(rows || []).map(({ label, value, color }, index) => <Stack
        key={`${label}-${index}`}
        direction={'row'}
        justifyContent={'space-between'}
        gap={2}
        sx={{ px: 1.5, py: 0.5, borderTop: index > 0 || content ? '1px solid' : 0, borderColor: 'divider' }}
      >
        <Typography variant={'body2'} color={color || 'text.secondary'}>{label}</Typography>
        {/* A div, not the default p: a value can be a whole element, and CoinDisplay renders
            block content, which inside a <p> is invalid HTML and breaks hydration. */}
        <Typography variant={'body2'} component={'div'} fontWeight={600} textAlign={'right'}>{value}</Typography>
      </Stack>)}
    </Box>)}
  </Box>;
};

export default InfoBox;
