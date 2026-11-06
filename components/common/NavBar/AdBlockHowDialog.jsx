import { Box, Stack, Typography } from '@mui/material';
import AppDialog from '@components/common/Overlays/AppDialog';

const BLOCKERS = [
  {
    name: 'uBlock Origin',
    steps: [
      'Click the uBlock Origin icon next to the address bar.',
      'Click the large power button. It turns grey: uBlock Origin is off for this site.'
    ]
  },
  {
    name: 'AdBlock',
    steps: ['Click the AdBlock icon next to the address bar.', 'Choose Pause on this site.']
  },
  {
    name: 'Brave',
    steps: ['Click the lion icon in the address bar.', 'Turn Shields off for this site.']
  }
];

// The steps behind the band's How. Reloading re-checks the blocker; a page load that finds it off
// sends adblock_disabled.
const AdBlockHowDialog = ({ open, onClose }) => (
  <AppDialog open={open} onClose={onClose} size="m" title="Allow ads on this site"
             actions={[{ label: 'Reload the page', main: true, onClick: () => window.location.reload() }]}>
    <Stack gap={2}>
      <Typography color="text.secondary">
        Ads pay for the servers and the time I put into every game update. Your blocker stays on everywhere else.
      </Typography>
      {BLOCKERS.map(({ name, steps }) => (
        <Box key={name}>
          <Typography variant="cardTitle" component="h3">{name}</Typography>
          <Box component="ol" sx={{ typography: 'body2', m: 0, mt: 0.5, pl: 3 }}>
            {steps.map((step) => <li key={step}>{step}</li>)}
          </Box>
        </Box>
      ))}
    </Stack>
  </AppDialog>
);

export default AdBlockHowDialog;
