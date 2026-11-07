import { Box } from '@mui/material';

// "Can go higher": a plain 10 x 8 triangle in the success colour (the characters board's .up). Its dark edge keeps it
// readable over a sprite. Decorative: whoever draws it names the state.
const UpTriangle = ({ sx }) => <Box component={'span'} aria-hidden={'true'} sx={[
  (theme) => ({
    display: 'inline-block',
    flexShrink: 0,
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: `8px solid ${(theme.vars || theme).palette.success.main}`,
    filter: `drop-shadow(0 0 1px ${(theme.vars || theme).palette.background.default})`
  }),
  ...(Array.isArray(sx) ? sx : [sx])
]}/>;

export default UpTriangle;
