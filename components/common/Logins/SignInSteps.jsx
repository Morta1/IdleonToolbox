import { Box, Stack, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { IconCheck } from '@tabler/icons-react';

// The Sign in board's numbered flow: each step a number, a check once it is done (glyph and word, never
// color alone), a title and the line or control under it.
const SignInSteps = ({ steps }) => <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
  {steps.map(({ title, done, children }, index) => (
    <Stack component="li" key={title} direction="row" gap={1.5} alignItems="flex-start">
      <Box aria-hidden sx={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
        typography: 'caption', fontWeight: 600,
        bgcolor: done ? 'primary.soft' : 'action.hover', color: done ? 'primary.main' : 'text.secondary'
      }}>
        {done ? <IconCheck size={14} stroke={3}/> : index + 1}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600}>
          {title}{done ? <Box component="span" sx={visuallyHidden}>, done</Box> : null}
        </Typography>
        {children ? <Box sx={{ typography: 'body2', color: 'text.secondary', mt: 0.5 }}>{children}</Box> : null}
      </Box>
    </Stack>
  ))}
</Box>;

export default SignInSteps;
