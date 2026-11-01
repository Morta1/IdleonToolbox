import { Box, IconButton, Stack, Typography } from '@mui/material';
import { IconX } from '@tabler/icons-react';

// Title (section-title, 18/600), an optional line under it, an optional aside before the close (a
// breakdown's total), and a 40 px close button that is always there.
const OverlayHeader = ({ titleId, title, subtitle, icon, aside, onClose }) => (
  <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 3, pt: 2, pb: 1.5, flexShrink: 0 }}>
    {icon}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography id={titleId} variant="sectionTitle" component="h2">{title}</Typography>
      {subtitle ? <Box sx={{ typography: 'caption', color: 'text.secondary' }}>{subtitle}</Box> : null}
    </Box>
    {aside}
    <IconButton aria-label="Close" onClick={onClose} sx={{ width: 40, height: 40, flexShrink: 0, color: 'text.secondary' }}>
      <IconX size={20}/>
    </IconButton>
  </Stack>
);

export default OverlayHeader;
