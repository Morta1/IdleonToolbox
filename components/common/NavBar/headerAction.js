// The page header's buttons on a phone (Layout3Phone, Tabs board): one row holds the title, a short Pin, Add goal and the
// gear, so each is drawn 32 px tall in 13/500 with a 16 px icon. The hit area stays 44 px: a pseudo-element reaches past
// the drawn button (MUI's buttons are position: relative).
const PHONE = '@media (max-width: 599.95px)';
const HIT_AREA = { content: '""', position: 'absolute', inset: '-6px 0' };

export const headerActionSx = {
  [PHONE]: {
    minHeight: 32, minWidth: 0, px: 0.5, py: 0, fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0,
    '& .MuiButton-startIcon': { mr: 0.5, ml: 0 },
    '& .MuiButton-startIcon svg': { width: 16, height: 16 },
    '&::before': HIT_AREA
  }
};
export const headerIconActionSx = { [PHONE]: { width: 32, height: 32, minWidth: 32, minHeight: 32, p: 0, '&::before': HIT_AREA } };
// The gear alone on a phone, named by the button's aria-label (the words are hidden there)
export const headerGearSx = {
  [PHONE]: {
    width: 32, minWidth: 32, height: 32, minHeight: 32, p: 0,
    '& .MuiButton-startIcon': { m: 0 },
    '&::before': { ...HIT_AREA, inset: '-6px' }
  }
};
export const widerThanPhone = { [PHONE]: { display: 'none' } };
export const phoneOnly = { display: 'none', [PHONE]: { display: 'inline' } };
