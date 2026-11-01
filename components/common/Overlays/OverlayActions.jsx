import { Button, Stack } from '@mui/material';

// At most two (Overlays board): the main one contained and last, the other a text button. An action
// without onClick closes. With a danger action (a delete) the other one takes the focus.
// On a sheet the actions clear the phone's safe area and, until it is answered, the consent banner.
const SHEET_BOTTOM = 'calc(16px + env(safe-area-inset-bottom) + var(--consent-banner-height, 0px))';

const OverlayActions = ({ actions, onClose, sheet = false }) => {
  const ordered = [...actions].sort((a, b) => Number(Boolean(a.main)) - Number(Boolean(b.main)));
  const hasDanger = actions.some((action) => action.danger);
  return <Stack direction="row" justifyContent="flex-end" gap={1}
                sx={{ px: 3, pt: 1.5, pb: sheet ? SHEET_BOTTOM : 2, flexShrink: 0 }}>
    {ordered.map(({ label, main, danger, disabled, onClick }) => (
      <Button key={label} variant={main ? 'contained' : 'text'} color={danger ? 'error' : 'primary'}
              disabled={disabled} autoFocus={!main && hasDanger} sx={sheet ? { flex: 1 } : undefined}
              onClick={onClick ?? onClose}>
        {label}
      </Button>
    ))}
  </Stack>;
};

export default OverlayActions;
