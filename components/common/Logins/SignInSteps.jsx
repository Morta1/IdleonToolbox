import { Box, Stack, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { IconCheck } from '@tabler/icons-react';

// The Sign in board's numbered flow: each step an outlined number, a filled green check once it is done (glyph
// and word, never color alone), a title and the lines or controls under it, one flex item each.
const SignInSteps = ({ steps }) => <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
  {steps.map(({ title, done, children }, index) => (
    <Stack component="li" key={title} direction="row" gap={1.5} alignItems="flex-start">
      <Box aria-hidden sx={{
        width: 24, height: 24, boxSizing: 'border-box', borderRadius: '50%', border: 1, flexShrink: 0, display: 'grid', placeItems: 'center',
        fontSize: 12, fontWeight: 600, borderColor: done ? 'text.success' : 'text.muted',
        bgcolor: done ? 'text.success' : 'transparent', color: done ? 'background.default' : 'text.secondary'
      }}>
        {done ? <IconCheck size={14} stroke={2.5}/> : index + 1}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontSize: 15, fontWeight: 500 }}>
          {title}{done ? <Box component="span" sx={visuallyHidden}>, done</Box> : null}
        </Typography>
        {children ? <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5, fontSize: 13.5, lineHeight: '19px', color: 'text.secondary' }}>
          {children}
        </Box> : null}
      </Box>
    </Stack>
  ))}
</Box>;

export default SignInSteps;
