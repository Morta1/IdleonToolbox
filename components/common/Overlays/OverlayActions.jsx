import { Button, Stack } from '@mui/material';

// At most two (Overlays board): the main one contained and last, the other a text button. An action
// without onClick closes. With a danger action (a delete) the other one takes the focus.
const OverlayActions = ({ actions, onClose, sheet = false }) => {
  const ordered = [...actions].sort((a, b) => Number(Boolean(a.main)) - Number(Boolean(b.main)));
  const hasDanger = actions.some((action) => action.danger);
  return <Stack direction="row" justifyContent="flex-end" gap={1}
                sx={{ px: 3, pt: 1.5, pb: sheet ? 'calc(16px + env(safe-area-inset-bottom))' : 2, flexShrink: 0 }}>
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
