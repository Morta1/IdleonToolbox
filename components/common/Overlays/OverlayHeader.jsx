import { Box, IconButton, Stack, Typography } from '@mui/material';
import { IconX } from '@tabler/icons-react';

// Title (section-title, 18/600), an optional line under it, an optional aside before the close (a
// breakdown's total), and a 40 px close button that is always there. The title and the aside share a wrapping
// row: beside each other while both fit whole, the aside on its own line under the title when they don't, so
// a long total never squeezes the title into a word per line or draws over it.
const OverlayHeader = ({ titleId, title, subtitle, icon, aside, onClose }) => (
  <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 3, pt: 2, pb: 1.5, flexShrink: 0 }}>
    {icon}
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 1.5, rowGap: 0.5 }}>
      <Box sx={{ flex: '1 1 auto' }}>
        <Typography id={titleId} variant="sectionTitle" component="h2">{title}</Typography>
        {subtitle ? <Box sx={{ typography: 'caption', color: 'text.secondary' }}>{subtitle}</Box> : null}
      </Box>
      {aside ? <Box sx={{ flex: '0 1 auto', maxWidth: '100%' }}>{aside}</Box> : null}
    </Box>
    <IconButton aria-label="Close" onClick={onClose} sx={{ width: 40, height: 40, flexShrink: 0, color: 'text.secondary' }}>
      <IconX size={20}/>
    </IconButton>
  </Stack>
);

export default OverlayHeader;
