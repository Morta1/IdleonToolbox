// The page header's buttons (the row's right end, mock A): one height and one outline, neutral words, a pressed one in
// primary. On a phone (Layout3Phone, Tabs board) each is drawn 32 px tall in 13 px with a 16 px icon. The hit area stays
// 44 px: a pseudo-element reaches past the drawn button (MUI's buttons are position: relative).
const PHONE = '@media (max-width: 599.95px)';
const HIT_AREA = { content: '""', position: 'absolute', inset: '-6px 0' };

export const headerActionSx = {
  color: 'text.primary', borderColor: 'outline', fontWeight: 400, whiteSpace: 'nowrap', flexShrink: 0, pl: '10px', pr: 1.5,
  '& .MuiButton-startIcon': { ml: 0, mr: 0.75 },
  '& .MuiButton-startIcon svg': { width: 18, height: 18 },
  '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
  [PHONE]: {
    minHeight: 32, minWidth: 0, pl: '6px', pr: 1, py: 0, fontSize: 13,
    '& .MuiButton-startIcon': { mr: 0.5, ml: 0 },
    '& .MuiButton-startIcon svg': { width: 16, height: 16 },
    '&::before': HIT_AREA
  }
};
// Goals and its +: one control, each half its own button. The + draws the line between them.
export const headerJoinStartSx = { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 };
export const headerJoinEndSx = {
  borderTopLeftRadius: 0, borderBottomLeftRadius: 0, minWidth: 39, px: 0,
  '& svg': { width: 18, height: 18 },
  [PHONE]: { minWidth: 31, px: 0, '& svg': { width: 16, height: 16 } }
};
// The gear alone on a phone, named by the button's aria-label (the words are hidden there)
export const headerGearSx = {
  [PHONE]: {
    width: 32, minWidth: 32, height: 32, minHeight: 32, p: 0,
    '& .MuiButton-startIcon': { m: 0 },
    '&::before': { ...HIT_AREA, inset: '-6px' }
  }
};
export const widerThanPhone = { [PHONE]: { display: 'none' } };
